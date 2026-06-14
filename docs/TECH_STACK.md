# GoBasket — Tech Stack Reference

> Quick reference for every technology used. Read this when you forget WHY a technology was chosen.

---

## Runtime & Language

### Node.js 22 LTS
- **What:** JavaScript runtime — runs JavaScript outside the browser
- **Why LTS:** Long Term Support = stable, security patches for 3+ years
- **Indian market:** Most backend jobs in India use Node.js
- **Docs:** https://nodejs.org/en/docs

### TypeScript 5.x
- **What:** JavaScript + Types = safer code
- **Why:** Catches bugs at compile time, not runtime. Mandatory in enterprise.
- **Config file:** `tsconfig.json`
- **Compile:** `tsc` (but we use `tsx` for development — no compile step)
- **Docs:** https://www.typescriptlang.org/docs/

---

## Framework

### Fastify v5
- **What:** HTTP web framework for Node.js
- **Why over Express:** 3x faster, built-in TypeScript, built-in validation, better plugin system
- **Key concepts:**
  - **Routes:** Define URL endpoints
  - **Plugins:** Modular feature additions
  - **Hooks:** Intercept request/response at different lifecycle points
  - **Schemas:** Define request/response shape (used for validation AND serialization)
- **Docs:** https://fastify.dev/docs/latest/

### Fastify Plugins We Use
| Plugin | Purpose |
|--------|---------|
| `@fastify/cors` | Allow cross-origin requests (frontend ↔ backend) |
| `@fastify/helmet` | Set security HTTP headers |
| `@fastify/rate-limit` | Prevent API abuse (too many requests) |
| `@fastify/swagger` | Auto-generate OpenAPI 3.0 spec |
| `@fastify/swagger-ui` | Serve Swagger UI at /docs |
| `@fastify/jwt` | JWT auth (Day 8) |

---

## Database

### PostgreSQL 16
- **What:** Relational database — stores data in tables with rows and columns
- **Why:** ACID transactions (critical for payments + orders), better for complex queries
- **Cloud (free):** Supabase — https://supabase.com
- **Local:** Docker (`docker run postgres`) — we'll do this on Day 4
- **Docs:** https://www.postgresql.org/docs/

### Prisma 5 (ORM)
- **What:** ORM — Object Relational Mapper. Write TypeScript, it generates SQL.
- **Why:** Type-safe database queries, automatic migrations, great DX
- **Files:**
  - `prisma/schema.prisma` — define your database tables
  - `prisma/migrations/` — auto-generated SQL migration files
  - `prisma/seed.ts` — populate test data
- **CLI commands:**
  ```bash
  pnpm dlx prisma generate    # Generate TypeScript client from schema
  pnpm dlx prisma migrate dev # Create new migration from schema changes
  pnpm dlx prisma studio      # Visual database browser (like pgAdmin)
  pnpm dlx prisma db seed     # Run seed file
  ```
- **Docs:** https://www.prisma.io/docs

---

## Cache & Queue

### Redis 7
- **What:** In-memory key-value store — extremely fast data storage
- **Uses in GoBasket:**
  - Session/OTP storage (fast expiry)
  - API response caching (product lists)
  - Rate limiting counters
  - BullMQ backend (job queue storage)
- **Cloud (free):** Upstash — https://upstash.com
- **Docs:** https://redis.io/docs/

### BullMQ
- **What:** Job queue library built on Redis
- **Why:** Async processing — don't make users wait for email to send
- **Example:** Order placed → immediately return "Order confirmed" → BullMQ sends confirmation email in background
- **Docs:** https://docs.bullmq.io/

---

## Validation

### Zod
- **What:** TypeScript-first schema validation library
- **Why:** Define a schema once, use it for runtime validation AND TypeScript types
- **Example:**
  ```typescript
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
  type LoginBody = z.infer<typeof schema>  // TypeScript type from schema!
  ```
- **Docs:** https://zod.dev/

---

## Authentication

### jsonwebtoken
- **What:** JWT (JSON Web Token) library
- **Why:** Stateless auth — no database query on every request
- **Tokens:**
  - Access token: 15 minutes (short-lived, used in API calls)
  - Refresh token: 7 days (long-lived, used to get new access token)
- **Docs:** https://github.com/auth0/node-jsonwebtoken

### bcryptjs
- **What:** Password hashing library
- **Why:** Never store plain text passwords. bcrypt is slow on purpose (prevents brute force).
- **Cost factor:** 12 (2^12 = 4096 iterations — secure but not too slow)
- **Docs:** https://github.com/dcodeIO/bcrypt.js

---

## Logging

### Pino (built into Fastify)
- **What:** Fastest Node.js JSON logger
- **Why:** JSON logs can be sent to log aggregators (DataDog, CloudWatch, Grafana)
- **Development:** Uses pino-pretty for human-readable colored output
- **Production:** Raw JSON (easier for log tools to parse)

---

## Testing

### Vitest
- **What:** Fast unit testing framework (drop-in Jest replacement)
- **Why over Jest:** 5x faster, native ESM support, better TypeScript support
- **Commands:**
  ```bash
  pnpm test           # Run all tests once
  pnpm test:watch     # Re-run tests on file change
  pnpm test:coverage  # Generate coverage report
  ```
- **Docs:** https://vitest.dev/

---

## Package Manager

### pnpm 9
- **What:** Fast, disk-efficient package manager
- **Why over npm:** Faster install, uses hard links (saves GB of disk space)
- **Docs:** https://pnpm.io/

---

## Containerization

### Docker
- **What:** Run applications in isolated containers
- **Why:** "Works on my machine" problem solved. Same environment everywhere.
- **Files:**
  - `docker/Dockerfile` — how to build the app image
  - `docker/docker-compose.yml` — run app + PostgreSQL + Redis together
- **Docs:** https://docs.docker.com/

---

## External Services (All Have Free Tiers)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Supabase | PostgreSQL hosting | 500MB storage |
| Upstash | Redis hosting | 10k req/day |
| Cloudinary | Image storage + CDN | 25GB storage |
| Resend | Email sending | 3k emails/month |
| Razorpay | Payment gateway | Test mode free |
| Railway | App deployment | $5 credit |
| Twilio | SMS/OTP | Free trial credits |

---

## Important URLs

- Swagger UI (local): `http://localhost:3000/docs`
- Health check (local): `http://localhost:3000/health`
- Prisma Studio (local): Run `pnpm dlx prisma studio`

---

*Updated: 2026-06-13 | Tech stack is final for the 30-day project. Do not change tech mid-project.*
