# Day 2 — Fastify Deep Dive: Plugins, Hooks, and Module Pattern

> **Date:** 2026-06-14 | **Phase:** 1 (Foundation) | **Day:** 2 of 30

---

## Before You Start (Zero Assumption Check)
- [ ] Read `docs/SESSION_LOG.md` — Day 1 confirmed complete
- [ ] Read `docs/MASTER_PLAN.md` — you are on Day 2, Phase 1
- [ ] Run `pnpm dev` and confirm server still starts from Day 1
- [ ] Today builds ON TOP of Day 1 — do not skip

---

## Today's Goal

By end of Day 2, you will have:
1. Deep understanding of Fastify's plugin system and encapsulation
2. Understanding of the full request lifecycle and when to use each hook
3. The `*.module.ts` pattern fully understood and implemented
4. Health module extracted from `app.ts` into `src/modules/health/`
5. API versioning with `/api/v1` prefix working
6. Type-safe routes with TypeScript generics

**Why This Matters for Interviews:**
"How do you structure a Fastify application?" is one of the most common questions for Node.js roles. Knowing the plugin system deeply separates junior from mid-level developers.

---

## Part 1: The Fastify Plugin System (WHY Before HOW)

### The Problem Without Plugins

In Express, everything is global. Adding a middleware affects ALL routes:
```typescript
// Express — global middleware, affects everything
app.use(authMiddleware)     // Now ALL routes need authentication
app.use(rateLimitMiddleware) // Now ALL routes have rate limiting

// What if you want /health to skip auth? You hack around it:
app.use((req, res, next) => {
  if (req.path === '/health') return next()
  authMiddleware(req, res, next)
})
// This becomes a mess at scale
```

### The Fastify Solution: Scoped Plugins (Encapsulation)

Fastify uses a **plugin tree** where each `register()` creates a new scope. Hooks and decorations inside a scope only affect that scope's routes — not the parent or siblings.

```
app (root scope)
├── corsPlugin          ← applies to ALL routes
├── helmetPlugin        ← applies to ALL routes
│
├── publicRoutes scope  ← no auth needed
│   ├── GET /health
│   └── GET /api/v1/products  (public browsing)
│
└── protectedRoutes scope  ← auth required
    ├── addHook('onRequest', verifyJWT)  ← ONLY applies inside this scope
    ├── GET /api/v1/cart
    ├── POST /api/v1/orders
    └── DELETE /api/v1/users/:id
```

The `verifyJWT` hook only runs for routes inside `protectedRoutes` — never for `/health` or public product browsing. **No hacks needed.**

### The Restaurant Analogy

Think of Fastify plugins like kitchen stations in a restaurant:
- **Root app** = the restaurant building (open to all)
- **Public scope** = the dining room (anyone can enter)
- **Protected scope** = the kitchen (only staff with ID badge)
- **Plugin** = a kitchen station with its own tools that don't mix with other stations

---

## Part 2: fastify-plugin (fp()) — Breaking Encapsulation Intentionally

### The Problem

By default, a decoration added inside a `register()` is NOT visible to the parent or sibling plugins:

```typescript
// WITHOUT fastify-plugin:
fastify.register(async (app) => {
  app.decorate('db', prismaClient)  // adds 'db' to this child scope only
})

fastify.register(async (app) => {
  app.db  // ❌ undefined! 'db' doesn't exist here — different scope
})
```

### The Solution: fp()

`fastify-plugin` wraps your plugin and tells Fastify: *"don't create a new scope for this — share with the parent."*

```typescript
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('db', prismaClient)
}

// fp() breaks the scope — 'db' is now visible to ALL plugins registered after this
export default fp(databasePlugin, {
  fastify: '5.x',
  name: 'database',
})
```

Now any module registered after `databasePlugin` can use `fastify.db`.

### When to Use fp() vs NOT

| Scenario | Use fp()? | Why |
|----------|-----------|-----|
| Database plugin | ✅ YES | All modules need `app.db` |
| Redis/cache plugin | ✅ YES | All modules need `app.cache` |
| Auth verification hook | ❌ NO | Only specific routes need auth |
| Module routes plugin | ❌ NO | Routes should be scoped |
| Shared utility decorator | ✅ YES | All modules need utilities |

**Rule:** Use `fp()` when you want to **share** something with the whole app. Don't use it when you want **isolation**.

---

## Part 3: The Full Request Lifecycle

Every request goes through these stages in order:

```
┌─────────────────────────────────────────────────────────┐
│                  INCOMING REQUEST                        │
└──────────────────────────┬──────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Routing    │  ← Find which handler matches the URL
                    └──────┬──────┘
                           │
              ┌────────────▼───────────┐
              │  onRequest hook        │  ← First hook. Body NOT parsed yet.
              │  USE FOR: JWT auth,    │    Perfect for auth — reject early
              │  IP blocking, logging  │    before doing expensive work
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  preParsing hook       │  ← Before body parsing
              │  USE FOR: Transform    │    (rarely needed)
              │  raw request stream    │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  Body Parsing          │  ← Fastify reads request body
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  preValidation hook    │  ← After parsing, before schema
              │  USE FOR: Normalize    │    validation. E.g., lowercase email
              │  data before validate  │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  Schema Validation     │  ← Fastify validates body/params/query
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  preHandler hook       │  ← After validation. Body is safe.
              │  USE FOR: Load user    │    Perfect for loading resources
              │  from DB, permissions  │    needed by the handler
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  Route Handler         │  ← YOUR CODE runs here
              │  (controller function) │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  preSerialization hook │  ← Before JSON serialization
              │  USE FOR: Add metadata │    (response envelope wrapping)
              │  to every response     │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  onSend hook           │  ← After serialization
              │  USE FOR: Compress,    │    Add response headers
              │  add headers           │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  Response sent         │  ← Client receives response
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  onResponse hook       │  ← After response sent
              │  USE FOR: Logging,     │    Metrics, cleanup
              │  analytics, metrics    │
              └────────────┘

              ┌────────────────────────┐
              │  onError hook          │  ← Runs when ANY hook or handler
              │  USE FOR: Error        │    throws. Before setErrorHandler.
              │  reporting (Sentry)    │    USE FOR: error tracking
              └────────────────────────┘
```

### The Two Most Important Hooks for GoBasket

```typescript
// 1. onRequest — JWT verification (Day 8)
// Runs BEFORE body parsing → fast rejection of unauthorized requests
fastify.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify()  // throws if token invalid
  } catch {
    reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED' } })
  }
})

// 2. preHandler — Load authenticated user from DB
// Runs AFTER validation → body is safe, token is verified
fastify.addHook('preHandler', async (request) => {
  const user = await prisma.user.findUnique({ where: { id: request.user.id } })
  request.currentUser = user  // available in handler
})
```

---

## Part 4: The Module Pattern (*.module.ts)

Every domain module in GoBasket follows this exact 7-file anatomy:

```
src/modules/health/
├── health.module.ts      ← Fastify plugin — the entry point
├── health.routes.ts      ← Route definitions (URL + method → handler)
├── health.controller.ts  ← Parse request, call service, send response
├── health.service.ts     ← Business logic
├── health.repository.ts  ← Database queries (empty for health module)
├── health.schema.ts      ← Zod + JSON Schema validation
└── health.types.ts       ← TypeScript types for this module
```

### How These Files Connect

```
HTTP Request
    │
    ▼
health.routes.ts      ← defines: GET /api/v1/health → healthController.getStatus
    │                    applies: health.schema.ts for validation
    │
    ▼
health.controller.ts  ← calls: healthService.getStatus()
    │                    sends: formatted JSON response
    │
    ▼
health.service.ts     ← runs: business logic
    │                    calls: health.repository.ts (for DB data)
    │
    ▼
health.repository.ts  ← runs: Prisma queries
```

### The module.ts File — The Most Critical Pattern

```typescript
// src/modules/health/health.module.ts
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { healthRoutes } from './health.routes.js'

// FastifyPluginAsync = the TypeScript type for async Fastify plugins
const healthModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(healthRoutes, { prefix: '/api/v1' })
}

// fp() = share this plugin's scope with the parent (no scope isolation)
// Why? Because this module needs access to app.db, app.cache decorations
// added by shared infrastructure plugins
export default fp(healthModule, {
  fastify: '5.x',
  name: 'health-module',
})
```

### How app.ts Assembles Everything

```typescript
// Order matters:
// 1. Global plugins (security, docs) — no dependencies
// 2. Shared infrastructure (db, cache) — must be before modules
// 3. Domain modules — after infrastructure is ready

await app.register(corsPlugin)      // global
await app.register(databasePlugin)  // shared — decorates app.db
await app.register(healthModule)    // domain — can use app.db
await app.register(authModule)      // domain
await app.register(productsModule)  // domain
```

---

## Part 5: Type-Safe Routes in Fastify v5

Fastify routes are typed using a generic interface:

```typescript
// The 5 parts you can type:
fastify.get<{
  Params:      { id: string }           // URL params: /products/:id
  Querystring: { page: number; limit: number }  // ?page=1&limit=20
  Body:        { name: string }         // Request body (POST/PUT)
  Headers:     { 'x-api-key': string } // Request headers
  Reply:       { 200: Product; 404: { error: string } }  // Response shapes
}>('/products/:id', options, handler)
```

### Practical Example — Typed Route

```typescript
import type { FastifyInstance } from 'fastify'

interface GetHealthReply {
  200: {
    status: string
    timestamp: string
    uptime: number
    environment: string
  }
}

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: GetHealthReply }>(
    '/health',
    {
      schema: {
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      // reply.send() is now type-checked against GetHealthReply[200]
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV ?? 'development',
      })
    }
  )
}
```

---

## Part 6: Implementing the Health Module

Today we extract the `/health` route from `app.ts` into a proper module. This demonstrates the full pattern we'll use for auth, products, orders, etc.

### File 1: `src/modules/health/health.types.ts`

```typescript
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  uptime: number
  environment: string
  version: string
}
```

### File 2: `src/modules/health/health.schema.ts`

```typescript
export const healthResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
    timestamp: { type: 'string', format: 'date-time' },
    uptime: { type: 'number' },
    environment: { type: 'string' },
    version: { type: 'string' },
  },
  required: ['status', 'timestamp', 'uptime', 'environment', 'version'],
} as const
```

### File 3: `src/modules/health/health.service.ts`

```typescript
import type { HealthStatus } from './health.types.js'

export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? 'development',
      version: process.env.npm_package_version ?? '1.0.0',
    }
  }
}
```

### File 4: `src/modules/health/health.repository.ts`

```typescript
// Health module has no direct database queries today.
// On Day 4, we'll add a DB ping check here.
export class HealthRepository {}
```

### File 5: `src/modules/health/health.controller.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import { HealthService } from './health.service.js'

const healthService = new HealthService()

export async function getHealthStatus(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const status = healthService.getStatus()
  return reply.send(status)
}
```

### File 6: `src/modules/health/health.routes.ts`

```typescript
import type { FastifyInstance } from 'fastify'
import { getHealthStatus } from './health.controller.js'
import { healthResponseSchema } from './health.schema.js'
import type { HealthStatus } from './health.types.js'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: { 200: HealthStatus } }>(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Server health check',
        description: 'Returns server status, uptime, and environment info',
        response: { 200: healthResponseSchema },
      },
    },
    getHealthStatus
  )
}
```

### File 7: `src/modules/health/health.module.ts`

```typescript
import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { healthRoutes } from './health.routes.js'

const healthModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(healthRoutes, { prefix: '/api/v1' })
}

export default fp(healthModule, {
  fastify: '5.x',
  name: 'health-module',
})
```

---

## Part 7: Update app.ts — Register the Health Module

Remove the inline `/health` route from `app.ts` and replace with module registration:

```typescript
// In app.ts, after swagger registration:
import healthModule from './modules/health/health.module.js'

// Inside buildApp():
await app.register(healthModule)
```

The health endpoint is now at `/api/v1/health` (module-prefixed) **and** we keep `/health` at root for load balancer compatibility.

---

## Part 8: Running and Verifying

```bash
pnpm dev
```

Test both endpoints:
```bash
# Root health (load balancer)
curl http://localhost:3000/health

# Module health (API versioned)
curl http://localhost:3000/api/v1/health
```

Expected from `/api/v1/health`:
```json
{
  "status": "ok",
  "timestamp": "2026-06-14T12:00:00.000Z",
  "uptime": 2.341,
  "environment": "development",
  "version": "1.0.0"
}
```

Open `http://localhost:3000/docs` — you should now see the Health endpoint listed under the Health tag with full schema documentation.

---

## Interview Questions from Day 2

1. **"What is Fastify's plugin encapsulation and why does it matter?"**
   - Each `register()` creates a new scope. Hooks/decorators inside only affect that scope's routes. This means you can add auth hooks to only protected routes without hacking around it — unlike Express where middleware is global.

2. **"When would you use fastify-plugin (fp())?"**
   - When a plugin adds a decoration (like `app.db` or `app.cache`) that other plugins need to access. `fp()` breaks the default scope isolation so the decoration is visible to sibling/parent plugins.

3. **"What's the difference between `onRequest` and `preHandler`?"**
   - `onRequest`: runs before body parsing — use for auth (fast rejection, no parsing waste). `preHandler`: runs after validation — use for loading resources (user from DB) that require a valid, parsed request.

4. **"Why do you separate routes, controller, service, and repository into different files?"**
   - Single Responsibility Principle. Routes know HTTP. Controllers know request/response shapes. Services know business logic (no HTTP). Repositories know database queries (no business logic). Each layer is independently testable and replaceable.

5. **"How does API versioning work in your Fastify app?"**
   - Each module registers its routes with `{ prefix: '/api/v1' }`. When we release breaking changes, we create `/api/v2` modules while keeping `/api/v1` running. Mobile apps using v1 are never broken.

---

## Day 2 Checklist

- [ ] `fastify-plugin` installed
- [ ] `src/modules/health/health.types.ts` created
- [ ] `src/modules/health/health.schema.ts` created
- [ ] `src/modules/health/health.service.ts` created
- [ ] `src/modules/health/health.repository.ts` created
- [ ] `src/modules/health/health.controller.ts` created
- [ ] `src/modules/health/health.routes.ts` created
- [ ] `src/modules/health/health.module.ts` created
- [ ] `app.ts` updated to register health module
- [ ] `GET /health` still works (root — for load balancer)
- [ ] `GET /api/v1/health` works (module — API versioned)
- [ ] Swagger `/docs` shows Health endpoint with schema
- [ ] Git commit made

---

## What's Next: Day 3

**Day 3: Git Mastery + Project Conventions**
- Git branching strategy (feature branches, main branch protection)
- Conventional commits (feat, fix, refactor, docs, chore)
- ESLint + Prettier setup for consistent code style
- VS Code workspace settings
- Understanding the complete project as it stands before database work

---

*Day 2 Started: 2026-06-14 | Next: DAY_03_GIT_CONVENTIONS.md*
