# Session Report — GoBasket Auth System
**Date:** 2026-06-08
**Session Goal:** Build a complete, production-ready authentication service with Supabase + Prisma ORM + Google OAuth + Email OTP + Phone OTP (dev mode) for the GoBasket quick commerce API.

---

## Architecture Decision Summary

Three architectures were evaluated:

| Option | Score | Verdict |
|--------|-------|---------|
| Supabase Auth (built-in GoTrue) | 5/10 | REJECTED |
| Fully custom JWT + Prisma | 9/10 | **CHOSEN** |
| Hybrid (Supabase for Google, custom for rest) | 4/10 | REJECTED |

**Why Supabase Auth was rejected:** It creates its own `auth.users` table in a separate schema that Prisma cannot manage. You'd need two clients — Supabase JS SDK AND Prisma — creating a split user model. Phone OTP on Supabase free tier requires a paid plan. Roles, Redis caching of user sessions, and custom user fields all become harder.

**Why custom JWT was chosen:** One unified User model in Prisma. Full control. Portable. Redis caching works natively. Phone OTP dev mode is trivial. Production SMS swap-in is one function change.

---

## What Was Built

### New Packages Added

| Package | Purpose |
|---------|---------|
| `prisma` (dev) | CLI: migrations, generate |
| `@prisma/client` | Generated type-safe DB client |
| `google-auth-library` | Verify Google ID tokens (stateless, works for web + mobile) |
| `nodemailer` | Send OTP emails via SMTP |
| `@types/nodemailer` (dev) | TypeScript types |
| `tsconfig-paths` (dev) | Resolves `@shared/*` etc. at runtime with ts-node-dev |

---

### Files Created/Modified

**Prisma:**
- `prisma/schema.prisma` — User + RefreshToken models, Role enum (Prisma 7: URL moved out of schema)
- `prisma.config.ts` — Supabase URLs (DIRECT_URL for migrations, DATABASE_URL for runtime)

**Shared services (new):**
- `src/shared/utils/jwt.ts` — signAccess, signRefresh, verifyAccess, verifyRefresh, hashToken
- `src/shared/utils/otp.ts` — OtpService: generate, canSend (cooldown + rate), store, verify, invalidate (all via Redis)
- `src/shared/utils/email.ts` — EmailService: sendOtp, sendPasswordReset (nodemailer)
- `src/shared/utils/google.ts` — GoogleService: verifyIdToken (google-auth-library)
- `src/shared/database/index.ts` — Prisma singleton client + connectDb/disconnectDb

**Auth module:**
- `src/modules/auth/validators/auth.validator.ts` — 10 Zod schemas for every endpoint
- `src/modules/auth/repositories/auth.repository.ts` — All Prisma queries (no business logic)
- `src/modules/auth/services/auth.service.ts` — All business logic (register, login, google, OTP flows, refresh, logout, forgot/reset password)
- `src/modules/auth/controllers/auth.controller.ts` — HTTP layer: parse → validate → call service → respond
- `src/modules/auth/routes/auth.routes.ts` — Router with per-route rate limits

**Updated:**
- `src/app.ts` — Mounted auth router, added error/notFound handlers, added requestLogger
- `src/server.ts` — Now async bootstrap: connects DB, then starts server; graceful shutdown disconnects DB + Redis
- `src/config/env.ts` — Added google + email sections
- `src/shared/guards/auth.guard.ts` — Now uses JwtService (no direct jsonwebtoken usage)
- `tsconfig.json` — Added `ignoreDeprecations: "6.0"` for TS6 compatibility
- `package.json` — Added db:generate, db:migrate, db:push, db:studio scripts; ts-node-dev now registers tsconfig-paths
- `.env.example` — Added DATABASE_URL, DIRECT_URL, GOOGLE_CLIENT_ID, EMAIL_* vars

**New docs:**
- `docs/AUTH_DESIGN.md` — Full ADR + flow diagrams + Prisma schema + endpoint table + security decisions + setup guide

---

### Auth Endpoints Implemented

| Method | Path | Auth? | Description |
|--------|------|-------|-------------|
| POST | `/api/v1/auth/register` | No | Email+password registration, sends email OTP |
| POST | `/api/v1/auth/verify-email` | No | Confirm email OTP |
| POST | `/api/v1/auth/resend-otp` | No | Resend email verification OTP (60s cooldown) |
| POST | `/api/v1/auth/login` | No | Email+password login |
| POST | `/api/v1/auth/google` | No | Google Sign-In (frontend sends ID token) |
| POST | `/api/v1/auth/send-phone-otp` | Yes | Send phone OTP (dev: returns `devOtp` in response) |
| POST | `/api/v1/auth/verify-phone` | Yes | Verify phone OTP |
| POST | `/api/v1/auth/refresh` | No | Rotate refresh token, get new access token |
| POST | `/api/v1/auth/logout` | Yes | Revoke refresh token |
| POST | `/api/v1/auth/forgot-password` | No | Send reset OTP to email |
| POST | `/api/v1/auth/reset-password` | No | Verify OTP + set new password |

---

### Phone OTP Dev Mode (Exactly How It Works)

```
1. Frontend calls: POST /api/v1/auth/send-phone-otp { phone: "9876543210" }
   (must be logged in — Authorization: Bearer {accessToken})

2. Backend:
   - Checks 60s cooldown (Redis key: otp:cooldown:PHONE_VERIFY:9876543210)
   - Generates 6-digit OTP using crypto.randomInt(100000, 999999)
   - Stores in Redis: otp:PHONE_VERIFY:9876543210 → "847291:0" (TTL 300s)
   - Sets cooldown key (TTL 60s)
   - Since NODE_ENV=development: returns { devOtp: "847291" } in response

3. Frontend receives: { success: true, message: "OTP sent to your phone", data: { devOtp: "847291" } }
   Frontend shows toast/alert: "Dev OTP: 847291"

4. Frontend calls: POST /api/v1/auth/verify-phone { phone: "9876543210", otp: "847291" }

5. Backend verifies against Redis → sets user.phoneVerified=true → deletes Redis key

To switch to production SMS:
  In src/modules/auth/services/auth.service.ts, sendPhoneOtp() method:
  Uncomment: await SmsService.send(dto.phone, `Your GoBasket OTP is ${otp}...`);
  SmsService is a one-function interface — wire in MSG91/Twilio/AWS SNS.
```

---

### OTP Security Spec

| Setting | Value |
|---------|-------|
| Format | 6-digit numeric |
| Email verify TTL | 10 minutes |
| Phone verify TTL | 5 minutes |
| Password reset TTL | 15 minutes |
| Max attempts | 3 (key deleted on 3rd wrong → must re-request) |
| Resend cooldown | 60 seconds |
| Hourly send limit | 5 per target |

---

### Token Security

| Setting | Value |
|---------|-------|
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |
| Refresh token storage | SHA-256 hash in `refresh_tokens` DB table |
| Token rotation | New refresh token on every refresh call |
| Logout | Marks specific refresh token as revoked |
| Password reset | Revokes ALL refresh tokens for the user |
| bcrypt rounds | 12 |

---

## What You Need to Do Before Running

### Step 1: Create Supabase Project (5 min)
1. `supabase.com` → Sign Up → New Project
2. Name: `gobasket-api`, choose a region (closest to you)
3. Set a strong DB password (save it!)
4. Wait ~2 minutes for provisioning
5. Go to: **Settings → Database → Connection string**
6. Copy both:
   - **Transaction pooler** (port 6543) → `DATABASE_URL`
   - **Direct connection** (port 5432) → `DIRECT_URL`

### Step 2: Get Google OAuth Client ID (10 min)
1. `console.cloud.google.com` → New Project: `gobasket`
2. **APIs & Services** → **OAuth consent screen** → External
   - App name: GoBasket, User support email: your email
   - Save
3. **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add **Authorized JavaScript origins**: `http://localhost:3000`, `http://localhost:5173`
6. Click Create → Copy the **Client ID** (NOT the secret)

### Step 3: Get Dev Email (2 min)
Go to `ethereal.email` → click "Create Account" → copy the user/pass shown.

### Step 4: Create .env File
```bash
cp .env.example .env
```
Then fill in:
```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your.generated@ethereal.email
EMAIL_PASS=yourGeneratedPassword
```
Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run it twice — one for `JWT_ACCESS_SECRET`, one for `JWT_REFRESH_SECRET`.

### Step 5: Run Migrations
```bash
npm run db:migrate
# Name: init_auth
```
This creates the `users` and `refresh_tokens` tables in Supabase.

### Step 6: Start Dev Server
```bash
npm run dev
```
Test: `http://localhost:3000/api/v1/health`

---

## TypeScript Status

`npx tsc --noEmit` → **0 errors, 0 warnings**

All code is strictly typed. No `any`, no loose types.

---

## Next Steps

1. **Test all auth endpoints** (curl or Postman collection)
2. **Build Users module** — GET/PUT /users/me, address management
3. **Build Categories module**
4. **Build Products module**
5. Future: Replace `devOtp` with real SMS via MSG91/Twilio (one-line swap in `auth.service.ts`)

---

## File Count — Auth Session

| Category | Count |
|----------|-------|
| New TypeScript files | 9 |
| Modified TypeScript files | 6 |
| New config/schema files | 1 |
| Modified config files | 4 |
| New documentation files | 1 |
| **Total changed** | **21** |
