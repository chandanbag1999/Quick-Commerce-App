# Architecture — GoBasket API

> Zero-assumption doc. Every AI or engineer can read this cold and understand every architectural decision without asking.

---

## System Overview

GoBasket is a **quick commerce** platform. Users browse products, add to cart, place orders, and receive delivery in under 10 minutes. The backend is a **monolithic modular REST API** — monolithic in deployment, modular in code structure. This lets us move fast now while keeping the option to extract microservices later if scale demands it.

---

## Architectural Decisions

### 1. Monolithic Modular (not microservices)
**Why:** We're in early development. Microservices add operational overhead (service discovery, distributed tracing, inter-service auth) that slows down a small team. Each module (`auth`, `users`, `products`, etc.) is self-contained but deployed together. If one domain needs to scale independently later, it can be extracted without rewriting — the boundaries are already clean.

**Constraint:** Modules must NOT import from other modules' internals. They can only share through `src/shared/`. This is the microservices-readiness invariant.

---

### 2. Repository Pattern
**Why:** Decouples business logic from the database. If we switch from raw SQL to an ORM (or change from Postgres to another DB), only repositories change — services stay the same. Also makes unit testing services trivial (mock the repo interface).

**Rule:** Repositories return plain TypeScript objects/arrays. They throw only `InternalError` (database errors). All business-rule errors (`NotFoundError`, `ConflictError`) are thrown by services.

---

### 3. Redis as L2 Cache
**Why:** Quick commerce has very high read:write ratio on products/inventory. Serving product lists from PostgreSQL on every request doesn't scale. Redis caches:
- Product detail pages (TTL: 1 hour)
- Product list pages (TTL: 5 minutes — refreshed on inventory change)
- Cart (TTL: session-based)
- Categories (TTL: 24 hours)

**Invalidation strategy:** Write-through for inventory (update DB + evict Redis key on every stock change). Time-based expiry for read-heavy product data.

---

### 4. JWT Authentication (Stateless)
**Why:** Stateless — no session table to query on every request. Access token (15m) + refresh token (7d). Short access token TTL limits blast radius if a token leaks.

**Refresh token storage:** Stored in `refresh_tokens` DB table (not just client-side) so we can revoke them on logout or suspicious activity. Redis also caches the blacklist of revoked tokens for O(1) lookup.

---

### 5. Zod for Runtime Validation
**Why:** TypeScript types only exist at compile time. Zod validates at runtime (at the HTTP boundary) and produces typed output, eliminating `as` casts. Every incoming request body passes through a Zod schema in `validators/` before reaching the service layer.

---

### 6. Centralized Error Handling
**Why:** No scattered `try/catch` blocks with custom `res.status()` calls. All errors are thrown as typed `AppError` subclasses and caught by the single `errorHandler` middleware. Consistent error shape for all clients.

---

## Request Lifecycle

```
Client Request
    │
    ▼
Express (helmet, cors, compression, rate-limit, requestLogger)
    │
    ▼
Router (e.g., /api/v1/products)
    │
    ▼
Guard middleware (authenticate / authorize) ← optional, route-level
    │
    ▼
Controller (parse req, validate with Zod, call service)
    │
    ▼
Service (business logic, cache check, throw AppError on failure)
    │
    ├─→ Redis (cache hit → return early)
    │
    ▼
Repository (SQL query via DB client)
    │
    ▼
PostgreSQL
    │
    ▼
Service (format result, write to cache)
    │
    ▼
Controller (sendSuccess / sendPaginated / sendCreated)
    │
    ▼
Client Response

On any thrown AppError anywhere in the chain:
    └─→ errorHandler middleware → formatted JSON error response
```

---

## Infrastructure Decisions

| Concern | Choice | Reason |
|---------|--------|--------|
| Database | PostgreSQL | ACID compliance for orders/payments; strong relational integrity |
| Cache | Redis (ioredis) | In-memory speed; supports pub/sub for future real-time features |
| Auth | JWT (jsonwebtoken) | Stateless, horizontally scalable |
| Validation | Zod | Runtime safety + TypeScript type inference |
| Logging | Winston | Structured logs; easy to ship to CloudWatch/Datadog later |
| HTTP security | Helmet | Sets 12 security headers automatically |
| Rate limiting | express-rate-limit | Protects all endpoints; configurable per-route |

---

## Security Model

1. **Helmet** — XSS, clickjacking, MIME sniffing protection via headers
2. **CORS** — Allowlist in `env.cors.origins`, credentials allowed
3. **Rate limiting** — 100 requests / 15 min globally; tighter limits on auth routes
4. **JWT** — Access tokens short-lived (15m); refresh tokens revocable
5. **Password hashing** — bcryptjs, cost factor 12
6. **Input validation** — Zod at every HTTP boundary; no raw DB queries with user input (parameterized queries only)
7. **Error messages** — Stack traces hidden in production; only `message` field exposed

---

## Scalability Path

The current monolith can scale vertically (bigger server) or horizontally (multiple instances behind a load balancer) without code changes — because:

- Session state is NOT in memory (JWT is stateless)
- Redis is external (shared across instances)
- No singleton state inside the app process

When/if we need microservices: each `src/modules/X` already has clean boundaries and can be extracted into its own service by moving the folder and adding an HTTP/gRPC transport layer.
