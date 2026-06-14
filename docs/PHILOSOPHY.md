# GoBasket — Project Philosophy & Working Principles

> "Build it like you're going to maintain it for 10 years. Code it like you're going to explain it in an interview tomorrow."

---

## The Zero Assumption Protocol

This is the most important rule of this project.

### Before Every Session
```
1. Read MEMORY.md → Know the project context
2. Read MASTER_PLAN.md → Know the 30-day roadmap position
3. Read today's DAY_XX guide → Know what to build today
4. Check git log → Know what was done last
5. THEN write code
```

### Before Every Feature
```
1. Why does this feature exist? (business reason)
2. What does it depend on? (prerequisites)
3. What will depend on it? (downstream impact)
4. What can go wrong? (edge cases)
5. How will you test it?
THEN write the code.
```

---

## Why Philosophy Matters for a Developer

Companies in 2026 don't just hire people who can code. They hire people who:
- Think before typing
- Understand the WHY behind every decision
- Can explain their code to non-technical stakeholders
- Write code that other developers can maintain
- Anticipate problems before they happen

This project trains all of that.

---

## The Enterprise Grade Standard

**What "enterprise grade" means:**
- Code that 10 developers can work on simultaneously
- APIs that 1 million users can use without breaking
- Systems that fail gracefully, not catastrophically
- Code that is readable without comments
- Features that are testable in isolation
- Deployments that can be rolled back in 60 seconds

**What it does NOT mean:**
- Over-engineered
- Unnecessarily complex
- Premature optimization
- Using 10 libraries when 2 work fine

---

## Code Quality Principles

### 1. Naming Is Documentation
```typescript
// BAD — what does this do?
const d = await db.findMany({ where: { s: 1 } })

// GOOD — self-explanatory
const activeProducts = await prisma.product.findMany({
  where: { status: 'ACTIVE' }
})
```

### 2. Functions Do One Thing
```typescript
// BAD — does too many things
async function createOrder(userId, cartId, paymentData) {
  // validates cart
  // calculates price
  // creates order
  // processes payment
  // sends email
  // updates inventory
}

// GOOD — each function has ONE responsibility
async function createOrder(userId: string, cartId: string): Promise<Order> {}
async function processPayment(orderId: string, paymentData: PaymentData): Promise<Payment> {}
async function sendOrderConfirmation(orderId: string): Promise<void> {}
```

### 3. Error Handling Is Not Optional
```typescript
// BAD — silent failure
const user = await prisma.user.findUnique({ where: { id } })
return user.email  // crashes if user is null

// GOOD — explicit error handling
const user = await prisma.user.findUnique({ where: { id } })
if (!user) {
  throw new NotFoundError(`User ${id} not found`)
}
return user.email
```

### 4. Never Trust User Input
```typescript
// BAD — trusts request body blindly
app.post('/order', async (req) => {
  await createOrder(req.body.userId, req.body.amount)
})

// GOOD — validate everything at the boundary
const createOrderSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().max(100000)
})
app.post('/order', async (req) => {
  const body = createOrderSchema.parse(req.body)  // throws if invalid
  await createOrder(body.userId, body.amount)
})
```

---

## The Architecture: Modular Monolith

GoBasket uses a **Modular Monolith** — one deployable app, but organized by domain modules not technical layers.

### The Flow Inside Each Module

```
Request → Module Routes → Controller → Service → Repository → Database
               ↕               ↕            ↕          ↕
           JSON Schema     Validation   Business    Data Access
           (Fastify)        (Zod)        Logic     (Prisma ORM)
```

### Old (Layered/Horizontal) vs New (Modular/Vertical)

```
❌ OLD — Layered (technical role grouping):       ✅ NEW — Modular (domain grouping):
src/                                              src/
├── controllers/                                  ├── modules/
│   ├── auth.controller.ts                        │   ├── auth/
│   ├── products.controller.ts                    │   │   ├── auth.module.ts
│   └── orders.controller.ts                      │   │   ├── auth.routes.ts
├── services/                                     │   │   ├── auth.controller.ts
│   ├── auth.service.ts                           │   │   ├── auth.service.ts
│   ├── products.service.ts                       │   │   ├── auth.repository.ts
│   └── orders.service.ts                         │   │   ├── auth.schema.ts
└── repositories/                                 │   │   └── auth.types.ts
    ├── user.repository.ts                        │   └── products/
    └── product.repository.ts                     │       └── ... (same pattern)
                                                  └── shared/
To work on auth: visit 3+ folders.                    └── errors/, cache/, db/, utils/
```

### The Layers Inside Every Module (Same as Before, but INSIDE One Folder)

| Layer | File | Responsibility | Knows About |
|-------|------|---------------|-------------|
| Module | `*.module.ts` | Register module as Fastify plugin | Fastify only |
| Routes | `*.routes.ts` | Map HTTP paths + schemas → controller | HTTP, schemas |
| Controller | `*.controller.ts` | Parse request, call service, send response | Request/Response |
| Service | `*.service.ts` | Business logic, orchestration | Business rules only |
| Repository | `*.repository.ts` | Database queries only | Prisma, SQL |
| Schema | `*.schema.ts` | Zod + JSON Schema validation | Validation shapes |
| Types | `*.types.ts` | TypeScript interfaces for this module | Nothing |

### Shared Code Rule

Modules NEVER import from each other. If two modules need the same thing, it goes to `shared/`.

```
shared/database/    ← Prisma client (all modules use this)
shared/cache/       ← Redis client (all modules use this)
shared/errors/      ← Error classes (all modules use this)
shared/utils/       ← Helpers (all modules use this)
shared/middlewares/ ← Auth hooks (all modules use this)
```

---

## Git Commit Philosophy

Every commit tells a story. Future-you (and interviewers) will read it.

```
feat: add product search with full-text PostgreSQL search
fix: handle out-of-stock race condition in cart checkout
refactor: extract payment processing into PaymentService
test: add integration tests for order creation flow
docs: add Razorpay webhook setup guide
chore: upgrade Prisma to 5.14
```

**Format:** `type(scope): message`
**Types:** `feat | fix | refactor | test | docs | chore | perf`

---

## Interview Preparation Built Into This Project

At every stage, you should be able to answer:
1. **Why did you choose X over Y?** (Fastify over Express, Prisma over Sequelize)
2. **How would this scale to 10x users?** (caching strategy, horizontal scaling)
3. **What happens if the payment fails mid-order?** (transaction rollback, idempotency)
4. **How do you prevent two users from buying the last item?** (optimistic locking, Redis)
5. **How would you add a new feature without breaking existing ones?** (layered architecture, tests)

---

## The 2026 Indian Job Market Reality

**What Kolkata/Indian companies want:**
- Node.js (Express or Fastify) — most common
- PostgreSQL or MySQL — relational DB is back
- Redis — everyone uses it
- Docker — minimum requirement
- Git/GitHub — non-negotiable
- TypeScript — growing fast, companies prefer it
- REST APIs + Swagger — standard
- Payment gateways (Razorpay/Paytm/Stripe) — valued

**Salary expectations (2026 India):**
- 0-1 years: ₹4-8 LPA
- 1-2 years: ₹8-15 LPA
- 2-3 years: ₹15-25 LPA
- With Zepto/Blinkit-scale project in portfolio: +30-50% premium

**Global remote (USD):**
- Entry level with strong portfolio: $30-50k/year
- Mid-level: $60-90k/year

---

*Read this file at the start of every session. It is your compass.*
