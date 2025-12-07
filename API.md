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
- `GET /api/orders/[id]` - **Protected** (fetch order details)
- `POST /api/orders` - **Protected** (create from cart)
- `DELETE /api/orders/[id]` - **Protected** (cancel order)

## Checkout & Payment
- `POST /api/checkout/session` - **Protected** (create Stripe Checkout Session)
- `GET /api/orders/[id]/payment-status` - **Protected** (check payment status from Stripe)

## Saved Lists
- `GET /api/saved-lists` - **Protected**
- `GET /api/saved-lists/[id]` - **Protected**
- `POST /api/saved-lists` - **Protected** (create list)
- `PUT /api/saved-lists/[id]` - **Protected** (update list)
- `DELETE /api/saved-lists/[id]` - **Protected** (delete list)
- `POST /api/saved-lists/[id]/items` - **Protected** (add item to list)
- `DELETE /api/saved-lists/[id]/items/[itemId]` - **Protected** (remove item from list)
- `POST /api/saved-lists/[id]/order` - **Protected** (convert list to order)

## Admin
- `GET /api/admin/stats` - **Admin only**

## Webhooks
- `POST /api/webhooks/clerk` - Webhook (Clerk signature verification, handles user.created, user.updated, user.deleted)
- `POST /api/webhooks/stripe` - Webhook (Stripe signature verification, handles checkout.session.completed, checkout.session.expired, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed)

## Legend
- **Public** - No authentication required
- **Protected** - Authentication required (any user)
- **Admin only** - Authentication + admin role required
