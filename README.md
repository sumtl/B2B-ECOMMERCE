# B2B Commerce - Professional Procurement Platform

**🚀 Live Demo:** [b2-b-ecommerce-five.vercel.app](https://b2-b-ecommerce-five.vercel.app)

A modern B2B e-commerce platform built for efficient business procurement. Buyers can browse products, manage saved lists, and place orders. Admins have full control over inventory, analytics, and order management.

## Project Overview

**B2B Commerce** is a full-stack web application designed for wholesale and B2B procurement. It features:

- **Product Catalog** - Browse products by category with detailed information
- **Saved Lists** - Save frequently ordered items for quick reordering
- **Shopping Cart & Checkout** - Complete order management with payment processing
- **Admin Dashboard** - Product, category, and inventory management
- **Inventory Alerts** - Real-time low stock notifications and restock management
- **Customer Analytics** - Track top customers and popular products
- **PO Support** - Custom purchase order numbers for B2B workflows

## Technologies Used

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **Frontend**       | React with TypeScript (implemented with Next.js 16 — App Router) |
| **Styling**        | Tailwind CSS                                                     |
| **Backend**        | Next.js API Routes (Node.js)                                     |
| **ORM**            | Prisma                                                           |
| **Database**       | PostgreSQL (Neon)                                                |
| **Authentication** | Clerk                                                            |
| **Payments**       | Stripe                                                           |
| **Deployment**     | Vercel                                                           |

### Development Tools
- npm / yarn
- Git
### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Neon cloud account)
- Clerk account for authentication
- Stripe account for payment processing
- npm or yarn installed

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd b2b-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your settings (see [Environment Configuration](#environment-configuration) section).

4. **Setup database**
   ```bash
   npm run prisma:migrate
   npm run seed  # Seed initial product data
   npm run seed:orders  # Seed test orders
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:3000`

### Production Build
```bash
npm run build
npm run start
```

### Deployment

This application is deployed on **Vercel**:

**Live Demo URL:** [https://b2-b-ecommerce-five.vercel.app](https://b2-b-ecommerce-five.vercel.app)

**Deploy to Vercel:**
1. Push code to GitHub repository
2. Connect repository to Vercel (vercel.com)
3. Set environment variables in Vercel dashboard
4. Click Deploy
5. Vercel automatically builds and deploys on every push to main branch

**Environment Variables Required on Vercel:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Clerk webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_APP_URL` - Set to `https://b2-b-ecommerce-five.vercel.app`

### Database & Prisma Commands
```bash
# Run migrations
npm run prisma:migrate

# Open Prisma Studio (visual database editor)
npm run prisma:studio

# Seed database with sample data
npm run seed

# Generate additional test orders
npm run seed:orders

# Regenerate Prisma client
npm run prisma:generate
```

### Linting
```bash
npm run lint
```

## Project Structure

```
b2b-ecommerce/
├── app/
│   ├── api/                      # API routes
│   │   ├── admin/
│   │   │   └── stats/route.ts    # GET /api/admin/stats
│   │   ├── auth/
│   │   │   ├── me/route.ts       # GET /api/auth/me
│   │   │   └── profile/route.ts  # PUT /api/auth/profile
│   │   ├── categories/
│   │   │   ├── route.ts          # GET/POST /api/categories
│   │   │   └── [id]/route.ts     # GET/PUT/DELETE /api/categories/[id]
│   │   ├── cart/
│   │   │   ├── route.ts          # GET/POST /api/cart
│   │   │   └── items/route.ts    # POST/PUT/DELETE /api/cart/items
│   │   ├── checkout/
│   │   │   └── session/route.ts  # POST /api/checkout/session
│   │   ├── orders/
│   │   │   ├── route.ts          # GET/POST /api/orders
│   │   │   ├── [id]/route.ts     # GET/DELETE /api/orders/[id]
│   │   │   └── [id]/payment-status/route.ts  # GET payment status
│   │   ├── products/
│   │   │   ├── route.ts          # GET/POST /api/products
│   │   │   ├── [id]/route.ts     # GET/PUT/DELETE /api/products/[id]
│   │   │   └── upload/route.ts   # POST /api/products/upload
│   │   ├── saved-lists/
│   │   │   ├── route.ts          # GET/POST /api/saved-lists
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET/PUT/DELETE /api/saved-lists/[id]
│   │   │       ├── items/route.ts          # POST/DELETE items
│   │   │       └── order/route.ts          # POST convert to order
│   │   └── webhooks/
│   │       ├── clerk/route.ts    # POST webhook for user sync
│   │       └── stripe/route.ts   # POST webhook for payments
│   ├── admin/                    # Admin-only pages
│   │   ├── page.tsx              # Dashboard with quick access
│   │   ├── products/
│   │   │   ├── create/page.tsx   # Create new product
│   │   │   ├── [id]/edit/page.tsx # Edit product with inventory
│   │   │   └── page.tsx          # Products list
│   │   ├── categories/
│   │   │   ├── create/page.tsx   # Create category
│   │   │   ├── [id]/edit/page.tsx # Edit category
│   │   │   └── page.tsx          # Categories grid
│   │   ├── reports/
│   │   │   └── page.tsx          # Analytics dashboard with KPI
│   │   └── orders/               # Order management (if available)
│   ├── products/                 # Public product pages
│   │   ├── [id]/page.tsx         # Product details
│   │   └── page.tsx              # Product catalog with filters
│   ├── cart/
│   │   └── page.tsx              # Shopping cart view
│   ├── checkout/
│   │   ├── page.tsx              # Checkout process
│   │   └── success/page.tsx      # Payment success
│   ├── orders/
│   │   ├── [id]/page.tsx         # Order details
│   │   └── page.tsx              # Order history
│   ├── saved-lists/
│   │   ├── [id]/page.tsx         # View/edit list
│   │   └── page.tsx              # Manage all lists
│   ├── layout.tsx                # Root layout
│   ├── navbar.tsx                # Navigation
│   ├── providers.tsx             # Context providers
│   ├── globals.css               # Global styles
│   ├── page.tsx                  # Home page
│   └── ui-styles.ts              # Centralized styles
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── button/
│   │   ├── card/
│   │   ├── input/
│   │   └── ...
│   └── providers/                # Context providers
├── lib/                          # Utilities
│   ├── auth.ts
│   ├── db.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Initial data
│   └── seed-orders.ts            # Test orders
├── public/
│   └── images/
├── .env.example                  # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── middleware.ts                 # Auth redirects
├── README.md                     # This file
├── API.md                        # API documentation
└── .gitignore
```

## Key Features

### For Buyers
- Browse product catalog by category
- Search and filter products (by name, SKU, or description)
- View detailed product information with pricing and inventory
- Add items to shopping cart
- Create and manage saved product lists
- Quick reordering from saved lists
- Add custom PO (Purchase Order) numbers during checkout
- Secure Stripe payment processing
- View complete order history and tracking
- Manage user profile

### For Admins
- **Product Management**
  - Create, edit, delete products
  - Manage pricing and descriptions
  - Upload product images
  - Track current stock quantity
  - Set low stock thresholds
  
- **Category Management**
  - Create, organize, delete categories
  - Assign products to categories
  
- **Reports & Analytics**
  - Real-time inventory alerts for low stock products
  - One-click restock functionality
  - Professional KPI sidebar dashboard with color-coded alerts (amber warning, red critical)
  - Comprehensive order statistics and status visualization
  - Top customers ranking by volume and popular products analysis
  
- **Admin Dashboard**
  - Quick access management cards
  - Key performance metrics
  - Centralized control panel

## API Endpoints

See [API.md](./API.md) for **complete API documentation** with request/response examples, error codes, and detailed descriptions.

### API Test Requests

You can run the included HTTP request collection for quick testing in VS Code (REST Client) or other HTTP clients.

- **Local REST client file:** [test.rest](./test.rest)

### Authentication
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - List all products (search, filter, paginate)
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/[id]` - Update product (admin only)
- `DELETE /api/products/[id]` - Delete product (admin only)
- `POST /api/products/upload` - Upload product image (admin only)

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/[id]` - Get category details
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/[id]` - Update category (admin only)
- `DELETE /api/categories/[id]` - Delete category (admin only)

### Cart
- `GET /api/cart` - Get shopping cart (protected)
- `POST /api/cart` - Bulk import cart items (protected)
- `POST /api/cart/items` - Add/update cart item (protected)
- `PUT /api/cart/items` - Update item quantity (protected)
- `DELETE /api/cart/items` - Remove item from cart (protected)

### Orders
- `GET /api/orders` - List user's orders (protected)
- `GET /api/orders/[id]` - Get order details (protected)
- `POST /api/orders` - Create order from cart (protected)
- `DELETE /api/orders/[id]` - Cancel order (protected)

### Checkout & Payment
- `POST /api/checkout/session` - Create Stripe checkout session (protected)
- `GET /api/orders/[id]/payment-status` - Check payment status from Stripe (protected)

### Saved Lists
- `GET /api/saved-lists` - List saved lists (protected)
- `GET /api/saved-lists/[id]` - Get saved list details (protected)
- `POST /api/saved-lists` - Create saved list (protected)
- `PUT /api/saved-lists/[id]` - Update saved list (protected)
- `DELETE /api/saved-lists/[id]` - Delete saved list (protected)
- `POST /api/saved-lists/[id]/items` - Add item to list (protected)
- `DELETE /api/saved-lists/[id]/items/[itemId]` - Remove item from list (protected)
- `POST /api/saved-lists/[id]/order` - Create order from saved list (protected)

### Admin
- `GET /api/admin/stats` - Get analytics and reports (admin only)

### Webhooks
- `POST /api/webhooks/clerk` - Clerk user sync webhook
- `POST /api/webhooks/stripe` - Stripe payment webhook

## Environment Configuration

Copy `.env.example` to `.env.local` and update with your credentials:

```bash
cp .env.example .env.local
```

**Required Variables:**

| Variable                             | Description                       | Example                                                   |
| ------------------------------------ | --------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                       | PostgreSQL connection string      | `postgresql://user:password@localhost:5432/b2b_ecommerce` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Clerk public key                  | `pk_test_...`                                             |
| `CLERK_SECRET_KEY`                   | Clerk secret key                  | `sk_test_...`                                             |
| `CLERK_WEBHOOK_SECRET`               | Clerk webhook signing secret      | `whsec_...`                                               |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key                 | `pk_test_...`                                             |
| `STRIPE_SECRET_KEY`                  | Stripe secret key                 | `sk_test_...`                                             |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret     | `whsec_...`                                               |
| `STRIPE_MODE`                        | Payment mode (test or production) | `test`                                                    |
| `NEXT_PUBLIC_APP_URL`                | Application URL                   | `http://localhost:3000`                                   |

### Webhook Configuration

**Clerk Webhooks** (https://dashboard.clerk.com → Webhooks):
- Endpoint: `http://YOUR_APP_URL/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Copy signing secret to `CLERK_WEBHOOK_SECRET`

**Stripe Webhooks** (https://dashboard.stripe.com → Webhooks):
- Endpoint: `http://YOUR_APP_URL/api/webhooks/stripe`
- Events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Test Accounts

### Admin Account
- **Email**: admin+clerk_test@example.com
- **Password**: [Provided by su]
- **Code**: 424242
- **Access**: 
  - Product Management
  - Category Management
  - Reports & Analytics
  - System Settings (coming soon)

### Buyer Account
- **Email**: jone+clerk_test@example.com
- **Password**: [Provided by su]
- **Code**: 424242
- **Access**: 
  - Product browsing and search
  - Shopping cart
  - Saved lists and reordering
  - Order history
  - Profile management


## PO (Purchase Order) Numbers

Buyers can add custom PO numbers during checkout.

