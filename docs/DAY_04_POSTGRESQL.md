# Day 4 — PostgreSQL: Database Foundation

> **Date:** 2026-06-14 | **Phase:** 2 (Database Design) | **Day:** 4 of 30

---

## Before You Start (Zero Assumption Check)
- [ ] Read `docs/SESSION_LOG.md` — Days 1-3 complete, Phase 1 done
- [ ] Read `docs/MASTER_PLAN.md` — you are on Day 4, Phase 2 begins
- [ ] `pnpm dev` starts the server — confirm before proceeding
- [ ] Today you will set up Supabase (takes ~10 minutes)

---

## Today's Goal

By end of Day 4, you will have:
1. Deep understanding of PostgreSQL and WHY it beats MongoDB for e-commerce
2. A free Supabase PostgreSQL database set up in the cloud
3. Prisma 7 connected to your Supabase database
4. `prisma.client.ts` and `database.plugin.ts` implemented
5. `fastify.db` decoration available to all future modules
6. All psql CLI basics understood

**Why This Matters:** Every backend job interview asks about databases. Being able to explain ACID, connection pooling, and WHY you chose PostgreSQL over MongoDB is the difference between passing and failing.

---

## Part 1: PostgreSQL — WHY Before HOW

### What is PostgreSQL?

PostgreSQL is a relational database. Data is stored in **tables** (like spreadsheets) with **rows** and **columns**. Tables are linked to each other through **foreign keys**.

Think of GoBasket's data:
```
Users table           Orders table         Products table
──────────────        ─────────────        ──────────────
id: "usr_1"          id: "ord_1"          id: "prd_1"
name: "Chandan"      userId: "usr_1"  →   name: "Milk"
phone: "9876..."     productId: "prd_1" → price: 65.00
                     quantity: 2          stock: 100
```

The arrows show **foreign key relationships** — PostgreSQL ENFORCES these. You cannot create an order for a user that doesn't exist. The database is your last line of defense.

### ACID — Why It Matters for E-Commerce

ACID is the most important database concept for e-commerce. It ensures data is **always correct**, even when things go wrong.

**The GoBasket Order Scenario:**

```
Customer places order for the LAST item in stock:

Step 1: Deduct 1 from products.stock WHERE id = 'prd_1'
Step 2: Create order record in orders table
Step 3: Create payment record in payments table
Step 4: Send confirmation email

What if the server crashes after Step 1 but before Step 2?
```

**Without ACID (MongoDB default):**
- Stock is reduced by 1
- Order is never created
- Customer is charged (or not)
- Data is INCONSISTENT — stock says 0 units but no order exists

**With ACID (PostgreSQL):**
```sql
BEGIN TRANSACTION;
  UPDATE products SET stock = stock - 1 WHERE id = 'prd_1';
  INSERT INTO orders (userId, productId, ...) VALUES (...);
  INSERT INTO payments (orderId, amount, ...) VALUES (...);
COMMIT;

-- If ANYTHING fails between BEGIN and COMMIT:
-- ALL changes are automatically rolled back
-- Database stays in a consistent state
```

ACID stands for:
- **A**tomicity — All steps succeed or ALL steps are rolled back
- **C**onsistency — Data always moves from one valid state to another
- **I**solation — Concurrent orders don't interfere (two users buy last item — only one succeeds)
- **D**urability — Once committed, data survives crashes and power failures

### PostgreSQL vs MongoDB for GoBasket

| Concern | PostgreSQL | MongoDB |
|---------|-----------|---------|
| Order + payment atomicity | ✅ Native transactions | ⚠️ Limited multi-document |
| Inventory race conditions | ✅ Row-level locking | ❌ Manual implementation |
| Complex queries (JOIN) | ✅ Native SQL | ❌ `$lookup` is slow |
| Schema enforcement | ✅ Strict types catch bugs | ❌ Schema-less = data chaos |
| Foreign key integrity | ✅ DB-level guarantee | ❌ App must enforce manually |
| Reporting/analytics | ✅ Window functions, CTEs | ❌ Complex aggregation pipeline |
| Indian startup usage | ✅ Zepto, CRED, Razorpay | ⚠️ Some use cases |

**Interview Answer:** "I chose PostgreSQL because GoBasket handles financial transactions (orders, payments). ACID compliance means data is always consistent — if a payment fails, the order is never created and inventory is never deducted. MongoDB's schema flexibility becomes a liability when money is involved."

### Connection Pooling — Why It Matters

PostgreSQL creates a new OS process for every connection. This is expensive:
- 1 connection = ~5MB RAM
- 500 concurrent users = 500 connections = 2.5GB RAM just for connections

**Solution: Connection Pooling (PgBouncer)**

```
100 app instances           PgBouncer              PostgreSQL
(each has 10 connections) → (pool manager) →   (10 actual connections)
= 1000 "virtual" connections    ↑                  = 10 OS processes
                           Supabase provides
                           this automatically!
```

Supabase's **Transaction Pooler** (port 6543) runs PgBouncer for you. Your app connects to the pooler, not directly to PostgreSQL. This is why we have two URLs:
- `DATABASE_URL` → Transaction Pooler (for all queries)
- `DIRECT_URL` → Direct connection (only for migrations)

---

## Part 2: Supabase Setup (Free Cloud PostgreSQL)

### Why Supabase?

- **Free tier:** 500MB storage, 50,000 monthly active users
- **Built-in connection pooler:** PgBouncer included
- **Dashboard:** Visual table browser (like pgAdmin but better)
- **No credit card required**
- **PostgreSQL 15** under the hood

**Important:** Free projects pause after **1 week of inactivity**. Wake them up by visiting the dashboard.

### Step-by-Step Setup

**1. Create Account**
- Go to [https://supabase.com](https://supabase.com)
- Sign up with GitHub (recommended) or email
- Click "New Project"

**2. Create Project**
```
Organization: Personal (or create a new one)
Project name: gobasket
Database password: [generate a strong password — SAVE THIS]
Region: Southeast Asia (Singapore) — closest to India
```
Click "Create new project" — takes ~2 minutes to provision.

**3. Get Connection Strings**

Go to: **Project Dashboard → Project Settings (gear icon) → Database**

Scroll to **"Connection string"** section. You'll see two modes:

**Transaction Pooler** (use for `DATABASE_URL`):
```
postgresql://postgres.[project-ref]:[your-password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```
Add `?pgbouncer=true` at the end for Prisma:
```
DATABASE_URL="postgresql://postgres.abcdefgh:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Direct Connection** (use for `DIRECT_URL`):
```
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres"
```

**4. Update Your `.env` File**

Open your `.env` file and replace the placeholder values:
```env
DATABASE_URL="postgresql://postgres.abcdefgh:[your-password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefgh:[your-password]@db.abcdefgh.supabase.co:5432/postgres"
```

Replace `abcdefgh` with your actual project reference and `[your-password]` with your database password.

---

## Part 3: Prisma 7 — The Big Breaking Change

### What Changed in Prisma 7

Prisma 7 is a complete rewrite. The old way (`prisma-client-js`, URL in schema.prisma) is gone.

**Before (Prisma 5/6):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ← URL was in schema.prisma
}

generator client {
  provider = "prisma-client-js"  // ← old generator name
}
```

**After (Prisma 7):**
```prisma
datasource db {
  provider = "postgresql"
  // URL is now in prisma.config.ts, NOT here
}

generator client {
  provider = "prisma-client"           // ← new generator name
  output   = "../src/generated/prisma" // ← explicit output path
}
```

```typescript
// prisma.config.ts — new configuration file at project root
import { defineConfig } from 'prisma/config'
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
```

### Why Driver Adapters?

Prisma 7 uses driver adapters (`@prisma/adapter-pg`) instead of the old Rust query engine. This means:
- Smaller bundle size (no native binary)
- Better performance
- Works anywhere Node.js runs (including edge runtimes)

```typescript
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

// Create PostgreSQL adapter with connection string
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// Pass adapter to PrismaClient (no Rust engine needed)
const prisma = new PrismaClient({ adapter })
```

### The Singleton Pattern (Critical for Development)

In development, `tsx watch` hot-reloads your code on every file save. Without the singleton pattern, every hot-reload creates a new database connection. 100 file saves = 100 connections = connection pool exhausted.

```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if a client already exists on the global object
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In development: save the client to global so hot-reloads reuse it
// In production: this line never runs (only one boot, no hot-reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### The Database Fastify Plugin

```typescript
// src/shared/database/database.plugin.ts
const databasePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('db', prisma)  // adds fastify.db to all modules

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()    // clean shutdown
  })
}

export default fp(databasePlugin, {
  fastify: '5.x',
  name: 'database',  // other modules can declare this as a dependency
})
```

After this is registered in `app.ts`, any route handler can do:
```typescript
// Inside any route handler:
const users = await fastify.db.user.findMany()
// (once we add User model on Day 5)
```

---

## Part 4: psql CLI — Your Database Terminal

`psql` is the command-line interface for PostgreSQL. Every backend developer uses it.

### Connect to Supabase via psql

```bash
# Install psql (comes with PostgreSQL):
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql@16
# Ubuntu: sudo apt install postgresql-client

# Connect to Supabase (use your DIRECT_URL):
psql "postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres"
```

### Essential psql Commands

```sql
-- List all databases
\l

-- Connect to a database
\c gobasket

-- List all tables
\dt

-- Describe a table structure
\d users

-- Run a query
SELECT * FROM users LIMIT 5;

-- Show running queries
SELECT pid, query, state FROM pg_stat_activity;

-- Exit psql
\q
```

### Essential SQL for GoBasket

```sql
-- See all tables (once we create schema on Day 5)
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- See all indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Count rows in a table
SELECT COUNT(*) FROM users;

-- Check active connections
SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';
```

---

## Part 5: What Was Implemented Today

### Files Created/Modified

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Prisma 7 schema — generator + datasource (no URL here) |
| `prisma.config.ts` | Prisma 7 config — DATABASE_URL lives here |
| `src/shared/database/prisma.client.ts` | Singleton PrismaClient with PrismaPg adapter |
| `src/shared/database/database.plugin.ts` | Fastify plugin — decorates app with `fastify.db` |
| `src/app.ts` | Updated — registers databasePlugin before domain modules |
| `.env` | Updated — added DIRECT_URL comment |
| `.env.example` | Updated — Supabase URL formats shown |
| `package.json` | Added db:generate, db:migrate, db:push, db:studio, db:seed scripts |
| `.gitignore` | Added `src/generated/` — generated Prisma client not committed |

### New Scripts

```bash
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:migrate    # Create a new migration (DEV only)
pnpm db:push       # Push schema to DB without migration file (prototyping)
pnpm db:studio     # Open visual DB browser at localhost:5555
pnpm db:seed       # Run seed script (Day 7)
```

### Why `src/generated/` is .gitignored

The Prisma client is auto-generated from `prisma/schema.prisma`. It's regenerated on every `pnpm install` (via the `prepare` script). Committing generated code:
- Bloats your repository
- Causes merge conflicts when schema changes
- Gives a false sense of security (generated ≠ source of truth)

The schema.prisma IS committed — that's the source of truth.

---

## Part 6: Test Your Supabase Connection

After updating `.env` with your real Supabase URLs:

```bash
# Restart the dev server
pnpm dev

# The server should start without errors
# Check health endpoint
curl http://localhost:3000/api/v1/health
```

Then verify connection works:
```bash
# Run a raw query (temporary test — remove after)
pnpm db:studio
# Opens at http://localhost:5555 — you should see your empty Supabase database
```

---

## Interview Questions from Day 4

1. **"Why did you choose PostgreSQL over MongoDB?"**
   - ACID compliance for financial transactions, native JOIN queries, schema enforcement catches bugs, foreign key integrity at database level. MongoDB flexibility is a liability when money is involved.

2. **"Explain connection pooling."**
   - PostgreSQL creates an OS process per connection (~5MB RAM). Without pooling, 500 users = 500 processes = server crash. PgBouncer (what Supabase uses) maintains a small pool of real connections and multiplexes many app connections through them.

3. **"What is the Prisma singleton pattern and why is it needed?"**
   - Hot-reloading in development creates new module instances on each file save. Without the singleton (storing PrismaClient on `global`), every save creates a new DB connection. 100 hot-reloads = 100 connections = pool exhausted.

4. **"What changed in Prisma 7?"**
   - Three major changes: (1) URL moved from schema.prisma to prisma.config.ts, (2) driver adapters replace the Rust query engine (smaller, faster), (3) generator changed from `prisma-client-js` to `prisma-client` with explicit output path.

5. **"What is ACID and why does it matter for e-commerce?"**
   - ACID ensures database operations are Atomic (all-or-nothing), Consistent (valid state always), Isolated (concurrent transactions don't conflict), Durable (survives crashes). For e-commerce: if payment fails, stock deduction and order creation are rolled back automatically. No partial state, no data corruption.

---

## Day 4 Checklist

- [ ] Supabase account created
- [ ] Supabase project created (region: Southeast Asia)
- [ ] `DATABASE_URL` updated in `.env` (Transaction Pooler URL)
- [ ] `DIRECT_URL` updated in `.env` (Direct connection URL)
- [ ] `prisma/schema.prisma` created (Prisma 7 format)
- [ ] `prisma.config.ts` created at project root
- [ ] `@prisma/adapter-pg` and `pg` installed
- [ ] `src/shared/database/prisma.client.ts` created (singleton)
- [ ] `src/shared/database/database.plugin.ts` created (Fastify plugin)
- [ ] `app.ts` registers `databasePlugin` before domain modules
- [ ] `pnpm db:generate` runs successfully
- [ ] Server starts without errors (`pnpm dev`)
- [ ] `pnpm db:studio` opens at localhost:5555 showing your DB

---

## What's Next: Day 5

**Day 5: Prisma Schema Design — Users, Products, Categories**
- Design the User model with all fields GoBasket needs
- Design Product model with images, pricing, stock
- Design Category model with self-referential (nested categories)
- Set up foreign key relationships between models
- Run first migration: `pnpm db:migrate`
- Understand Prisma relations: one-to-many, many-to-many

---

*Day 4 Completed: 2026-06-14 | Next: DAY_05_PRISMA_SCHEMA.md*
