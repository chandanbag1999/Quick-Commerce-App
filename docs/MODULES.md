# Module Ownership — GoBasket API

> For each module: what it owns, what DB tables it manages, what endpoints it will expose, and what it depends on.

---

## Module Dependency Rule

**Modules CANNOT import from each other's internals.**
If module A needs something from module B, it goes through the DB or Redis — or through an explicit shared interface in `src/shared/`.
This is non-negotiable. It keeps the codebase extractable into microservices.

---

## auth

**Owns:** Login, registration, token refresh, logout, password reset

**DB Tables:**
- `users` (shared with users module — auth writes the record on register)
- `refresh_tokens` (id, user_id, token_hash, expires_at, revoked_at, created_at)

**Endpoints (planned):**
```
POST /api/v1/auth/register       → creates user, returns tokens
POST /api/v1/auth/login          → validates credentials, returns tokens
POST /api/v1/auth/refresh        → exchanges refresh token for new access token
POST /api/v1/auth/logout         → revokes refresh token
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

**Dependencies:** users (to write user records), redis (token blacklist)

---

## users

**Owns:** User profile CRUD, address management

**DB Tables:**
- `users` (id, name, email, password_hash, phone, role, is_active, created_at, updated_at)
- `addresses` (id, user_id, label, line1, line2, city, state, pin_code, is_default, created_at)

**Endpoints (planned):**
```
GET    /api/v1/users/me              → get own profile
PUT    /api/v1/users/me              → update own profile
GET    /api/v1/users/me/addresses    → list addresses
POST   /api/v1/users/me/addresses    → add address
PUT    /api/v1/users/me/addresses/:id
DELETE /api/v1/users/me/addresses/:id
GET    /api/v1/users          [admin] → list all users
PUT    /api/v1/users/:id      [admin] → update any user
```

**Dependencies:** auth (for authentication guard)

---

## categories

**Owns:** Product category tree (supports parent-child nesting)

**DB Tables:**
- `categories` (id, name, slug, parent_id, image_url, is_active, sort_order, created_at)

**Endpoints (planned):**
```
GET    /api/v1/categories              → flat list or tree
GET    /api/v1/categories/:id
POST   /api/v1/categories      [admin]
PUT    /api/v1/categories/:id  [admin]
DELETE /api/v1/categories/:id  [admin]
```

**Caching:** Full list cached in Redis (CACHE_KEYS.CATEGORIES_LIST), TTL 24h. Invalidated on any write.

**Dependencies:** none

---

## products

**Owns:** Product catalog — creation, listing, search, detail

**DB Tables:**
- `products` (id, sku, name, slug, description, price, compare_price, images, category_id, is_active, is_featured, weight_g, created_at, updated_at)

**Endpoints (planned):**
```
GET    /api/v1/products                 → paginated list (filter by category, search)
GET    /api/v1/products/:id             → product detail
POST   /api/v1/products         [admin]
PUT    /api/v1/products/:id     [admin]
DELETE /api/v1/products/:id     [admin]
GET    /api/v1/products/featured
GET    /api/v1/products/search?q=
```

**Caching:** Per-product (CACHE_KEYS.PRODUCT(id)), TTL 1h. Lists (CACHE_KEYS.PRODUCTS_LIST(queryHash)), TTL 5m.

**Dependencies:** categories, inventory (for stock status in product response)

---

## inventory

**Owns:** Stock levels per product, stock movement history

**DB Tables:**
- `inventory` (id, product_id UNIQUE, quantity, reserved_quantity, low_stock_threshold, updated_at)
- `inventory_logs` (id, product_id, change, reason, reference_id, created_at)

**Endpoints (planned):**
```
GET    /api/v1/inventory/:productId        [admin]
PUT    /api/v1/inventory/:productId        [admin] → set stock level
POST   /api/v1/inventory/:productId/adjust [admin] → increment/decrement
GET    /api/v1/inventory/low-stock         [admin] → items below threshold
```

**Special logic:**
- `reserved_quantity` increases when an order is placed (not yet dispatched)
- `quantity` decreases when order is dispatched/delivered
- Available stock = `quantity - reserved_quantity`
- Writes to inventory must invalidate product cache

**Dependencies:** products

---

## carts

**Owns:** User cart — add/remove items, quantity updates, cart summary

**Storage:** Redis-first (CACHE_KEYS.CART(userId)). Cart is persisted to a `carts` DB table for recovery but Redis is the source of truth during a session.

**DB Tables:**
- `carts` (id, user_id UNIQUE, created_at, updated_at)
- `cart_items` (id, cart_id, product_id, quantity, price_snapshot, created_at)

**Endpoints (planned):**
```
GET    /api/v1/carts/me           → get current user's cart
POST   /api/v1/carts/me/items     → add item to cart
PUT    /api/v1/carts/me/items/:id → update quantity
DELETE /api/v1/carts/me/items/:id → remove item
DELETE /api/v1/carts/me           → clear cart
```

**Critical rule:** Always snapshot the `price` at time of add-to-cart. Do NOT read live product price at checkout — use the snapshot. This prevents price drift between add and order placement.

**Dependencies:** products (to validate product exists and get price), inventory (to check stock)

---

## orders

**Owns:** Order lifecycle from placement to delivery

**DB Tables:**
- `orders` (id, user_id, address_id, status, payment_status, subtotal, delivery_fee, total, notes, placed_at, updated_at)
- `order_items` (id, order_id, product_id, quantity, unit_price, total_price)
- `order_status_history` (id, order_id, from_status, to_status, changed_by, changed_at, note)

**Endpoints (planned):**
```
POST   /api/v1/orders               → place order from cart
GET    /api/v1/orders/me            → list own orders
GET    /api/v1/orders/me/:id        → order detail
POST   /api/v1/orders/:id/cancel    → cancel own order (only if pending/confirmed)
GET    /api/v1/orders               [admin] → all orders
PUT    /api/v1/orders/:id/status    [admin] → update order status
```

**Order status flow:**
```
pending → confirmed → processing → dispatched → delivered
         ↓                        ↓
       cancelled              cancelled (only before dispatch)
```

**On order placement:**
1. Validate cart is not empty
2. Check inventory availability for all items
3. Reserve inventory (`inventory.reserved_quantity += qty`)
4. Create order + order_items records
5. Clear cart
6. Return order confirmation

**Dependencies:** carts, products, inventory, users (for address)
