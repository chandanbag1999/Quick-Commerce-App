# GoBasket — Zepto-like Backend Master Plan

> **Project:** GoBasket | **Started:** 2026-06-13 | **Target:** Job-ready backend developer

---

## What Are We Building?

GoBasket is a **Quick Commerce Backend** — like Zepto, Blinkit, or Swiggy Instamart. These apps deliver groceries in 10 minutes. Building this backend from scratch will teach you **every skill** that Indian and global companies hire backend developers for in 2026.

### Why Zepto-Clone?
- **Complexity:** It has every backend concept: auth, real-time inventory, payments, queues, caching
- **Market relevance:** Quick commerce is booming in India (Zepto, Blinkit, Swiggy Instamart, Dunzo)
- **Interview value:** You can explain every decision to an interviewer
- **Full-stack thinking:** Teaches you to think about real business problems, not toy projects

---

## The 30-Day Roadmap

### Phase 1: Foundation (Day 1–3)
**Goal:** Set up the development environment and understand Node.js + TypeScript deeply.

| Day | Topic | Outcome |
|-----|-------|---------|
| 1 | Environment, TypeScript, Fastify basics, project structure | Running "Hello GoBasket" server |
| 2 | Fastify deep dive — plugins, hooks, lifecycle, schemas | Structured Fastify server with routes |
| 3 | Git mastery + pnpm + project conventions | Professional Git workflow |

### Phase 2: Database Design (Day 4–7)
**Goal:** Design and implement the entire database schema for GoBasket.

| Day | Topic | Outcome |
|-----|-------|---------|
| 4 | PostgreSQL fundamentals, Supabase setup, psql CLI | Running PostgreSQL locally + cloud |
| 5 | Prisma ORM setup, schema design — Users, Products, Categories | First migrations running |
| 6 | Prisma schema — Cart, Orders, Inventory, Addresses | Complete schema with relations |
| 7 | Prisma Client, seeding, migrations workflow | Database fully set up with sample data |

### Phase 3: Authentication (Day 8–10)
**Goal:** Implement production-grade auth system.

| Day | Topic | Outcome |
|-----|-------|---------|
| 8 | JWT concepts, register/login API, bcrypt password hashing | Working auth endpoints |
| 9 | Refresh tokens, token rotation, logout, Fastify JWT plugin | Complete JWT cycle |
| 10 | OTP-based login (Indian standard), Redis for OTP storage | Phone number OTP auth |

### Phase 4: Core APIs (Day 11–14)
**Goal:** Build all product, category, and user management APIs.

| Day | Topic | Outcome |
|-----|-------|---------|
| 11 | Products CRUD, image upload (Cloudinary), search | Product management APIs |
| 12 | Categories & subcategories, nested tree structure | Category hierarchy APIs |
| 13 | User profile, address management, multiple addresses | User management APIs |
| 14 | Pagination, filtering, sorting — enterprise patterns | Production-ready list APIs |

### Phase 5: Business Logic (Day 15–18)
**Goal:** The heart of the app — cart, orders, and inventory.

| Day | Topic | Outcome |
|-----|-------|---------|
| 15 | Cart API — add, remove, update, price calculation | Working cart system |
| 16 | Order placement, order states (FSM pattern), validation | Order creation flow |
| 17 | Inventory management, stock deduction, race condition handling | Concurrent-safe inventory |
| 18 | Delivery slots, order tracking, cancellation flow | Complete order lifecycle |

### Phase 6: Payments (Day 19–21)
**Goal:** Integrate Razorpay (Indian market standard).

| Day | Topic | Outcome |
|-----|-------|---------|
| 19 | Razorpay setup, create order, payment initiation | Payment initiation API |
| 20 | Razorpay webhooks, signature verification, idempotency | Secure payment completion |
| 21 | Refunds, payment states, transaction history | Complete payment system |

### Phase 7: Background Jobs & Notifications (Day 22–24)
**Goal:** Async processing — the backbone of scalable systems.

| Day | Topic | Outcome |
|-----|-------|---------|
| 22 | BullMQ setup, job queues, retry logic, dead letter queues | Working job queue system |
| 23 | Email notifications (Resend), order confirmation, OTP emails | Email system |
| 24 | Push notifications (FCM), in-app notifications system | Notification system |

### Phase 8: Performance & Security (Day 25–27)
**Goal:** Make it fast, safe, and production-ready.

| Day | Topic | Outcome |
|-----|-------|---------|
| 25 | Redis caching — cache aside pattern, cache invalidation | API response caching |
| 26 | Rate limiting, CORS, Helmet.js, input sanitization | Security hardened APIs |
| 27 | Query optimization, database indexes, N+1 problem fixes | Optimized database layer |

### Phase 9: Testing, Docker & Deployment (Day 28–30)
**Goal:** Ship it like a professional.

| Day | Topic | Outcome |
|-----|-------|---------|
| 28 | Vitest — unit tests, integration tests, API testing | 80%+ test coverage |
| 29 | Docker + Docker Compose for full stack | Containerized application |
| 30 | GitHub Actions CI/CD, deploy to Railway/Render | Live production deployment |

---

## Skills You'll Have After 30 Days

### Technical Skills (What HR Looks For in 2026)
- [ ] TypeScript (intermediate-advanced)
- [ ] Node.js (Fastify framework)
- [ ] PostgreSQL + complex SQL queries
- [ ] Prisma ORM
- [ ] Redis (caching + session management)
- [ ] REST API design (OpenAPI 3.0)
- [ ] JWT authentication + refresh tokens
- [ ] OTP authentication (Indian market standard)
- [ ] Payment gateway integration (Razorpay)
- [ ] Message queues (BullMQ)
- [ ] Docker + Docker Compose
- [ ] Git + GitHub (branching strategy, PR workflow)
- [ ] Testing (Vitest, unit + integration)
- [ ] CI/CD (GitHub Actions)
- [ ] System design fundamentals

### Concepts You'll Understand Deeply
- [ ] Database design & normalization
- [ ] ACID transactions
- [ ] Race condition handling
- [ ] Idempotency in payments
- [ ] Cache invalidation strategies
- [ ] Finite State Machine (order states)
- [ ] Event-driven architecture
- [ ] Rate limiting strategies
- [ ] Security best practices (OWASP Top 10)

---

## How to Use This Project for Job Applications

1. **GitHub Portfolio:** Push every day's work with meaningful commits
2. **README.md:** Write a professional README with architecture diagram
3. **Live Demo:** Deploy on Railway/Render (Day 30)
4. **Postman Collection:** Export all API calls for interviewers
5. **Interview Stories:** For every feature, know the WHY and the challenges faced

---

## The Zero Assumption Protocol

Before every coding session:
1. Read `MASTER_PLAN.md` (this file) — know where you are in the roadmap
2. Read the current day's guide file
3. Check what was built last (git log or check directory)
4. Read PHILOSOPHY.md for working principles
5. THEN write code

---

*Last Updated: 2026-06-13 | Next: Read DAY_01_FOUNDATION.md*
