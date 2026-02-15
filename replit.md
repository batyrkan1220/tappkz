# Tapp (tapp.kz) - WhatsApp Storefront Platform

## Overview
Multi-tenant SaaS platform for global SMBs to create branded mobile storefronts with WhatsApp order checkout. UI is in Russian (RU). Rebranded from TakeSale to Tapp.

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
- `/:slug` - Public storefront for a store (e.g. tapp.kz/mystore)
- `/invoice/:id` - Public invoice/order receipt page

### Admin (authenticated)
- `/admin` - Dashboard with analytics
- `/admin/products` - Product CRUD
- `/admin/categories` - Category CRUD
- `/admin/branding` - Logo, banner, colors
- `/admin/whatsapp` - Phone number + message template
- `/admin/analytics` - Analytics with charts (Page views, Sales, Orders) and tab reports
- `/admin/orders` - Orders management with status/payment/fulfillment controls
- `/admin/customers` - Customer management (auto-created from orders, manual CRUD)
- `/admin/subscription` - Subscription/plan management with comparison
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
- `GET /api/my-store/analytics` - Store analytics
- `GET /api/tariffs` - Public tariff/plan data (reads from platform_settings with constant fallbacks)
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
users, sessions, stores, store_themes, store_settings, categories, products, orders, customers, store_events, platform_settings

## Demo Store
Demo store arai-beauty is automatically deleted on startup via seed.ts

## Product Attributes System
Products have `sku` (varchar), `unit` (varchar), and `attributes` (JSONB) columns for business-type-specific data.
- **FnB fields**: portionSize, calories, cookingTime, ingredients, allergens, isSpicy, isVegetarian, isHalal
- **Ecommerce fields**: brand, weight, material, sizes, colors, dimensions, warrantyMonths; pharmacy: dosage, activeIngredient, prescriptionRequired; digital: fileFormat, deliveryMethod; B2B: minOrderQty, wholesalePrice
- **Service fields**: durationMinutes, priceType, serviceLocation, bookingRequired; education: format, lessonsCount, certificate; travel/ticketing: location, daysCount, maxParticipants; hotel: maxGuests; rental: depositAmount, rentalPeriod
- Unit options vary by business group (fnb/ecommerce/service)
- Product form shows collapsible type-specific section
- Storefront product detail shows attribute badges

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
- Dashboard: platform-wide analytics with trend charts (orders, revenue, stores, users over time), period selector (7d/30d/90d)
- Stores page: view all stores with stats, search by name/slug/owner/city, change plans, toggle active/inactive
- Store detail page: /superadmin/stores/:id - full store overview with info, design, top products, tabs for orders/customers/products
- Orders page: view ALL platform orders with search by name/phone/number, filter by status/payment
- Users page: view all users, grant/revoke SuperAdmin role
- Events page: platform-wide activity log with event type filter (visits, cart, checkout)
- API routes: GET /api/superadmin/analytics, GET /api/superadmin/trends, GET /api/superadmin/stores, GET /api/superadmin/stores/:id, GET /api/superadmin/orders, GET /api/superadmin/events, PATCH /api/superadmin/stores/:id/plan, PATCH /api/superadmin/stores/:id/active, GET /api/superadmin/users, PATCH /api/superadmin/users/:id/superadmin
- isSuperAdmin field on users table, isSuperAdminMiddleware in server/auth.ts
- SuperAdmin link visible in merchant sidebar for admin users
- Super Admin login redirects to /superadmin, regular users to /

## Recent Changes
- Storefront redesign (take.app style): centered logo header, hamburger sidebar with search/categories, 2-column product grid, primary-color cart bar
- Sidebar: no logo, search bar, business-type category label, expandable categories list
- Tab "Обзор" renamed to business-type label (Товары/Меню/Услуги)
- Checkout fields: by default only Name + Phone; Address and Comment are optional, controlled via admin settings (checkoutAddressEnabled, checkoutCommentEnabled in store_settings table)
- Enhanced SuperAdmin panel with trend charts, orders page, store detail view, events log, search/filters
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
- Removed Kaspi payment integration (temporarily disabled, DB schema preserved)
- Added Zod validation schemas on all API routes
- Unified color scheme: primary blue across all admin pages, landing page updated with full feature set
- Plan/tariff management: planStartedAt, planExpiresAt fields in stores table, PLAN_PRICES/PLAN_NAMES constants
- Super Admin stores page: color-coded active/inactive badges (green/red), plan stripe colors (zinc/blue/purple), MRR summary cards with color dots, improved visual hierarchy
- Super Admin tariffs page (/superadmin/tariffs): edit plan prices, limits, features; comparison table; stored in platform_settings table
- API routes: GET /api/superadmin/tariffs, PUT /api/superadmin/tariffs/:plan
- Database: platform_settings table (key/value jsonb) for configurable platform settings
- Super Admin store detail: dedicated plan/subscription card with dates, pricing, usage stats
- Merchant admin settings: enhanced plan card with limits, start/expiry dates, pricing info
- API auto-sets plan dates when changing plans (start=now, expires=+30d for paid plans, clears for free)
- 360dialog WhatsApp Business API integration (server/whatsapp.ts): order notifications to store owners, broadcast/newsletter to customers
- SuperAdmin WhatsApp page (/superadmin/whatsapp): WABA config (API key, sender phone), test messaging, broadcast to all/store customers, message history with stats
- whatsapp_messages table: logs all sent/failed messages with status, wamid, error tracking
- API routes: GET/PUT /api/superadmin/waba/config, GET /api/superadmin/waba/messages, POST /api/superadmin/waba/broadcast, POST /api/superadmin/waba/test
- WABA config stored in platform_settings (key: waba_config), API key redacted in responses
- Order creation auto-triggers WhatsApp notification to store owner (non-blocking)
- WhatsApp onboarding system: welcome message on registration (if phone provided), store-created tips, delayed educational tips series
- Users table: phone field for WhatsApp contact
- Registration form: optional WhatsApp phone field with description
- Onboarding config stored in platform_settings (key: onboarding_messages), editable via SuperAdmin
- API routes: GET/PUT /api/superadmin/waba/onboarding
- SuperAdmin WhatsApp page: new "Онбординг" tab with welcome/store-created/tips message editors
- Performance optimizations: React.lazy() code splitting for all pages, gzip compression middleware, DB indexes on key columns (stores.ownerUserId/slug, products/categories/orders/customers.storeId), image lazy loading on storefront, Cache-Control headers for uploads (1yr immutable) and storefront API (30s + stale-while-revalidate)
