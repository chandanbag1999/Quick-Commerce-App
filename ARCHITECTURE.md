# GoBasket — System Architecture

> This document explains HOW GoBasket is built and WHY each architectural decision was made.

---

## High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPS                              │
│            Mobile App (React Native) | Web App (Next.js)       │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                           │
│              Rate Limiting | CORS | Request Logging            │
│                     (Fastify + Plugins)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
│   AUTH ROUTES   │ │ PUBLIC ROUTES│ │  ADMIN ROUTES  │
│ /auth/login     │ │ /products    │ │ /admin/...     │
│ /auth/register  │ │ /categories  │ │ (protected)    │
│ /auth/otp       │ │ /search      │ │                │
└────────┬────────┘ └──────┬───────┘ └───────┬────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
│   AuthService | ProductService | OrderService | PaymentService │
│              CartService | InventoryService | NotificationService│
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
│   POSTGRESQL    │ │    REDIS     │ │   JOB QUEUE    │
│   (Prisma ORM)  │ │  (Upstash)   │ │   (BullMQ)     │
│                 │ │              │ │                │
│ Users           │ │ Session cache│ │ Email jobs     │
│ Products        │ │ Product cache│ │ SMS/OTP jobs   │
│ Orders          │ │ Cart data    │ │ Order jobs     │
│ Payments        │ │ Rate limits  │ │ Inventory jobs │
│ Inventory       │ │ OTP storage  │ │                │
└─────────────────┘ └──────────────┘ └───────┬────────┘
                                              │
                                    ┌─────────▼────────┐
                                    │  EXTERNAL SERVICES│
                                    │  Resend (Email)   │
                                    │  Twilio (SMS)     │
                                    │  FCM (Push)       │
                                    │  Razorpay (Pay)   │
                                    │  Cloudinary (Imgs)│
                                    └──────────────────┘
```

---

## Architecture Pattern: Modular Monolith

### Why NOT the Old Structure (Horizontal/Layered)

The previous structure organized by **technical role**:
```
controllers/          ← all controllers from all features
services/             ← all services from all features
repositories/         ← all repositories from all features
```

**Problems with that approach:**
- To work on "auth", you jump across 5+ folders simultaneously
- A new developer must understand the ENTIRE codebase to work on ONE feature
- Adding a new feature means touching every top-level folder
- Cannot extract a module to a microservice — too entangled
- Does NOT scale when the team grows beyond 3 developers

### Why the Modular Monolith (Vertical Slicing)

The new structure organizes by **business domain**:
```
modules/auth/         ← EVERYTHING auth lives here
modules/products/     ← EVERYTHING products lives here
modules/orders/       ← EVERYTHING orders lives here
```

**Benefits:**
- Work on "auth"? Open `modules/auth/` — everything is there
- New feature? Create one new folder under `modules/`
- New developer? Can own ONE module without knowing the rest
- Future microservices? Each module folder IS a future microservice
- This is how Zepto, Swiggy, Netflix scale their backends

**Industry validation (2025-2026):**
- This is the pattern used by NestJS (most hired Node.js framework in India)
- Recommended by [thetshaped.dev](https://thetshaped.dev/p/how-to-better-structure-your-nodejs-project-modular-monolith)
- Used in production Fastify boilerplates: [marcoturi/fastify-boilerplate](https://github.com/marcoturi/fastify-boilerplate), [node-fastify-architecture](https://github.com/sujeet-agrahari/node-fastify-architecture)

---

## Folder Structure (Modular Monolith)

```
gobasket-backend/
│
├── src/
│   │
│   ├── modules/                        # ← DOMAIN MODULES (vertical slices)
│   │   │                                 Each module owns ALL its layers.
│   │   │                                 This is the heart of the architecture.
│   │   │
│   │   ├── auth/                       # Authentication & Authorization domain
│   │   │   ├── auth.module.ts          # Fastify plugin — registers this module
│   │   │   ├── auth.routes.ts          # HTTP route definitions (thin)
│   │   │   ├── auth.controller.ts      # Parse request → call service → format response
│   │   │   ├── auth.service.ts         # Business logic (the brain of auth)
│   │   │   ├── auth.repository.ts      # Database queries for auth
│   │   │   ├── auth.schema.ts          # Zod + JSON Schema validation
│   │   │   └── auth.types.ts           # TypeScript interfaces for auth
│   │   │
│   │   ├── users/                      # User profile & address management
│   │   │   ├── users.module.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.schema.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── products/                   # Product catalog management
│   │   │   ├── products.module.ts
│   │   │   ├── products.routes.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   ├── products.schema.ts
│   │   │   └── products.types.ts
│   │   │
│   │   ├── categories/                 # Category & subcategory tree
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.routes.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── categories.repository.ts
│   │   │   ├── categories.schema.ts
│   │   │   └── categories.types.ts
│   │   │
│   │   ├── cart/                       # Shopping cart
│   │   │   ├── cart.module.ts
│   │   │   ├── cart.routes.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── cart.repository.ts
│   │   │   ├── cart.schema.ts
│   │   │   └── cart.types.ts
│   │   │
│   │   ├── orders/                     # Order lifecycle management
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.routes.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.repository.ts
│   │   │   ├── orders.schema.ts
│   │   │   ├── orders.types.ts
│   │   │   └── jobs/                   # Module-specific background jobs
│   │   │       ├── order-confirmation.job.ts
│   │   │       └── order-status-update.job.ts
│   │   │
│   │   ├── payments/                   # Razorpay payment processing
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.routes.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── payments.repository.ts
│   │   │   ├── payments.schema.ts
│   │   │   ├── payments.types.ts
│   │   │   └── webhooks/               # Razorpay webhook handlers
│   │   │       └── razorpay.webhook.ts
│   │   │
│   │   ├── inventory/                  # Stock management & deduction
│   │   │   ├── inventory.module.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── inventory.repository.ts
│   │   │   ├── inventory.schema.ts
│   │   │   └── inventory.types.ts
│   │   │
│   │   ├── delivery/                   # Delivery slots & tracking
│   │   │   ├── delivery.module.ts
│   │   │   ├── delivery.routes.ts
│   │   │   ├── delivery.controller.ts
│   │   │   ├── delivery.service.ts
│   │   │   ├── delivery.repository.ts
│   │   │   ├── delivery.schema.ts
│   │   │   └── delivery.types.ts
│   │   │
│   │   └── notifications/              # Email, SMS, push notifications
│   │       ├── notifications.module.ts
│   │       ├── notifications.service.ts
│   │       ├── notifications.types.ts
│   │       └── workers/                # BullMQ workers for this module
│   │           ├── email.worker.ts
│   │           └── sms.worker.ts
│   │
│   ├── shared/                         # ← SHARED CODE (used by ALL modules)
│   │   │                                 Modules import FROM shared, never from each other.
│   │   │                                 This prevents circular dependencies.
│   │   │
│   │   ├── database/
│   │   │   ├── prisma.client.ts        # Prisma singleton (one connection for the app)
│   │   │   └── transaction.helper.ts   # Database transaction utilities
│   │   │
│   │   ├── cache/
│   │   │   ├── redis.client.ts         # Redis singleton
│   │   │   └── cache.helper.ts         # get/set/del with serialization
│   │   │
│   │   ├── queue/
│   │   │   ├── queue.client.ts         # BullMQ Queue factory
│   │   │   └── base.worker.ts          # Abstract base worker class
│   │   │
│   │   ├── errors/
│   │   │   ├── app.error.ts            # Base AppError class
│   │   │   └── http.errors.ts          # NotFoundError, BadRequestError, etc.
│   │   │
│   │   ├── types/
│   │   │   ├── fastify.d.ts            # Extend Fastify with custom decorations
│   │   │   └── common.types.ts         # PaginatedResponse, ApiResponse, etc.
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.ts               # Pino logger configuration
│   │   │   ├── crypto.ts               # Hashing, token generation
│   │   │   ├── pagination.ts           # Cursor/offset pagination helpers
│   │   │   └── response.ts             # Standardized API response builders
│   │   │
│   │   └── middlewares/
│   │       ├── authenticate.ts         # JWT verification hook
│   │       └── authorize.ts            # Role-based access control hook
│   │
│   ├── plugins/                        # ← FASTIFY GLOBAL PLUGINS
│   │   │                                 Registered once, available everywhere.
│   │   ├── cors.plugin.ts
│   │   ├── helmet.plugin.ts
│   │   ├── rate-limit.plugin.ts
│   │   ├── swagger.plugin.ts
│   │   └── error-handler.plugin.ts     # Global error handler
│   │
│   ├── config/
│   │   └── env.ts                      # Env variable validation with Zod
│   │
│   ├── app.ts                          # Fastify app factory — registers all modules
│   └── server.ts                       # Entry point — starts the HTTP server
│
├── prisma/
│   ├── schema.prisma                   # Database schema (source of truth)
│   ├── migrations/                     # Auto-generated migration SQL files
│   └── seed.ts                         # Seed script for development data
│
├── tests/                              # ← Tests MIRROR the modules structure
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.service.test.ts    # Unit test: business logic only
│   │   │   └── auth.routes.test.ts     # Integration test: full HTTP request
│   │   ├── products/
│   │   │   ├── products.service.test.ts
│   │   │   └── products.routes.test.ts
│   │   ├── cart/
│   │   ├── orders/
│   │   └── payments/
│   ├── shared/
│   │   └── utils.test.ts
│   └── helpers/
│       ├── test-app.ts                 # Build Fastify instance for tests (no port)
│       └── factories.ts                # Test data factories (create fake users, products)
│
├── docs/                               # All our .md guide files
│   ├── MASTER_PLAN.md
│   ├── PHILOSOPHY.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── SESSION_LOG.md
│   └── DAY_XX_*.md
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vitest.config.ts
```

---

## How a Module Is Structured (Anatomy)

Every module follows the SAME internal pattern — predictability is a feature.

```
modules/orders/
├── orders.module.ts      ← Entry point. Registers the module as a Fastify plugin.
├── orders.routes.ts      ← Maps URL + HTTP method → controller function
├── orders.controller.ts  ← Reads request, calls service, sends response
├── orders.service.ts     ← Business logic. No HTTP knowledge here.
├── orders.repository.ts  ← Database queries only. No business logic here.
├── orders.schema.ts      ← Zod schemas for request/response validation
├── orders.types.ts       ← TypeScript interfaces specific to this module
└── jobs/                 ← If this module needs background jobs
    └── order-confirmation.job.ts
```

### The Module File (`orders.module.ts`) — The Most Important Pattern

```typescript
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { ordersRoutes } from './orders.routes.js'

// fp() = fastify-plugin. Makes this module share the parent's context
// (database, cache, JWT decorations) without creating a new scope.
export default fp(
  async function ordersModule(fastify: FastifyInstance) {
    fastify.register(ordersRoutes, { prefix: '/api/v1' })
  },
  {
    name: 'orders-module',
    dependencies: ['database', 'cache', 'auth'],   // must be registered first
  }
)
```

### How app.ts Assembles Modules

```typescript
// src/app.ts
export async function buildApp() {
  const app = Fastify({ ... })

  // 1. Global Fastify plugins (apply to ALL routes)
  await app.register(corsPlugin)
  await app.register(helmetPlugin)
  await app.register(rateLimitPlugin)
  await app.register(swaggerPlugin)
  await app.register(errorHandlerPlugin)

  // 2. Shared infrastructure (database, cache — available to all modules)
  await app.register(databasePlugin)   // decorates app with app.db (Prisma)
  await app.register(cachePlugin)      // decorates app with app.cache (Redis)

  // 3. Domain modules (order matters — auth before everything that uses auth)
  await app.register(authModule)
  await app.register(usersModule)
  await app.register(categoriesModule)
  await app.register(productsModule)
  await app.register(inventoryModule)
  await app.register(cartModule)
  await app.register(deliveryModule)
  await app.register(ordersModule)
  await app.register(paymentsModule)
  await app.register(notificationsModule)

  return app
}
```

---

## Module Communication Rules

Modules in a modular monolith must NOT import directly from each other. This prevents tight coupling and circular dependencies.

```
❌ WRONG:
// Inside cart.service.ts
import { ProductService } from '../products/products.service.js'
// Now cart is tightly coupled to products. You can never separate them.

✅ CORRECT Option 1 — Call through Repository:
// cart.service.ts queries product data through its own repository
const product = await this.cartRepository.findProductById(productId)

✅ CORRECT Option 2 — Shared events/queue:
// cart.service.ts emits an event, orders module listens
await queue.add('order.placed', { orderId, userId })

✅ CORRECT Option 3 — Shared types only:
// modules can import TYPES from shared/, not from each other
import type { ProductSnapshot } from '../../shared/types/common.types.js'
```

---

## Database Schema Overview

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│    User     │    │    Product      │    │  Category   │
│─────────────│    │─────────────────│    │─────────────│
│ id (uuid)   │    │ id (uuid)       │    │ id (uuid)   │
│ phone       │    │ name            │    │ name        │
│ email       │    │ description     │    │ slug        │
│ name        │    │ price           │    │ parentId    │◄─┐
│ role        │    │ mrp             │    │ imageUrl    │  │
│ isVerified  │    │ images[]        │    │             │  │
│ createdAt   │    │ categoryId ─────┼────► id          │  │
└──────┬──────┘    │ stock           │    └─────────────┘  │
       │           │ unit            │                     │
       │           │ status          │    Self-relation for│
       │           │ createdAt       │    nested categories│
       │           └────────┬────────┘
       │                    │
┌──────▼──────┐    ┌────────▼────────┐    ┌─────────────┐
│   Address   │    │   CartItem      │    │    Cart     │
│─────────────│    │─────────────────│    │─────────────│
│ id          │    │ id              │    │ id          │
│ userId ─────┘    │ cartId ─────────┼────► id          │
│ label       │    │ productId       │    │ userId      │
│ line1       │    │ quantity        │    │ createdAt   │
│ city        │    │ price           │    └─────────────┘
│ pincode     │    └─────────────────┘
│ isDefault   │
└─────────────┘

┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│    Order    │    │   OrderItem     │    │   Payment   │
│─────────────│    │─────────────────│    │─────────────│
│ id          │    │ id              │    │ id          │
│ userId      │    │ orderId ────────┼────► id          │
│ addressId   │    │ productId       │    │ orderId     │
│ status      │    │ quantity        │    │ amount      │
│ totalAmount │    │ price           │    │ status      │
│ paymentId   │    │ name (snapshot) │    │ razorpayId  │
│ deliverySlot│    └─────────────────┘    │ method      │
│ createdAt   │                           └─────────────┘
└─────────────┘
```

### Order Status (Finite State Machine)
```
PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
    ↓           ↓          ↓               ↓
CANCELLED   CANCELLED  CANCELLED      RETURNED
```

---

## API Versioning Strategy

All APIs are versioned from Day 1:
```
/api/v1/auth/login
/api/v1/products
/api/v1/orders
```

**Why?** When you update the API, you don't break existing mobile apps.
Old app still uses `/v1`, new app uses `/v2`.
This is how Zepto, Swiggy, Zomato all work.

---

## Security Architecture

1. **Authentication:** JWT access token (15min) + Refresh token (7 days)
2. **Authorization:** Role-based (USER, ADMIN, DELIVERY_PARTNER)
3. **Rate Limiting:** 100 req/min per IP, 10 login attempts/hour
4. **Input Validation:** Every endpoint has Zod schema validation
5. **SQL Injection:** Prisma uses parameterized queries (safe by default)
6. **Password:** bcrypt with cost factor 12
7. **OTP:** 6-digit, expires in 5 minutes, stored in Redis
8. **Payment:** Webhook signature verification (Razorpay HMAC-SHA256)
9. **CORS:** Whitelist only known origins
10. **Headers:** Helmet.js sets security headers

---

## Caching Strategy (Redis)

| Data | Cache? | TTL | Invalidation |
|------|--------|-----|-------------|
| Product list | Yes | 10 min | On product update |
| Product detail | Yes | 30 min | On product update |
| Category tree | Yes | 1 hour | On category update |
| User cart | Yes | 24 hours | On cart change |
| User profile | Yes | 30 min | On profile update |
| OTP | Yes | 5 min | After verification |
| Rate limit counters | Yes | 1 min | Auto-expiry |

---

*Architecture is finalized for Days 1-30. Update this file if architecture changes.*
