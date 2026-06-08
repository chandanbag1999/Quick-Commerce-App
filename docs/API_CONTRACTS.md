# API Contracts — GoBasket API

> Request bodies, response shapes, and status codes for every planned endpoint. This is the contract between frontend and backend. Update this whenever an endpoint shape changes.

**Base URL:** `/api/v1`
**Auth header:** `Authorization: Bearer <accessToken>`

---

## Auth Module

### POST /auth/register
**Body:**
```json
{ "name": "Rahul Sharma", "email": "rahul@example.com", "password": "Secure123!", "phone": "9876543210" }
```
**Response 201:**
```json
{
  "success": true, "message": "Registration successful",
  "data": {
    "user": { "id": "uuid", "name": "Rahul Sharma", "email": "rahul@example.com", "role": "customer" },
    "tokens": { "accessToken": "jwt...", "refreshToken": "jwt..." }
  }
}
```
**Errors:** 409 (email exists), 422 (validation)

---

### POST /auth/login
**Body:** `{ "email": "...", "password": "..." }`
**Response 200:**
```json
{
  "success": true, "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "name": "...", "email": "...", "role": "customer" },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```
**Errors:** 401 (invalid credentials), 422 (validation)

---

### POST /auth/refresh
**Body:** `{ "refreshToken": "jwt..." }`
**Response 200:** `{ "data": { "accessToken": "...", "refreshToken": "..." } }`
**Errors:** 401 (invalid/expired refresh token)

---

### POST /auth/logout _(auth required)_
**Body:** `{ "refreshToken": "jwt..." }`
**Response 204:** empty

---

## Users Module

### GET /users/me _(auth required)_
**Response 200:**
```json
{
  "data": { "id": "...", "name": "...", "email": "...", "phone": "...", "role": "customer", "createdAt": "..." }
}
```

### PUT /users/me _(auth required)_
**Body:** `{ "name": "...", "phone": "..." }` (all optional)
**Response 200:** updated user object

### GET /users/me/addresses _(auth required)_
**Response 200:** `{ "data": [ { "id": "...", "label": "Home", "line1": "...", ... } ] }`

### POST /users/me/addresses _(auth required)_
**Body:** `{ "label": "Home", "line1": "123 MG Road", "city": "Bangalore", "state": "Karnataka", "pinCode": "560001" }`
**Response 201:** created address object

---

## Categories Module

### GET /categories
**Query:** `?tree=true` (returns nested structure) or flat list by default
**Response 200:**
```json
{
  "data": [
    { "id": "...", "name": "Fruits & Vegetables", "slug": "fruits-vegetables", "parentId": null, "imageUrl": "...", "sortOrder": 1 }
  ]
}
```

### GET /categories/:id
**Response 200:** single category object
**Errors:** 404

---

## Products Module

### GET /products
**Query params:** `page`, `limit`, `categoryId`, `q` (search), `featured=true`
**Response 200:**
```json
{
  "data": [
    { "id": "...", "sku": "...", "name": "Banana", "slug": "banana", "price": 40.00, "comparePrice": 50.00,
      "images": ["url1"], "categoryId": "...", "stock": 100 }
  ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

### GET /products/:id
**Response 200:** full product object with `stock` field (available = quantity - reserved)
**Errors:** 404

---

## Carts Module

### GET /carts/me _(auth required)_
**Response 200:**
```json
{
  "data": {
    "id": "...", "items": [
      { "id": "...", "productId": "...", "name": "Banana", "quantity": 2, "priceSnapshot": 40.00, "subtotal": 80.00 }
    ],
    "subtotal": 80.00, "itemCount": 2
  }
}
```

### POST /carts/me/items _(auth required)_
**Body:** `{ "productId": "uuid", "quantity": 2 }`
**Response 200:** updated cart object
**Errors:** 404 (product), 409 (out of stock)

### PUT /carts/me/items/:itemId _(auth required)_
**Body:** `{ "quantity": 3 }` (set to 0 to remove)
**Response 200:** updated cart

### DELETE /carts/me _(auth required)_
**Response 204:** empty (cart cleared)

---

## Orders Module

### POST /orders _(auth required)_
**Body:** `{ "addressId": "uuid", "notes": "Leave at door" }`
**Response 201:**
```json
{
  "data": {
    "id": "uuid", "status": "pending", "paymentStatus": "pending",
    "items": [...], "subtotal": 200.00, "deliveryFee": 20.00, "total": 220.00,
    "placedAt": "2026-06-08T10:00:00Z"
  }
}
```
**Errors:** 400 (empty cart), 409 (insufficient stock)

### GET /orders/me _(auth required)_
**Query:** `page`, `limit`, `status`
**Response 200:** paginated order list

### GET /orders/me/:id _(auth required)_
**Response 200:** full order with items and status history
**Errors:** 404, 403 (not owner)

### POST /orders/:id/cancel _(auth required)_
**Response 200:** `{ "data": { "id": "...", "status": "cancelled" } }`
**Errors:** 400 (can't cancel after dispatch)

---

## Inventory Module (admin only)

### GET /inventory/:productId
**Response 200:** `{ "data": { "productId": "...", "quantity": 100, "reservedQuantity": 10, "available": 90 } }`

### PUT /inventory/:productId
**Body:** `{ "quantity": 150, "lowStockThreshold": 20 }`
**Response 200:** updated inventory

### POST /inventory/:productId/adjust
**Body:** `{ "change": -5, "reason": "damage" }`
**Response 200:** updated inventory

---

## Common Error Responses

```json
// 400 Bad Request
{ "success": false, "message": "Cart is empty" }

// 401 Unauthorized
{ "success": false, "message": "Invalid or expired token" }

// 403 Forbidden
{ "success": false, "message": "Insufficient permissions" }

// 404 Not Found
{ "success": false, "message": "Product not found" }

// 409 Conflict
{ "success": false, "message": "Email already exists" }

// 422 Validation Failed
{ "success": false, "message": "Validation failed", "errors": { "email": ["Invalid email format"] } }

// 429 Rate Limited
{ "success": false, "message": "Too many requests, please try again later." }

// 500 Internal Error
{ "success": false, "message": "Internal server error" }
```
