# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Repository Is

This is the **curriculum and documentation directory** for GoBasket — a Zepto-like quick commerce backend built over 30 days as a learning project targeting the 2026 Indian and global job market.

**There is no runnable code here.** This directory contains only `.md` guide files. The actual Node.js/TypeScript project will be created separately in a folder named `gobasket-backend/` when the user reaches that step in `DAY_01_FOUNDATION.md`.

---

## Zero Assumption Protocol — Do This Before Every Task

**Read these files at the start of every session, in this order:**

1. `SESSION_LOG.md` — what was done last session, what's pending, what's next
2. `MASTER_PLAN.md` — current position in the 30-day roadmap
3. The relevant `DAY_XX_*.md` file for today's work

**Before any edit to an `.md` file:**
- State what you are about to change and why
- Check `SESSION_LOG.md` to confirm it aligns with what was last decided
- Research from updated sources before writing technical content — do not write from training data alone

**After every session:**
- Update `SESSION_LOG.md` with what was done, what changed, and what the next session should start with

---

## Repository Files

| File | Purpose |
|------|---------|
| `MASTER_PLAN.md` | 30-day learning roadmap with daily goals and outcomes |
| `PHILOSOPHY.md` | Working principles, code quality rules, 2026 market context |
| `ARCHITECTURE.md` | System design, modular folder structure, DB schema, module communication rules |
| `TECH_STACK.md` | Every technology used with docs links and reasons for choosing it |
| `DAY_01_FOUNDATION.md` | Day 1 guide — TypeScript, Fastify, project init, first server |
| `SESSION_LOG.md` | Session-by-session log of decisions, changes, and pending items |

New daily guide files follow the naming convention: `DAY_XX_TOPIC_NAME.md`

---

## Architectural Decisions Already Made

These are finalized — do not reverse without explicit user instruction.

### Pattern: Modular Monolith (Vertical Slicing)
Each domain is a self-contained module. The horizontal/layered pattern (`controllers/`, `services/`, `repositories/` at the root) was explicitly **rejected** in Session 2.

```
src/modules/auth/          ← routes, controller, service, repository, schema, types all here
src/modules/products/
src/modules/orders/jobs/   ← module-specific background jobs live inside the module
src/shared/                ← database, cache, errors, utils — used by all modules, never cross-module
src/plugins/               ← Fastify global plugins (cors, helmet, rate-limit, swagger)
src/config/env.ts          ← Zod-validated environment variables
```

**Module communication rule:** Modules import only from `src/shared/` — never directly from each other. Cross-module data flows through the repository layer or a job queue.

**Module anatomy** (every module follows this exact pattern):
```
auth.module.ts      ← Fastify plugin entry point (uses fastify-plugin / fp())
auth.routes.ts      ← URL + HTTP method → controller function
auth.controller.ts  ← parse request, call service, send response
auth.service.ts     ← business logic only, no HTTP knowledge
auth.repository.ts  ← database queries only, no business logic
auth.schema.ts      ← Zod + JSON Schema for request/response validation
auth.types.ts       ← TypeScript interfaces scoped to this module
```

### Tech Stack (Fixed for 30 Days)
| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Node.js 22 LTS | |
| Language | TypeScript 5.x strict mode | |
| Framework | Fastify v5 | NOT Express |
| ORM | Prisma 5 | schema in `prisma/schema.prisma` |
| Database | PostgreSQL 16 | Supabase for cloud (free tier) |
| Cache/Queue backend | Redis 7 | Upstash for cloud (free tier) |
| Job queue | BullMQ | |
| Validation | Zod | also used for env var validation |
| Testing | Vitest | NOT Jest |
| Package manager | pnpm | NOT npm or yarn |
| API docs | @fastify/swagger + @fastify/swagger-ui | served at `/docs` |
| Payments | Razorpay | Indian market standard |

### Project Scripts (once `gobasket-backend/` exists)
```bash
pnpm dev          # tsx watch src/server.ts
pnpm build        # tsc
pnpm start        # node dist/server.js
pnpm test         # vitest run
pnpm test:watch   # vitest
```

### Test Structure
Tests mirror the modules structure exactly:
```
tests/modules/auth/auth.service.test.ts    ← unit test
tests/modules/auth/auth.routes.test.ts     ← integration test (uses app.inject())
tests/helpers/test-app.ts                  ← build Fastify app without opening a port
tests/helpers/factories.ts                 ← test data factories
```

---

## How to Add a New Day Guide

When creating `DAY_XX_TOPIC.md`:
1. Check `SESSION_LOG.md` to confirm it is the correct next day
2. Read the previous day's guide to understand what was built
3. Research the topic from official/current docs before writing — do not rely on training data for version-specific details
4. Structure: Zero Assumption Check → WHY (concepts) → HOW (step-by-step) → Interview Questions → Checklist → What's Next
5. All code paths in examples must match the modular monolith structure above
6. After creating the file, update `SESSION_LOG.md`

---

## Memory System

Persistent memory lives at:
`C:/Users/Admin/.claude/projects/D--CodeSpace-Parmanent-Field-NodeJs-backend-GoBasket/memory/`

Key memory files:
- `project_gobasket.md` — project context and 30-day roadmap status
- `tech_stack_decisions.md` — architecture decisions with reasons (includes the modular monolith decision)
- `feedback_working_style.md` — zero assumption protocol details
- `user_profile.md` — learner profile, market target

Always read relevant memory files before starting work. Always update `tech_stack_decisions.md` when an architectural decision changes.
