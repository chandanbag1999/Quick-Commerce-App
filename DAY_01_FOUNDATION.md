# Day 1 — Foundation: TypeScript + Node.js + Fastify

> **Date:** 2026-06-13 | **Phase:** 1 (Foundation) | **Day:** 1 of 30

---

## Before You Start (Zero Assumption Check)
- [ ] Read MASTER_PLAN.md — you are on Day 1, Phase 1
- [ ] Read PHILOSOPHY.md — understand the working principles
- [ ] Read ARCHITECTURE.md — understand what you're building
- [ ] Prerequisites: A computer with internet, VS Code, basic terminal knowledge

---

## Today's Goal

By end of Day 1, you will have:
1. A working Node.js + TypeScript + Fastify server running
2. Understanding of WHY TypeScript, WHY Fastify
3. A professional project structure initialized
4. Git repository with first commit
5. Environment variables properly set up

**Interview Value:** Being able to explain your project setup decisions is a common interview question.

---

## Part 1: Understanding TypeScript (WHY Before HOW)

### What is TypeScript?

TypeScript is JavaScript with types. Think of it like this:

**JavaScript (no safety net):**
```javascript
function calculateTotal(price, quantity) {
  return price * quantity
}

// What if someone calls it wrong?
calculateTotal("100", 5)      // Returns "100100100100100" — WRONG!
calculateTotal(null, 5)       // Returns 0 — WRONG!
calculateTotal(undefined, 5)  // Returns NaN — WRONG!
```

**TypeScript (with safety net):**
```typescript
function calculateTotal(price: number, quantity: number): number {
  return price * quantity
}

calculateTotal("100", 5)     // ERROR at compile time — TypeScript catches it
calculateTotal(null, 5)      // ERROR at compile time
calculateTotal(100, 5)       // OK — returns 500
```

TypeScript catches bugs **before** the code runs. In a production system handling payments and orders, this is critical.

### Why Companies Want TypeScript in 2026
- Large codebases become unmaintainable without types
- Autocomplete in VS Code works perfectly (huge productivity boost)
- Refactoring is safe — TypeScript tells you everywhere a change breaks
- New developers can understand code faster
- Industry standard at: Microsoft, Google, Zepto, CRED, Meesho, Razorpay

---

## Part 2: Understanding Fastify (WHY Before HOW)

### What is Fastify?

Fastify is a web framework for Node.js — it handles HTTP requests and responses.

Think of it like a traffic controller at a restaurant:
- Customer (Client) makes a request: "I want to see all products"
- Traffic controller (Fastify) receives the request at `/api/v1/products`
- Forwards it to the right "chef" (your code)
- Chef processes it and sends back the response

### Why Fastify Over Express?

| Feature | Express | Fastify |
|---------|---------|---------|
| Performance | ~24k req/sec | ~77k req/sec |
| TypeScript | External types | Built-in |
| JSON Schema | Plugin needed | Built-in |
| Validation | Manual or middleware | Built-in |
| Async/Await | Can be tricky | Native support |
| Plugin isolation | No | Yes (no global state leaks) |
| Age/Maturity | 2010 (legacy) | 2016 (modern) |

**Interview Answer:** "I chose Fastify because it's 3x faster than Express, has built-in schema validation, native TypeScript support, and follows modern Node.js patterns. Express is a great framework but was built before async/await and TypeScript became standard."

---

## Part 3: Development Environment Setup

### Step 1: Install Required Software

**Node.js 22 LTS:**
```bash
# Check if Node is installed
node --version  # Should show v22.x.x

# If not installed, download from: https://nodejs.org (LTS version)
# Or use nvm (Node Version Manager) — recommended for developers
```

**Install nvm (Node Version Manager) — Recommended:**
```bash
# Windows — install nvm-windows from:
# https://github.com/coreybutler/nvm-windows/releases

# After installing nvm:
nvm install 22
nvm use 22
node --version  # Should show v22.x.x
```

**Why nvm?** You might work on multiple projects needing different Node versions. nvm lets you switch easily.

**pnpm (Package Manager):**
```bash
# Install pnpm globally
npm install -g pnpm

# Verify
pnpm --version  # Should show 9.x.x
```

**Why pnpm over npm?**
- 2x faster installation
- Uses hard links (saves disk space)
- Stricter dependency resolution (catches bugs)
- Industry preferred in modern projects

**Git:**
```bash
git --version  # Should show git version 2.x.x
# If not: https://git-scm.com/downloads
```

**VS Code Extensions to Install:**
```
1. Prettier - Code formatter (esbenp.prettier-vscode)
2. ESLint (dbaeumer.vscode-eslint)
3. Prisma (prisma.prisma)
4. REST Client (humao.rest-client) — for testing APIs in VS Code
5. GitLens (eamodio.gitlens)
6. Error Lens (usernamehako.errorlens) — shows errors inline
7. DotENV (mikestead.dotenv)
```

---

## Part 4: Initialize the GoBasket Project

### Step 1: Create Project Directory

```bash
# Navigate to where you want your project (NOT the fe13a3a2 folder)
# Create a proper project folder
mkdir gobasket-backend
cd gobasket-backend
```

### Step 2: Initialize Git

```bash
git init
git config user.name "Your Name"
git config user.email "your@email.com"
```

### Step 3: Initialize pnpm

```bash
pnpm init
```

This creates `package.json`. Open it — it should look like:
```json
{
  "name": "gobasket-backend",
  "version": "1.0.0",
  "description": "Zepto-like quick commerce backend",
  "main": "dist/server.js",
  "scripts": {},
  "keywords": [],
  "author": "Your Name",
  "license": "MIT"
}
```

**Update it to:**
```json
{
  "name": "gobasket-backend",
  "version": "1.0.0",
  "description": "Quick commerce backend like Zepto — built with Fastify, TypeScript, PostgreSQL",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src"
  },
  "keywords": ["fastify", "typescript", "postgresql", "quick-commerce"],
  "author": "Your Name",
  "license": "MIT"
}
```

### Step 4: Install TypeScript and Development Tools

```bash
# TypeScript + Node types
pnpm add -D typescript @types/node

# tsx — runs TypeScript files directly (no need to compile for development)
pnpm add -D tsx

# TypeScript compiler configuration
npx tsc --init
```

**Update `tsconfig.json`** (replace entire content):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**What each option means:**
- `"target": "ES2022"` — Compile to modern JavaScript (Node 22 supports it)
- `"strict": true` — Enable all strict type checks (catches more bugs)
- `"esModuleInterop": true` — Makes CommonJS imports work nicely
- `"outDir": "./dist"` — Compiled files go to `dist/` folder
- `"rootDir": "./src"` — Your source code is in `src/`

### Step 5: Install Fastify and Core Packages

```bash
# Core framework
pnpm add fastify

# Fastify official plugins
pnpm add @fastify/cors @fastify/helmet @fastify/rate-limit @fastify/swagger @fastify/swagger-ui

# Environment variables
pnpm add dotenv

# Validation
pnpm add zod

# Logging (Pino is built into Fastify, but Pino-pretty for dev)
pnpm add -D pino-pretty
```

### Step 6: Create Project Structure (Modular Monolith)

**Architecture:** Modules organized by domain (vertical slicing), not by technical role (horizontal/layered).
Each module folder owns ALL its layers: routes, controller, service, repository, schema, types.

```bash
# Domain modules — each is a self-contained feature
mkdir -p src/modules/auth
mkdir -p src/modules/users
mkdir -p src/modules/products
mkdir -p src/modules/categories
mkdir -p src/modules/cart
mkdir -p src/modules/orders/jobs
mkdir -p src/modules/payments/webhooks
mkdir -p src/modules/inventory
mkdir -p src/modules/delivery
mkdir -p src/modules/notifications/workers

# Shared code — used by ALL modules (no circular deps)
mkdir -p src/shared/database
mkdir -p src/shared/cache
mkdir -p src/shared/queue
mkdir -p src/shared/errors
mkdir -p src/shared/types
mkdir -p src/shared/utils
mkdir -p src/shared/middlewares

# Fastify global plugins
mkdir -p src/plugins

# Configuration
mkdir -p src/config

# Database (Prisma)
mkdir -p prisma/migrations

# Tests mirror the modules structure
mkdir -p tests/modules/auth
mkdir -p tests/modules/products
mkdir -p tests/modules/cart
mkdir -p tests/modules/orders
mkdir -p tests/modules/payments
mkdir -p tests/shared
mkdir -p tests/helpers

# Documentation
mkdir -p docs
```

**Why this over the old `controllers/`, `services/`, `repositories/` flat structure?**
- When you work on "cart", open `src/modules/cart/` — everything is right there
- Old way: 5 folders open simultaneously to work on one feature
- New way: 1 folder. The module is self-contained.
- Each module can become a microservice in the future — just move the folder
- This is exactly how NestJS organizes code (most hired Node.js framework in India 2026)

---

## Part 5: Write Your First Code

### Create `src/config/env.ts`

This file validates environment variables. If a required variable is missing, the app won't start — which is better than crashing later with a confusing error.

```typescript
import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Resend (Email)
  RESEND_API_KEY: z.string().optional(),

  // Twilio (SMS/OTP)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsedEnv.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsedEnv.data
export type Env = typeof env
```

### Create `src/shared/errors/http.errors.ts`

Custom error classes — every production backend has these. Lives in `shared/` because ALL modules use it.

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, message, 'BAD_REQUEST')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, message, 'CONFLICT')
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR')
  }
}
```

### Create `src/app.ts`

The Fastify app factory — this is the heart of the server.

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env.js'
import { AppError } from './shared/errors/http.errors.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  })

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  // CORS — allow frontend to talk to backend
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? ['https://your-frontend.com'] : true,
    credentials: true,
  })

  // Rate limiting — prevent abuse
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait before making more requests.',
    }),
  })

  // API Documentation (Swagger)
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'GoBasket API',
        description: 'Quick Commerce Backend — like Zepto',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Products', description: 'Product management' },
        { name: 'Cart', description: 'Shopping cart' },
        { name: 'Orders', description: 'Order management' },
        { name: 'Payments', description: 'Payment processing' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  })

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      })
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      })
    }

    // Unknown errors — don't expose internal details in production
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : error.message,
      },
    })
  })

  // Health check endpoint
  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        description: 'Check if the server is running',
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
    async (request, reply) => {
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
      })
    }
  )

  return app
}
```

### Create `src/server.ts`

The entry point — starts the server.

```typescript
import { buildApp } from './app.js'
import { env } from './config/env.js'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    console.log(`
╔════════════════════════════════════════╗
║         GoBasket Backend Started       ║
║                                        ║
║  Server: http://localhost:${env.PORT}           ║
║  Docs:   http://localhost:${env.PORT}/docs      ║
║  Health: http://localhost:${env.PORT}/health    ║
║  Env:    ${env.NODE_ENV.padEnd(30)} ║
╚════════════════════════════════════════╝
    `)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()
```

### Create `.env` file

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database (we'll set this up on Day 4)
DATABASE_URL=postgresql://user:password@localhost:5432/gobasket

# Redis (we'll set this up later)
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate random 32+ char strings)
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-minimum-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Create `.env.example` (commit this to Git, NOT `.env`)

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@localhost:5432/gobasket
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Create `.gitignore`

```
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/

# Environment variables — NEVER commit real secrets
.env
.env.local
.env.*.local

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# TypeScript
*.tsbuildinfo

# Test coverage
coverage/
```

---

## Part 6: Running the Server

```bash
pnpm dev
```

You should see:
```
╔════════════════════════════════════════╗
║         GoBasket Backend Started       ║
║                                        ║
║  Server: http://localhost:3000          ║
║  Docs:   http://localhost:3000/docs     ║
║  Health: http://localhost:3000/health   ║
║  Env:    development                   ║
╚════════════════════════════════════════╝
```

**Test it:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-13T17:00:00.000Z",
  "uptime": 1.234,
  "environment": "development"
}
```

Open in browser: `http://localhost:3000/docs` — you'll see Swagger UI with your API documentation!

---

## Part 7: Git — Your First Professional Commit

```bash
# Stage all files
git add .

# First commit
git commit -m "feat: initialize GoBasket backend with Fastify + TypeScript

- Set up Fastify server with TypeScript
- Added security plugins: CORS, Helmet, rate limiting
- Added Swagger/OpenAPI documentation at /docs
- Added environment variable validation with Zod
- Added custom error classes
- Health check endpoint at /health
- Professional project structure ready for all 30 days"
```

---

## Part 8: Understanding What You Just Built

Let's trace what happens when you call `GET /health`:

```
1. Request arrives at port 3000
   ↓
2. Fastify receives it
   ↓
3. Rate limit check (not exceeded? continue)
   ↓
4. Helmet adds security headers
   ↓
5. CORS check (is origin allowed? continue)
   ↓
6. Route matching: GET /health → found!
   ↓
7. Schema validation: no params needed → skip
   ↓
8. Handler function runs: returns { status: 'ok', ... }
   ↓
9. Fastify serializes response to JSON
   ↓
10. Response sent back to client
```

This entire pipeline runs in microseconds.

---

## Interview Questions from Day 1

1. **"Why did you choose Fastify over Express?"**
   - Performance (3x faster), built-in validation, TypeScript-first, modern async patterns

2. **"Why TypeScript?"**
   - Type safety catches bugs at compile time, better DX with autocomplete, mandatory in enterprise 2026

3. **"Why validate environment variables at startup?"**
   - Fail-fast principle — better to crash on startup with a clear error than fail randomly in production

4. **"What is the purpose of the health check endpoint?"**
   - Load balancers use it to determine if the instance is healthy; Kubernetes/Docker health checks; monitoring systems

5. **"Why separate `app.ts` from `server.ts`?"**
   - `app.ts` creates the Fastify app (testable in isolation without starting a port)
   - `server.ts` starts listening on a port (only in production/development)
   - In tests, we use `app.inject()` which doesn't need an open port

---

## Day 1 Checklist

- [ ] Node.js 22 LTS installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Project initialized with `pnpm init`
- [ ] TypeScript configured (`tsconfig.json`)
- [ ] Fastify + plugins installed
- [ ] `src/config/env.ts` created (environment validation)
- [ ] `src/utils/errors.ts` created (custom errors)
- [ ] `src/app.ts` created (Fastify factory)
- [ ] `src/server.ts` created (entry point)
- [ ] `.env` file created (never commit this!)
- [ ] `.env.example` created (commit this)
- [ ] `.gitignore` created
- [ ] Server running (`pnpm dev`)
- [ ] `/health` endpoint working
- [ ] Swagger docs visible at `/docs`
- [ ] First Git commit made

---

## What's Next: Day 2

**Day 2: Fastify Deep Dive**
- Fastify hooks (onRequest, preHandler, onSend, onResponse)
- Fastify plugin system — how to modularize your app
- Route schemas with full TypeScript type inference
- Building the first real routes: `/api/v1/` prefix
- Understanding request lifecycle

---

*Completed Day 1: 2026-06-13 | Next: DAY_02_FASTIFY_DEEPDIVE.md*
