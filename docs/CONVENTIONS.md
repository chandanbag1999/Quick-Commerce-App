# Code Conventions — GoBasket API

> These rules apply to every file in this codebase. Zero assumptions — read this before writing any code.

---

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Controllers | `camelCase.controller.ts` | `auth.controller.ts` |
| Services | `camelCase.service.ts` | `auth.service.ts` |
| Repositories | `camelCase.repository.ts` | `user.repository.ts` |
| Routes | `camelCase.routes.ts` | `auth.routes.ts` |
| DTOs | `camelCase.dto.ts` | `register.dto.ts` |
| Validators | `camelCase.validator.ts` | `register.validator.ts` |
| Types | `camelCase.types.ts` | `auth.types.ts` |
| Shared | `camelCase.ts` or `index.ts` | `response.ts`, `index.ts` |

---

## Class / Function Naming

```typescript
// Controllers — class-based, method per endpoint
export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {}
  login = async (req: Request, res: Response, next: NextFunction) => {}
}

// Services — class-based
export class AuthService {
  async register(payload: RegisterPayload): Promise<AuthTokens> {}
}

// Repositories — class-based
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {}
  async create(data: CreateUserDto): Promise<User> {}
}

// Routes — function returns Router
export function authRouter(): Router {
  const router = Router();
  const controller = new AuthController();
  router.post('/register', controller.register);
  return router;
}

// Validators — Zod schema, exported as const
export const registerSchema = z.object({ ... });
export type RegisterDto = z.infer<typeof registerSchema>;
```

---

## Response Shape Contract

**Always use helpers from `src/shared/utils/response.ts`.** Never write raw `res.json()` in controllers.

**Success (single item):**
```json
{ "success": true, "message": "User created", "data": { ... } }
```

**Success (list):**
```json
{
  "success": true,
  "message": "Products retrieved",
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

**Error:**
```json
{ "success": false, "message": "Product not found" }
```

**Validation error:**
```json
{ "success": false, "message": "Validation failed", "errors": { "email": ["Invalid email"] } }
```

---

## Error Throwing Rules

```typescript
// In services
throw new NotFoundError('Product');          // when DB returns null for a findById
throw new ConflictError('Email');            // when unique constraint would fail
throw new BadRequestError('message');        // for invalid business logic inputs
throw new ForbiddenError();                  // when auth user lacks permission
throw new ValidationError(zodErrors);        // for validation failures (usually from validator layer)

// In repositories
// ONLY throw InternalError for unexpected DB failures
// Let services handle business-rule errors
```

---

## Validation Pattern

```typescript
// In validators/register.validator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// In controllers — validate at the top, before any service call
const parsed = registerSchema.safeParse(req.body);
if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
  throw new ValidationError(errors);
}
const dto = parsed.data;
```

---

## Import Order

1. Node built-ins (`path`, `crypto`)
2. Third-party packages (`express`, `zod`, `jsonwebtoken`)
3. Internal absolute paths using aliases (`@config/env`, `@shared/exceptions`)
4. Relative imports (avoid if possible — use aliases)

---

## DO / DO NOT

| DO | DO NOT |
|----|--------|
| Use `@config/env` for all env vars | Use `process.env.X` outside `src/config/env.ts` |
| Throw `AppError` subclasses | `res.status(404).json(...)` in a catch block |
| Use response helpers | Raw `res.json()` in controllers |
| Validate with Zod at controller layer | Trust `req.body` types without validation |
| Import from `@shared/` | Import from another module's internals |
| Write `async/await` | Raw promise chains |
| Log with `src/shared/logger` | `console.log()` in production paths |
| Parameterized DB queries | String-concatenated SQL |

---

## TypeScript Strictness

`tsconfig.json` has `strict: true` and `noImplicitAny: true`. This means:

- Every function parameter must be typed
- No `any` unless absolutely unavoidable (and only with a comment explaining why)
- Use `unknown` instead of `any` for external data, then narrow with Zod
- `AuthenticatedRequest` from `src/types` for routes that require auth

---

## Pagination

Always use `parsePagination` and `buildPaginationMeta` from `src/shared/utils/pagination.ts`:

```typescript
const { page, limit, offset } = parsePagination(req.query);
const { items, total } = await productService.findAll({ limit, offset });
return sendPaginated(res, items, buildPaginationMeta(total, page, limit));
```

Default: page=1, limit=20, max limit=100.

---

## Cache Usage

```typescript
import { redis } from '@shared/redis';
import { CACHE_KEYS, CACHE_TTL } from '@shared/constants';

// Read
const cached = await redis.get(CACHE_KEYS.PRODUCT(id));
if (cached) return JSON.parse(cached);

// Write
await redis.setex(CACHE_KEYS.PRODUCT(id), CACHE_TTL.LONG, JSON.stringify(product));

// Invalidate
await redis.del(CACHE_KEYS.PRODUCT(id));
```

Always use `CACHE_KEYS.*` constants — never raw string keys.
