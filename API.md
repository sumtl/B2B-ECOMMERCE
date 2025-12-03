# API Reference

All available API endpoints.

## Authentication
- `GET /api/auth/me` - **Protected**
- `PUT /api/auth/profile` - **Protected**

## Products
- `GET /api/products` - Public (search, filter, browse by page)
- `GET /api/products/[id]` - Public
- `POST /api/products` - **Admin only**
- `PUT /api/products/[id]` - **Admin only**
- `DELETE /api/products/[id]` - **Admin only**
- `POST /api/products/upload` - **Admin only** (image upload)

## Categories
- `GET /api/categories` - Public
- `GET /api/categories/[id]` - Public
- `POST /api/categories` - **Admin only**
- `PUT /api/categories/[id]` - **Admin only**
- `DELETE /api/categories/[id]` - **Admin only**

## Cart
- `GET /api/cart` - **Protected**
- `POST /api/cart` - **Protected** (bulk import CSV)
- `POST /api/cart/items` - **Protected** (add/update item)
- `PUT /api/cart/items` - **Protected** (update quantity)
- `DELETE /api/cart/items` - **Protected** (remove item)

## Orders
- `GET /api/orders` - **Protected**
- `POST /api/orders` - **Protected** (create from cart)
- `POST /api/orders/[id]/pay` - **Protected** (mark as paid)
- `DELETE /api/orders/[id]` - **Protected** (cancel order)

## Saved Lists
- `GET /api/saved-lists` - **Protected**
- `GET /api/saved-lists/[id]` - **Protected**
- `POST /api/saved-lists` - **Protected** (create)
- `PUT /api/saved-lists/[id]` - **Protected** (update)
- `DELETE /api/saved-lists/[id]` - **Protected**
- `POST /api/saved-lists/[id]/order` - **Protected** (convert to order)

## Admin
- `GET /api/admin/stats` - **Admin only**

## Webhooks
- `POST /api/webhooks/clerk` - Webhook (Clerk signature verification)

## Legend
- **Public** - No authentication required
- **Protected** - Authentication required (any user)
- **Admin only** - Authentication + admin role required
