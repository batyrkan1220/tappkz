# TakeSale - WhatsApp Storefront Platform

## Overview
Multi-tenant SaaS platform for Kazakhstan SMBs to create branded mobile storefronts with WhatsApp order checkout. UI is in Russian (RU).

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter routing
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Auth**: Email/password with bcrypt + express-session (PostgreSQL session store)
- **File uploads**: Multer → local /uploads directory
- **Validation**: Zod schemas on all API endpoints

## Key Routes
### Public
- `/` - Landing page (logged out) / Admin dashboard (logged in)
- `/login` - Login page (email/password)
- `/register` - Registration page
- `/s/:slug` - Public storefront for a store
- `/invoice/:id` - Public invoice/order receipt page

### Admin (authenticated)
- `/admin` - Dashboard with analytics
- `/admin/products` - Product CRUD
- `/admin/categories` - Category CRUD
- `/admin/branding` - Logo, banner, colors
- `/admin/whatsapp` - Phone number + message template
- `/admin/kaspi` - Kaspi payment settings (toggle, pay URL, recipient name)
- `/admin/analytics` - Analytics with charts (Page views, Sales, Orders) and tab reports
- `/admin/orders` - Orders management with status/payment/fulfillment controls
- `/admin/customers` - Customer management (auto-created from orders, manual CRUD)
- `/admin/settings` - Store info, contacts, display settings

### Auth API
- `POST /api/auth/register` - Register (email, password, firstName?)
- `POST /api/auth/login` - Login (email, password)
- `POST /api/auth/logout` - Logout (destroys session)
- `GET /api/auth/user` - Get current user (auth required)

### API
- `POST /api/stores` - Create store (validated)
- `GET /api/my-store` - Get current user's store
- `GET/POST/PATCH/DELETE /api/my-store/products` - Products CRUD (validated)
- `GET/POST/PATCH/DELETE /api/my-store/categories` - Categories CRUD (validated)
- `GET/PUT /api/my-store/theme` - Store theme/branding (validated)
- `GET/PUT /api/my-store/settings` - Store settings (validated)
- `PUT /api/my-store/whatsapp` - WhatsApp settings (validated)
- `PUT /api/my-store/kaspi` - Kaspi payment settings (validated)
- `GET /api/my-store/analytics` - Store analytics
- `GET /api/storefront/:slug` - Public store data
- `GET /api/my-store/analytics/detailed` - Detailed analytics with daily data (auth)
- `GET /api/my-store/orders` - List all orders for store (auth)
- `PATCH /api/my-store/orders/:id` - Update order status/payment/fulfillment/note (auth)
- `GET/POST/PATCH/DELETE /api/my-store/customers` - Customers CRUD (auth)
- `POST /api/storefront/:slug/order` - Create order (validated)
- `GET /api/orders/:id` - Get order by ID (public)
- `POST /api/storefront/:slug/event` - Track events (validated)
- `POST /api/upload` - Image upload (auth required)

## Database Tables
users, sessions, stores, store_themes, store_settings, categories, products, orders, customers, store_events

## Demo Store
Seed data creates a demo store at `/s/arai-beauty` (Arai Beauty cosmetics shop) with 8 products across 4 categories

## Plans
- Free: 30 products
- Pro: 300 products  
- Business: 2000 products

## Business Types
- Store registration includes business type selection (26 types in 3 groups: F&B, E-commerce, Service)
- Business type determines UI terminology: "Товары"/"Меню"/"Услуги" in sidebar, products page, dashboard
- Defined in shared/schema.ts BUSINESS_TYPES constant with getBusinessLabels() helper
- useBusinessLabels() hook for frontend components

## Onboarding Flow
- Dashboard shows onboarding card when store has 0 categories or 0 products
- Step 1: Create category (required first)
- Step 2: Add products (unlocked after categories exist)
- Products page blocks adding items without categories, shows warning with link to categories page

## Super Admin Panel
- Accessible at /superadmin/* routes (only for users with isSuperAdmin=true)
- Dashboard: platform-wide analytics (stores, users, orders, revenue, products, customers)
- Stores page: view all stores with stats, change plans (free/pro/business), toggle active/inactive
- Users page: view all users, grant/revoke SuperAdmin role
- API routes: GET /api/superadmin/analytics, GET /api/superadmin/stores, PATCH /api/superadmin/stores/:id/plan, PATCH /api/superadmin/stores/:id/active, GET /api/superadmin/users, PATCH /api/superadmin/users/:id/superadmin
- isSuperAdmin field on users table, isSuperAdminMiddleware in server/auth.ts
- SuperAdmin link visible in merchant sidebar for admin users

## Recent Changes
- Added SuperAdmin panel with platform-wide analytics, store/user management
- Replaced Replit Auth (OIDC) with local email/password authentication (bcrypt + express-session)
- Added /login and /register pages with Russian UI
- Auth module: server/auth.ts (setupSession, registerAuthRoutes, isAuthenticated)
- Users table: added password_hash, is_super_admin columns
- Added business type selection to store registration (2-step flow: pick type → fill details)
- Dynamic admin terminology based on business type (sidebar, products page, dashboard, categories)
- Added onboarding guide to dashboard with step-by-step instructions
- Products page enforces category-first creation with warning card
- Removed demo page links from landing page, added mobile login button
- Added theme customization: secondary color, button/card/font styles, banner overlay
- Storefront uses merchant's own branding in nav instead of TakeSale logo
- Added analytics page at /admin/analytics: line charts for page views/sales/orders
- Added admin customers page at /admin/customers
- Added admin orders page at /admin/orders
- Added order/invoice system with WhatsApp integration
- Added Kaspi payment integration
- Added Zod validation schemas on all API routes
