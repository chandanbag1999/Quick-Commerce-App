# Auth System Design — GoBasket API

> Architecture decision record for the entire authentication system.
> Every decision is documented with the exact reason the alternatives were rejected.
> Any AI or developer can read this and implement from scratch.

---

## Executive Summary

GoBasket uses **fully custom JWT authentication** on top of **Supabase-hosted PostgreSQL** (via Prisma ORM). Supabase is used purely as a free PostgreSQL host — none of its built-in Auth is used. Google OAuth uses the ID-token verification approach via `google-auth-library`. Phone OTP runs in **dev-safe mode**: OTP is returned in the API response body when `NODE_ENV=development`, and an SMS service interface is provided for production swap-in.

---

## Architecture Decision Record

### Decision 1: Custom JWT vs Supabase Auth

**CHOSEN: Custom JWT with Prisma**

| Alternative | Score | Why Rejected |
|-------------|-------|-------------|
| **Supabase Auth (GoTrue)** | 5/10 | Creates its own `auth.users` table parallel to our Prisma tables. You can't use Prisma to query Supabase Auth users — you'd need both Supabase client AND Prisma client. Custom roles, phone+email+google in one unified User model, Redis session caching — all become harder. Phone OTP in Supabase Auth requires paid plan. |
| **Hybrid (Supabase for Google, custom for rest)** | 4/10 | Two auth systems = two token formats, two user sources, sync complexity. Worst of both worlds. |
| **Fully Custom JWT (chosen)** | 9/10 | One User model. Full control. Portable to any DB host. Redis caching works natively. Phone OTP dev mode is trivial. Production SMS swap-in is a one-function change. |

---

### Decision 2: Google OAuth Mechanism

**CHOSEN: ID Token Verification (google-auth-library)**

```
Frontend flow:
  User clicks "Sign in with Google"
  → Google Sign-In SDK runs in browser/app
  → Google returns ID token (JWT signed by Google)
  → Frontend sends: POST /api/v1/auth/google { idToken: "..." }
  → Backend calls OAuth2Client.verifyIdToken()
  → Extracts: { sub (googleId), email, name, picture }
  → Upserts user in DB
  → Returns our own JWT access + refresh tokens
```

| Alternative | Why Rejected |
|-------------|-------------|
| **passport-google-oauth20** | Uses server-side redirect flow with `res.redirect()`. Requires sessions. Does not work for mobile apps or SPAs that handle their own Google Sign-In. |
| **Manual token exchange** | Rolling your own cert fetching and validation is insecure. google-auth-library handles cert rotation, expiry, audience verification. |

---

### Decision 3: Phone OTP Delivery (No Paid SMS Service)

**CHOSEN: Response body in dev + SMS interface for production**

```
DEV mode (NODE_ENV=development):
  POST /api/v1/auth/send-phone-otp { phone: "9876543210" }
  Response: { success: true, message: "OTP sent", devOtp: "847291" }  ← only in dev
  Frontend shows toast: "Dev OTP: 847291"

PRODUCTION mode:
  Same request
  Response: { success: true, message: "OTP sent" }  ← devOtp absent
  SmsService.send(phone, otp) → calls MSG91 / Twilio / AWS SNS
```

| Alternative | Why Rejected |
|-------------|-------------|
| **Firebase Cloud Messaging** | Requires Firebase project setup, service worker, FCM token registration. Massive overhead for a dev convenience. |
| **Web Push API** | Browser only. Doesn't work for mobile apps. Requires service worker. |
| **Fixed OTP "123456"** | Not realistic. Breaks the actual OTP flow testing. Production swap requires more changes. |
| **Console log only** | Developer can't easily read server console during frontend testing. |

---

### Decision 4: OTP Storage

**CHOSEN: Redis only (no DB table for OTPs)**

| Alternative | Why Rejected |
|-------------|-------------|
| **PostgreSQL OtpCode table** | OTPs are ephemeral. DB table needs cron cleanup job. Redis TTL handles expiry automatically. No need for a write to persist — OTPs die by design. |
| **Redis + DB (both)** | Double-write complexity for no benefit at this stage. |

**OTP Spec:**
- Format: 6-digit numeric (e.g. `847291`)
- Storage key: `otp:{type}:{target}` → value: `{code}:{attemptCount}`
- TTLs: EMAIL_VERIFY = 10min, PHONE_VERIFY = 5min, PASSWORD_RESET = 15min
- Max attempts: 3 (key deleted after 3rd wrong attempt — forces new OTP)
- Resend cooldown key: `otp:cooldown:{type}:{target}` → TTL: 60 seconds
- Rate limit: max 5 OTP sends per phone/email per hour (separate Redis counter)

---

## Complete Auth Flow Diagrams

### Registration Flow (Email + Password)
```
POST /auth/register
  │
  ├── Validate body (zod)
  ├── Check email not already taken
  ├── Hash password (bcryptjs, rounds=12)
  ├── Create User in DB (emailVerified=false)
  ├── Generate 6-digit OTP → store in Redis (key: otp:EMAIL_VERIFY:{email}, TTL 10min)
  ├── Send OTP via email (nodemailer)
  ├── Generate access + refresh tokens
  └── Return 201: { user, tokens }
       ↓
POST /auth/verify-email { otp: "847291" }
  │
  ├── Get OTP from Redis → compare
  ├── If match: set user.emailVerified=true, delete Redis key
  └── Return 200: { message: "Email verified" }
```

### Login Flow (Email + Password)
```
POST /auth/login
  │
  ├── Validate body
  ├── Find user by email
  ├── Compare password (bcryptjs.compare)
  ├── Check user.isActive
  ├── Generate access token (15m) + refresh token (7d)
  ├── Store refresh token hash in DB
  └── Return 200: { user, tokens }
```

### Google OAuth Flow
```
[Frontend]
  Google Sign-In button clicked
  → Google SDK → user logs in → Google returns idToken (JWT)
  → Frontend: POST /auth/google { idToken: "eyJ..." }

[Backend]
POST /auth/google
  │
  ├── Verify idToken with google-auth-library (OAuth2Client.verifyIdToken)
  ├── Extract: { sub→googleId, email, name, picture }
  ├── Find user by googleId OR email
  │   ├── Not found → create new user (no password, no email OTP needed for Google)
  │   └── Found by email but no googleId → link Google account (set googleId)
  ├── Generate access + refresh tokens
  └── Return 200: { user, tokens }
```

### Phone OTP Flow
```
POST /auth/send-phone-otp { phone: "9876543210" }
  │
  ├── Check cooldown key (otp:cooldown:PHONE_VERIFY:9876543210) → 429 if exists
  ├── Generate 6-digit OTP
  ├── Store: otp:PHONE_VERIFY:9876543210 → "847291:0" (TTL 5min)
  ├── Set cooldown: otp:cooldown:PHONE_VERIFY:9876543210 (TTL 60s)
  ├── DEV: include devOtp in response
  └── PROD: SmsService.send("9876543210", "847291")

POST /auth/verify-phone { phone: "9876543210", otp: "847291" }
  │
  ├── Get from Redis: otp:PHONE_VERIFY:9876543210 → "847291:0"
  ├── Parse → code="847291", attempts=0
  ├── If wrong: increment attempts → if attempts≥3, delete key → 400
  ├── If correct: delete key, set user.phoneVerified=true
  └── Return 200: success
```

### Token Refresh Flow
```
POST /auth/refresh { refreshToken: "..." }
  │
  ├── Verify JWT signature
  ├── Hash the token → find in DB (refresh_tokens table)
  ├── Check not expired, not revoked
  ├── Issue new access token + new refresh token (rotation)
  ├── Mark old refresh token as revoked
  ├── Store new refresh token hash in DB
  └── Return 200: { accessToken, refreshToken }
```

---

## Prisma Models

```prisma
model User {
  id            String         @id @default(uuid())
  name          String?
  email         String?        @unique
  emailVerified Boolean        @default(false)
  phone         String?        @unique
  phoneVerified Boolean        @default(false)
  passwordHash  String?
  googleId      String?        @unique
  avatarUrl     String?
  role          Role           @default(CUSTOMER)
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

enum Role {
  CUSTOMER
  ADMIN
  DELIVERY
}
```

---

## All Auth Endpoints

| Method | Path | Auth? | Purpose |
|--------|------|-------|---------|
| POST | /api/v1/auth/register | No | Email+password registration |
| POST | /api/v1/auth/verify-email | No | Verify email OTP |
| POST | /api/v1/auth/resend-otp | No | Resend email OTP |
| POST | /api/v1/auth/login | No | Email+password login |
| POST | /api/v1/auth/google | No | Google Sign-In (ID token) |
| POST | /api/v1/auth/send-phone-otp | Yes | Send phone OTP |
| POST | /api/v1/auth/verify-phone | Yes | Verify phone OTP |
| POST | /api/v1/auth/refresh | No | Refresh access token |
| POST | /api/v1/auth/logout | Yes | Revoke refresh token |
| POST | /api/v1/auth/forgot-password | No | Send password reset OTP to email |
| POST | /api/v1/auth/reset-password | No | Verify OTP + set new password |

---

## Security Hardening

| Concern | Implementation |
|---------|---------------|
| Password hashing | bcryptjs, rounds=12 |
| Token storage | Only token HASH stored in DB (SHA-256) |
| Token rotation | New refresh token issued on every refresh |
| OTP brute force | 3 attempts max → key deleted → must re-request |
| OTP resend spam | 60-second cooldown per target |
| OTP send rate | Max 5 sends/hour per target (Redis counter, TTL 1h) |
| Auth rate limit | 10 requests/15min on all /auth/* routes |
| JWT secret | Min 32 char secrets, different for access and refresh |
| Error messages | Never reveal whether email exists (always "if account exists, OTP sent") |

---

## Environment Variables Required

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://postgres:pw@db.xxx.supabase.co:5432/postgres` | Supabase PostgreSQL direct connection |
| `JWT_ACCESS_SECRET` | 32+ char random string | Sign access tokens |
| `JWT_REFRESH_SECRET` | 32+ char random string (different) | Sign refresh tokens |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token expiry |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Verify Google ID tokens |
| `EMAIL_HOST` | `smtp.ethereal.email` | SMTP host (Ethereal for dev) |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | `dev@ethereal.email` | SMTP user |
| `EMAIL_PASS` | `...` | SMTP password |
| `EMAIL_FROM` | `GoBasket <noreply@gobasket.com>` | From address |

---

## What You Need to Set Up

### 1. Supabase Project (5 minutes)
1. Go to supabase.com → New project
2. Name: `gobasket-api` → set a strong DB password
3. Wait for provisioning (~2 min)
4. Settings → Database → Connection string → URI mode
5. Copy the connection string → put in `.env` as `DATABASE_URL`
6. Replace `[YOUR-PASSWORD]` in the string with your DB password

### 2. Google Cloud Console (10 minutes)
1. console.cloud.google.com → New project: `gobasket`
2. APIs & Services → OAuth consent screen → External → fill app name
3. APIs & Services → Credentials → Create credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Add authorized JavaScript origins: `http://localhost:3000`, `http://localhost:5173`
6. Copy **Client ID** → put in `.env` as `GOOGLE_CLIENT_ID`
7. (Client Secret not needed for ID token verification approach)

### 3. Dev Email (Ethereal — free, instant, no signup)
Run this once in Node.js to get dev credentials:
```javascript
const nodemailer = require('nodemailer');
const account = await nodemailer.createTestAccount();
console.log(account.user, account.pass); // put these in .env
```
Or just use https://ethereal.email → Create Account → copy credentials.
All emails sent in dev are visible at https://ethereal.email/messages — no real email sent.

---

## Packages Installed

- `prisma` (dev) — CLI for migrations
- `@prisma/client` — generated DB client
- `google-auth-library` — verify Google ID tokens
- `nodemailer` — send emails
- `@types/nodemailer` (dev)
