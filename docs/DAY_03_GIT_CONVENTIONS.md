# Day 3 — Git Mastery, ESLint, Prettier & Project Conventions

> **Date:** 2026-06-14 | **Phase:** 1 (Foundation) | **Day:** 3 of 30

---

## Before You Start (Zero Assumption Check)
- [ ] Read `docs/SESSION_LOG.md` — Days 1 and 2 confirmed complete
- [ ] `pnpm dev` still starts the server on port 3000
- [ ] `GET /api/v1/health` returns 200

---

## Today's Goal

By end of Day 3, you will have:
1. Git branching strategy that matches how real teams work
2. ESLint v9 (flat config) running on every file with TypeScript-aware rules
3. Prettier auto-formatting on save and on every commit
4. Husky pre-commit hook — bad code cannot be committed
5. Zero lint warnings in the entire codebase
6. Understanding of Conventional Commits (mandatory for Indian tech companies)

**Why This Matters for Interviews:**
"How do you maintain code quality in a team?" Every senior developer will ask this. Knowing ESLint v9 flat config specifically shows you're current — most tutorials still teach the old `.eslintrc` format.

---

## Part 1: Git Branching Strategy (WHY Before HOW)

### The Problem Without Branches

Imagine 5 developers all pushing to `main` directly:
```
Dev A pushes → breaks auth
Dev B pushes → breaks payments (didn't know A broke auth)
Dev C pushes → now 3 things are broken
Production is down. Nobody knows what to roll back.
```

### The Solution: Feature Branch Workflow

Every new feature or fix lives in its own branch. `main` is always deployable.

```
main (always works, always deployable)
  │
  ├── feat/user-authentication       ← Dev A works here
  ├── feat/product-search            ← Dev B works here
  ├── fix/cart-price-calculation     ← Dev C works here
  └── chore/update-dependencies      ← Dev D works here
```

### Branch Naming Convention (Industry Standard)

```bash
# Feature — new functionality
feat/user-authentication
feat/product-search
feat/razorpay-payment-integration

# Fix — bug fixes
fix/cart-price-rounding
fix/otp-expiry-not-working

# Chore — maintenance, no code logic change
chore/update-dependencies
chore/add-eslint

# Refactor — code restructuring, no new features
refactor/extract-payment-service

# Test — adding/fixing tests
test/auth-service-unit-tests

# Docs — documentation only
docs/add-api-examples
```

### The Daily Workflow

```bash
# 1. Always start from latest main
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b feat/user-authentication

# 3. Work, commit often
git add src/modules/auth/
git commit -m "feat(auth): add JWT token generation"
git commit -m "feat(auth): add refresh token rotation"
git commit -m "test(auth): add unit tests for AuthService"

# 4. Push your branch
git push origin feat/user-authentication

# 5. Open a Pull Request on GitHub — never push directly to main
# PR gets reviewed → approved → merged → branch deleted
```

---

## Part 2: Conventional Commits (The Standard Format)

### Format

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — breaking changes, issue references]
```

### All Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OTP login` |
| `fix` | Bug fix | `fix(cart): correct price rounding` |
| `refactor` | Code change with no feature/fix | `refactor(orders): extract OrderFSM class` |
| `test` | Add or fix tests | `test(auth): add JWT expiry edge case` |
| `docs` | Documentation only | `docs: update API examples in README` |
| `chore` | Maintenance (deps, config) | `chore: upgrade Fastify to v5.8` |
| `perf` | Performance improvement | `perf(products): add database index` |
| `ci` | CI/CD pipeline changes | `ci: add GitHub Actions test workflow` |
| `style` | Formatting only (Prettier ran) | `style: run Prettier on all src files` |
| `build` | Build system changes | `build: update tsconfig target to ES2022` |

### Scope (Optional but Recommended)

The scope is the MODULE or DOMAIN affected:
```
feat(auth): ...
feat(products): ...
fix(cart): ...
fix(orders): ...
refactor(payments): ...
test(users): ...
```

### Breaking Changes

```bash
# Option 1 — add ! before colon
feat(auth)!: change JWT payload structure

# Option 2 — add BREAKING CHANGE footer
feat(auth): change JWT payload structure

BREAKING CHANGE: JWT now contains userId instead of id.
All clients must update their token parsing logic.
```

### Real Examples from GoBasket

```
feat(auth): add bcrypt password hashing with cost factor 12
fix(cart): prevent negative quantity when removing items
refactor(health): extract HealthService from inline handler
test(products): add unit tests for ProductService.search()
docs(api): add Razorpay webhook setup guide
chore: upgrade typescript-eslint to v8.61.0
perf(products): add composite index on category_id and status
ci: add pnpm caching to GitHub Actions workflow
```

---

## Part 3: ESLint v9 — The New Flat Config (WHY It Changed)

### Old Way (`.eslintrc.json`) — Dead as of ESLint v9

```json
// .eslintrc.json — OLD, no longer supported in ESLint v9
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": { "no-unused-vars": "warn" }
}
```

**Problems with the old way:**
- Cascading configs were hard to reason about (`.eslintrc` in every subfolder)
- Plugin registration was string-based — no TypeScript type checking
- Confusing `extends` vs `plugins` vs `rules` mental model

### New Way (`eslint.config.js`) — Flat Config

```javascript
// eslint.config.js — ESLint v9 format
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },   // global ignores
  js.configs.recommended,                     // JS rules
  ...tseslint.configs.recommended,            // TS rules
  prettier,                                   // disable formatting rules
  {
    files: ['**/*.ts'],
    rules: { /* your custom rules */ }
  }
)
```

**Why better:**
- One file, one source of truth — no cascading confusion
- Plugins are imported as JS objects — TypeScript can check them
- `files` and `ignores` are explicit — no magic
- `tseslint.config()` helper provides full TypeScript autocomplete

### Our ESLint Rules Explained

```javascript
'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
// WHY: Catch variables you declared but never used (memory/confusion).
// argsIgnorePattern: variables starting with _ are intentionally unused
// Example: async function handler(_req, reply) — _req is unused intentionally

'@typescript-eslint/no-explicit-any': 'warn'
// WHY: `any` defeats TypeScript's purpose. Warn so you fix it.
// Later we'll make this 'error' when the codebase is mature.

'@typescript-eslint/explicit-function-return-type': 'off'
// WHY: TypeScript already infers return types. Forcing explicit returns
// is boilerplate. Trust the inference.

'prefer-const': 'error'
// WHY: If a variable is never reassigned, it should be const.
// Signals intent and prevents accidental reassignment.

'no-console': ['warn', { allow: ['error', 'warn'] }]
// WHY: console.log pollutes production logs. Use app.log (Pino) instead.
// We allow console.error and console.warn for startup crashes only.
```

---

## Part 4: Prettier — Why Formatting Matters

### The Problem Without Prettier

```typescript
// Developer A writes:
const user = {name: "John",email: "john@example.com",age:25}

// Developer B writes:
const user = {
  name: "John",
  email: "john@example.com",
  age: 25,
}

// Developer C writes:
const user = { name: "John", email: "john@example.com", age: 25 }
```

Three different styles for the same code. Code reviews become arguments about formatting instead of logic. PR diffs are full of whitespace changes.

**Prettier solves this:** everyone's code looks identical. Zero debates. Code reviews focus on logic only.

### Our Prettier Config Explained

```json
{
  "semi": false,
  // WHY: No semicolons — modern JS/TS doesn't need them (ASI handles it).
  // Industry trend: Airbnb guide still uses semi, but most new projects don't.

  "singleQuote": true,
  // WHY: Single quotes for strings. Consistent with most TS style guides.

  "trailingComma": "es5",
  // WHY: Trailing commas in objects/arrays/params.
  // Makes git diffs cleaner — adding a new item only adds 1 line, not 2.
  // Before: { a: 1, b: 2 }  → After: { a: 1, b: 2, c: 3 }
  // With trailing comma: { a: 1, b: 2, } → { a: 1, b: 2, c: 3, }
  // Git diff shows only the new line, not the changed comma line.

  "printWidth": 100,
  // WHY: 80 chars is too narrow for TypeScript with generics.
  // 100 chars fits on most monitors without horizontal scrolling.

  "endOfLine": "lf",
  // WHY: Linux/Mac line endings. Consistent across all OS.
  // Windows uses CRLF by default — causes diff noise in Git.
  // .gitattributes also enforces this.
}
```

---

## Part 5: Husky + lint-staged — The Safety Net

### What Husky Does

Husky runs scripts when Git events happen. We use it for the `pre-commit` hook — runs BEFORE every `git commit`. If the script fails, the commit is rejected.

```
git commit -m "feat: add product search"
    │
    ▼
.husky/pre-commit runs: pnpm exec lint-staged
    │
    ├── ESLint fixes auto-fixable issues in staged *.ts files
    ├── Prettier formats staged *.ts, *.json, *.md files
    │
    ├── ALL PASS → commit proceeds ✅
    └── ESLint finds unfixable error → commit REJECTED ❌
        (you must fix the error, then re-commit)
```

### What lint-staged Does

lint-staged runs linters only on **staged files** (files you `git add`-ed). Not the entire project. This is fast — only lints what changed.

```json
// In package.json:
"lint-staged": {
  "*.ts": [
    "eslint --fix",    // 1. auto-fix ESLint issues
    "prettier --write" // 2. auto-format
  ],
  "*.{json,md}": [
    "prettier --write" // format JSON and markdown too
  ]
}
```

### The Workflow With Husky + lint-staged

```bash
# You write messy code:
const   x =  'hello'    // bad spacing, wrong quotes

# You stage it:
git add src/modules/auth/auth.service.ts

# You commit:
git commit -m "feat(auth): add login endpoint"

# Husky fires → lint-staged runs:
# 1. ESLint fixes what it can automatically
# 2. Prettier formats the file
# 3. The formatted file is re-staged automatically
# 4. Commit proceeds with clean code
```

---

## Part 6: .gitattributes — End the CRLF War

Windows uses `CRLF` (\r\n) for line endings. Linux/Mac use `LF` (\n). When developers on different OS collaborate, Git shows fake "changes" that are just line ending differences.

Our `.gitattributes` fixes this permanently:

```
* text=auto eol=lf
```

This tells Git: *"For ALL text files, normalize line endings to LF when committing."*

**Result:** No more "LF will be replaced by CRLF" warnings in Git.

---

## Part 7: What Was Implemented Today

### Files Created/Modified

| File | Purpose |
|------|---------|
| `eslint.config.js` | ESLint v9 flat config — TypeScript-aware rules |
| `.prettierrc` | Prettier formatting rules |
| `.prettierignore` | Files Prettier skips |
| `.editorconfig` | Consistent editor settings across VS Code, JetBrains, etc. |
| `.gitattributes` | Normalize line endings to LF — no CRLF noise |
| `.husky/pre-commit` | Run lint-staged before every commit |
| `package.json` | Added lint, lint:fix, format, format:check scripts + lint-staged config |

### Commands Available

```bash
pnpm lint           # Check for ESLint issues (read-only)
pnpm lint:fix       # Auto-fix ESLint issues where possible
pnpm format         # Auto-format all src/ files with Prettier
pnpm format:check   # Check formatting without changing files (used in CI)
pnpm dev            # Start server with hot reload (cross-env PORT=3000)
```

---

## Interview Questions from Day 3

1. **"How do you enforce code quality in your projects?"**
   - ESLint catches logic issues, Prettier enforces formatting. Husky's pre-commit hook runs lint-staged — only on staged files (fast). Bad code literally cannot be committed.

2. **"What's the difference between ESLint and Prettier?"**
   - ESLint: catches bugs and enforces code patterns (logic). Prettier: enforces formatting (style). They serve different purposes. `eslint-config-prettier` disables ESLint's formatting rules so they don't conflict.

3. **"What is ESLint flat config and why was it introduced?"**
   - ESLint v9's new configuration format. Single `eslint.config.js` file instead of cascading `.eslintrc.*` files. Plugins are imported as JS objects (type-safe). Eliminated confusion from cascading configs and string-based plugin registration.

4. **"What is your Git branching strategy?"**
   - Feature branch workflow. `main` is always deployable. Every feature/fix lives in its own branch (`feat/`, `fix/` prefix). PR review before merge. Conventional commits for clean history and automatic changelog generation.

5. **"What are Conventional Commits and why do you use them?"**
   - A standard commit message format: `type(scope): description`. Types like `feat`, `fix`, `refactor`. Makes git history readable, enables automatic changelog generation (tools like `release-it`), and communicates intent clearly to teammates and future-you.

---

## Day 3 Checklist

- [ ] ESLint v9 installed (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`)
- [ ] `eslint.config.js` created (flat config format)
- [ ] Prettier installed (`prettier` v3)
- [ ] `.prettierrc` created
- [ ] `.prettierignore` created
- [ ] `.editorconfig` created
- [ ] `.gitattributes` created (LF line endings)
- [ ] Husky installed + initialized (`pnpm exec husky init`)
- [ ] `.husky/pre-commit` runs `lint-staged`
- [ ] `lint-staged` config in `package.json`
- [ ] `pnpm lint` → 0 errors, 0 warnings ✅
- [ ] `pnpm format:check` → all files formatted ✅
- [ ] Server still starts and `/api/v1/health` returns 200 ✅
- [ ] Git commit with conventional commit format made

---

## What's Next: Day 4

**Day 4: PostgreSQL — The Database Foundation**
- What is PostgreSQL and why it beats MongoDB for GoBasket
- Supabase setup (free PostgreSQL in the cloud)
- `psql` CLI — query database from terminal
- Database connection pooling
- Connect Prisma to the database (Day 5 builds on this)

---

*Day 3 Completed: 2026-06-14 | Next: DAY_04_POSTGRESQL.md*
