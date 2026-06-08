# GoBasket API — AI Context Master File

> **RULE #1 FOR ANY AI MODEL:** Read this file FIRST before every session. Zero assumptions. Everything you need is here or linked below. If something is unclear, check the linked doc — do not guess.

---

## What Is This Project?

**GoBasket** is a **quick commerce (q-commerce) backend REST API** — think Blinkit/Zepto/Swiggy Instamart. Products are delivered in minutes. The architecture is designed for:

- High throughput (many concurrent orders)
- Sub-10-minute delivery SLA
- Real-time inventory tracking
- Redis-heavy caching for product/cart reads

**Stack:** Node.js 20+ · Express 5 · TypeScript 5 · PostgreSQL · Redis · JWT Auth · Zod validation · Winston logging

**Phase:** Development (not yet in production). No migrations, no seed data, no tests yet.

---

## Working Directory

```
/d/CodeSpace/Parmanent-Field/NodeJs/GoBasket_v1/API/
```

**Entry points:**
- `src/server.ts` — HTTP server bootstrap (process signals, port binding)
- `src/app.ts` — Express app factory (middleware registration, router mounts)

**Dev command:** `npm run dev` (uses `ts-node-dev`)
**Build:** `npm run build` → outputs to `dist/`

---

## Folder Structure (Exact)

```
src/
├── modules/          ← business logic, one folder per domain
│   ├── auth/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dto/
│   │   ├── validators/
│   │   ├── routes/
│   │   └── auth.types.ts
│   ├── users/        (same sub-structure)
│   ├── products/     (same sub-structure)
│   ├── categories/   (same sub-structure)
│   ├── carts/        (same sub-structure)
│   ├── orders/       (same sub-structure)
│   └── inventory/    (same sub-structure)
│
├── shared/           ← reusable infrastructure, zero business logic
│   ├── database/     ← DB client, migrations, seeds
│   ├── redis/        ← singleton ioredis client (src/shared/redis/index.ts)
│   ├── logger/       ← winston logger (src/shared/logger/index.ts)
│   ├── constants/    ← HTTP_STATUS, CACHE_KEYS, ORDER_STATUS, USER_ROLES, etc.
│   ├── exceptions/   ← AppError hierarchy (NotFoundError, BadRequestError, etc.)
│   ├── middlewares/  ← errorHandler.ts, requestLogger.ts
│   ├── guards/       ← auth.guard.ts (authenticate, authorize, adminOnly)
│   ├── decorators/   ← (empty, for future use)
│   └── utils/        ← response.ts, pagination.ts
│
├── config/
│   ├── env.ts        ← typed env vars (import { env } from '@config/env')
│   ├── database.ts   ← knex-style db config object
│   ├── redis.ts      ← IORedis options
│   └── app.ts        ← Express middleware setup (helmet, cors, rate-limit, etc.)
│
├── types/
│   └── index.ts      ← JwtPayload, AuthenticatedRequest, ApiResponse, etc.
│
├── app.ts            ← Express app factory
└── server.ts         ← HTTP server + graceful shutdown
```

---

## Path Aliases (tsconfig.json)

Always use these — never relative `../../` paths:

| Alias | Resolves to |
|-------|------------|
| `@modules/*` | `src/modules/*` |
| `@shared/*` | `src/shared/*` |
| `@config/*` | `src/config/*` |
| `@types/*` | `src/types/*` |

---

## Module Architecture Pattern

Every module follows this exact 5-layer pattern:

```
routes/     → defines Express Router, maps HTTP verbs to controller methods
controllers/ → parses req/res, calls service, sends response via shared/utils/response.ts
services/   → business logic, orchestrates repositories, throws AppError on failure
repositories/ → raw DB queries only, returns plain objects/arrays, zero business logic
dto/        → TypeScript interfaces for request/response shapes
validators/ → Zod schemas that match dto interfaces
```

**Data flows one direction only:** Request → Router → Controller → Service → Repository → DB

---

## Error Handling

All errors extend `AppError` from `src/shared/exceptions/index.ts`:

```typescript
throw new NotFoundError('Product');          // 404
throw new BadRequestError('Invalid input');  // 400
throw new UnauthorizedError();               // 401
throw new ForbiddenError();                  // 403
throw new ConflictError('Email');            // 409
throw new ValidationError({ field: ['msg'] }); // 422
```

The global `errorHandler` middleware in `src/shared/middlewares/errorHandler.ts` catches all of these and formats the JSON response. **Never call `res.status().json()` directly in a catch block** — throw and let the middleware handle it.

---

## Response Helpers

Always use these from `src/shared/utils/response.ts`:

```typescript
sendSuccess(res, data, 'message')       // 200
sendCreated(res, data, 'message')       // 201
sendPaginated(res, data, meta)          // 200 + pagination meta
sendNoContent(res)                      // 204
```

---

## Authentication & Authorization

- JWT access tokens (15m expiry), refresh tokens (7d expiry)
- Tokens verified in `src/shared/guards/auth.guard.ts`
- Authenticated user available as `(req as AuthenticatedRequest).user`
- Roles: `customer` | `admin` | `delivery` (see `USER_ROLES` in constants)
- Usage: `router.use(authenticate)` then `router.delete('/', adminOnly, handler)`

---

## Environment

All env vars live in `.env` (not committed). Template at `.env.example`. Access them only through `src/config/env.ts` — never `process.env.X` directly outside that file.

Key vars: `PORT`, `DB_*`, `REDIS_*`, `JWT_*`, `NODE_ENV`

---

## Modules Status (Development Phase)

| Module | Status | Notes |
|--------|--------|-------|
| auth | Scaffold only | No controller/service/repo yet |
| users | Scaffold only | |
| products | Scaffold only | |
| categories | Scaffold only | |
| carts | Scaffold only | |
| orders | Scaffold only | |
| inventory | Scaffold only | |

Router mounts are commented out in `src/app.ts` — uncomment as each module is built.

---

## What Has NOT Been Built Yet

- Database client (no knex/prisma installed yet, `src/shared/database/` is empty)
- Any actual controller/service/repository/route files
- Tests (Jest not configured)
- Migrations / seed data
- Payment gateway integration
- Push notifications
- Delivery tracking

---

## Read Next

- `docs/ARCHITECTURE.md` — system design decisions and rationale
- `docs/MODULES.md` — what each module owns, its DB tables, its endpoints
- `docs/CONVENTIONS.md` — naming, file patterns, do/don't rules
- `docs/DATABASE.md` — schema design and ER diagram (text)
- `docs/API_CONTRACTS.md` — request/response shapes for all endpoints
