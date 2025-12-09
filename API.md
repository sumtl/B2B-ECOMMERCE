# API Reference

Complete API documentation with examples and error codes.

## Base URL
```
http://localhost:3000/api
```

## Authentication

- **Public** - No authentication required
- **Protected** - Clerk authentication required (JWT in Authorization header or cookie)
- **Admin only** - Authentication + admin role required

## Response Codes

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| 200  | OK - Request successful                   |
| 201  | Created - Resource created successfully   |
| 204  | No Content - Successful deletion          |
| 400  | Bad Request - Invalid input               |
| 401  | Unauthorized - Missing/invalid auth       |
| 403  | Forbidden - Not admin                     |
| 404  | Not Found - Resource not found            |
| 409  | Conflict - Duplicate/constraint violation |
| 500  | Server Error                              |

---

## Authentication Endpoints

### GET /api/auth/me
Get current user info.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "BUYER",
    "createdAt": "2025-12-06T10:00:00Z"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### PUT /api/auth/profile
Update user profile.

**Authentication**: Protected

**Request**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (200 OK)**:
```json
{
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "BUYER"
  }
}
```

---

## Products Endpoints

### GET /api/products
List all products.

**Authentication**: Public

**Query**: `?page=1&limit=10&search=laptop&categoryId=cat_123`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "sku": "SKU-001",
      "name": "Digital Multimeter",
      "priceCents": 4999,
      "currentStock": 150,
      "lowThreshold": 10
    }
  ],
  "pagination": {
    "page": 1,
    "total": 45,
    "totalPages": 5
  }
}
```

### GET /api/products/[id]
Get product details.

**Authentication**: Public

**Response (200 OK)**:
```json
{
  "id": "prod_123",
  "sku": "SKU-001",
  "name": "Digital Multimeter",
  "description": "Professional digital multimeter",
  "priceCents": 4999,
  "currentStock": 150,
  "lowThreshold": 10,
  "category": {
    "id": "cat_456",
    "name": "Electronics"
  }
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Not Found",
  "message": "Product not found"
}
```

### POST /api/products
Create product.

**Authentication**: Admin only

**Request**:
```json
{
  "name": "New Product",
  "sku": "SKU-NEW-001",
  "priceCents": 2999,
  "categoryId": "cat_123",
  "initialStock": 100
}
```

**Response (201 Created)**:
```json
{
  "id": "prod_789",
  "name": "New Product",
  "sku": "SKU-NEW-001",
  "priceCents": 2999,
  "currentStock": 100
}
```

**Response (403 Forbidden)**:
```json
{
  "error": "Forbidden",
  "message": "Only admin users can create products"
}
```

### PUT /api/products/[id]
Update product (including inventory).

**Authentication**: Admin only

**Request**:
```json
{
  "name": "Updated Product",
  "currentStock": 50
}
```

**Response (200 OK)**:
```json
{
  "id": "prod_123",
  "name": "Updated Product",
  "currentStock": 50
}
```

### DELETE /api/products/[id]
Delete product.

**Authentication**: Admin only

**Response (204 No Content)**:
```
(empty response body)
```

### POST /api/products/upload
Upload product image.

**Authentication**: Admin only

**Response (200 OK)**:
```json
{
  "url": "https://storage.example.com/products/image_abc123.jpg",
  "fileName": "image_abc123.jpg"
}
```

---

## Categories Endpoints

### GET /api/categories
List all categories.

**Authentication**: Public

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_123",
      "name": "Electronics",
      "slug": "electronics",
      "icon": "⚡"
    }
  ]
}
```

### GET /api/categories/[id]
Get category with products.

**Authentication**: Public

**Response (200 OK)**:
```json
{
  "id": "cat_123",
  "name": "Electronics",
  "slug": "electronics",
  "productCount": 5
}
```

### POST /api/categories
Create category.

**Authentication**: Admin only

**Request**:
```json
{
  "name": "Power Tools",
  "icon": "⚙️"
}
```

**Response (201 Created)**:
```json
{
  "id": "cat_789",
  "name": "Power Tools",
  "slug": "power-tools",
  "icon": "⚙️"
}
```

### PUT /api/categories/[id]
Update category.

**Authentication**: Admin only

**Request**:
```json
{
  "name": "Updated Category",
  "icon": "✨"
}
```

**Response (200 OK)**:
```json
{
  "id": "cat_123",
  "name": "Updated Category",
  "icon": "✨"
}
```

### DELETE /api/categories/[id]
Delete category.

**Authentication**: Admin only

**Response (204 No Content)**:
```
(empty response body)
```

---

## Cart Endpoints

### GET /api/cart
Get shopping cart.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_123",
        "productId": "prod_456",
        "product": {
          "name": "Product Name",
          "priceCents": 2999
        },
        "quantity": 5,
        "subtotalCents": 14995
      }
    ],
    "totalCents": 14995,
    "itemCount": 1
  }
}
```

### POST /api/cart/items
Add/update cart item.

**Authentication**: Protected

**Request**:
```json
{
  "productId": "prod_456",
  "quantity": 5
}
```

**Response (201 Created)**:
```json
{
  "id": "item_123",
  "productId": "prod_456",
  "quantity": 5,
  "message": "Item added to cart"
}
```

### PUT /api/cart/items
Update item quantity.

**Authentication**: Protected

**Request**:
```json
{
  "itemId": "item_123",
  "quantity": 10
}
```

**Response (200 OK)**:
```json
{
  "message": "Cart updated successfully"
}
```

### DELETE /api/cart/items
Remove item from cart.

**Authentication**: Protected

**Query**: `?itemId=item_123`

**Response (200 OK)**:
```json
{
  "message": "Item removed from cart"
}
```

---

## Orders Endpoints

### GET /api/orders
List user's orders.

**Authentication**: Protected

**Query**: `?page=1&limit=10`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "order_123",
      "orderNumber": "ORD-2025-001",
      "status": "PAID",
      "totalCents": 14995,
      "poNumber": "PO-2025-12345",
      "createdAt": "2025-12-07T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 5
  }
}
```

### GET /api/orders/[id]
Get order details.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "id": "order_123",
  "orderNumber": "ORD-2025-001",
  "status": "PAID",
  "totalCents": 14995,
  "poNumber": "PO-2025-12345",
  "items": [
    {
      "productName": "Product Name",
      "quantity": 5,
      "priceCents": 2999
    }
  ]
}
```

### POST /api/orders
Create order from cart.

**Authentication**: Protected

**Request**:
```json
{
  "poNumber": "PO-2025-12345"
}
```

**Response (201 Created)**:
```json
{
  "id": "order_123",
  "orderNumber": "ORD-2025-001",
  "status": "CREATED",
  "totalCents": 14995,
  "poNumber": "PO-2025-12345"
}
```

### DELETE /api/orders/[id]
Cancel order.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "message": "Order cancelled successfully",
  "id": "order_123"
}
```

---

## Checkout Endpoints

### POST /api/checkout/session
Create Stripe checkout session.

**Authentication**: Protected

**Request**:
```json
{
  "cartItems": [
    {"productId": "prod_456", "quantity": 5}
  ],
  "poNumber": "PO-2025-12345"
}
```

**Response (200 OK)**:
```json
{
  "sessionId": "cs_test_123abc",
  "url": "https://checkout.stripe.com/pay/cs_test_123abc"
}
```

### GET /api/orders/[id]/payment-status
Check payment status.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "status": "PAID",
  "message": "Payment successful",
  "totalCents": 14995
}
```

---

## Saved Lists Endpoints

### GET /api/saved-lists
Get all saved lists.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "list_123",
      "name": "Monthly Supplies",
      "itemCount": 5,
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

### GET /api/saved-lists/[id]
Get saved list with items.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "id": "list_123",
  "name": "Monthly Supplies",
  "items": [
    {
      "productId": "prod_789",
      "product": {
        "name": "Product Name",
        "priceCents": 2999
      },
      "quantity": 10
    }
  ]
}
```

### POST /api/saved-lists
Create saved list.

**Authentication**: Protected

**Request**:
```json
{
  "name": "Monthly Supplies",
  "description": "Regular monthly inventory"
}
```

**Response (201 Created)**:
```json
{
  "id": "list_123",
  "name": "Monthly Supplies",
  "message": "List created successfully"
}
```

### PUT /api/saved-lists/[id]
Update saved list.

**Authentication**: Protected

**Request**:
```json
{
  "name": "Updated List Name"
}
```

**Response (200 OK)**:
```json
{
  "message": "List updated successfully"
}
```

### DELETE /api/saved-lists/[id]
Delete saved list.

**Authentication**: Protected

**Response (204 No Content)**:
```
(empty response body)
```

### POST /api/saved-lists/[id]/items
Add item to list.

**Authentication**: Protected

**Request**:
```json
{
  "productId": "prod_789",
  "quantity": 10
}
```

**Response (201 Created)**:
```json
{
  "id": "item_456",
  "productId": "prod_789",
  "quantity": 10,
  "message": "Item added to list"
}
```

### DELETE /api/saved-lists/[id]/items/[itemId]
Remove item from list.

**Authentication**: Protected

**Response (200 OK)**:
```json
{
  "message": "Item removed from list"
}
```

### POST /api/saved-lists/[id]/order
Create order from saved list.

**Authentication**: Protected

**Request**:
```json
{
  "poNumber": "PO-2025-12345"
}
```

**Response (201 Created)**:
```json
{
  "orderId": "order_789",
  "orderNumber": "ORD-2025-001",
  "totalCents": 29990,
  "message": "Order created from saved list"
}
```

---

## Admin Endpoints

### GET /api/admin/stats
Get analytics and reports.

**Authentication**: Admin only

**Response (200 OK)**:
```json
{
  "lowStockProducts": [
    {
      "id": "prod_123",
      "name": "Low Stock Product",
      "currentStock": 3,
      "lowThreshold": 10,
      "sku": "SKU-001"
    }
  ],
  "orderStats": {
    "CREATED": 5,
    "PAID": 15,
    "SHIPPED": 8,
    "DELIVERED": 32,
    "CANCELLED": 2,
    "TOTAL": 62
  },
  "topCustomers": [
    {
      "userId": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "paidOrders": 5
    }
  ],
  "popularProducts": [
    {
      "id": "prod_456",
      "name": "Best Seller",
      "sku": "SKU-002",
      "totalQuantityOrdered": 150
    }
  ]
}
```

**Response (403 Forbidden)**:
```json
{
  "error": "Forbidden",
  "message": "Only admin users can access statistics"
}
```

---

## Webhooks

### POST /api/webhooks/clerk
Clerk user sync webhook.

**Events**: `user.created`, `user.updated`, `user.deleted`

**Response (202 Accepted)**:
```json
{
  "message": "Webhook processed"
}
```

### POST /api/webhooks/stripe
Stripe payment webhook.

**Events**: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`

**Response (200 OK)**:
```json
{
  "received": true
}
```
