# TakeSale - WhatsApp Storefront Platform

## Overview
Multi-tenant SaaS platform for Kazakhstan SMBs to create branded mobile storefronts with WhatsApp order checkout. UI is in Russian (RU).

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter routing
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Auth**: Replit Auth (OpenID Connect)
- **File uploads**: Multer → local /uploads directory
- **Validation**: Zod schemas on all API endpoints

## Key Routes
### Public
- `/` - Landing page (logged out) / Admin dashboard (logged in)
- `/s/:slug` - Public storefront for a store
- `/invoice/:id` - Public invoice/order receipt page

### Admin (authenticated)
- `/admin` - Dashboard with analytics
- `/admin/products` - Product CRUD
- `/admin/categories` - Category CRUD
- `/admin/branding` - Logo, banner, colors
- `/admin/whatsapp` - Phone number + message template
- `/admin/kaspi` - Kaspi payment settings (toggle, pay URL, recipient name)
- `/admin/orders` - Orders management with status/payment/fulfillment controls
- `/admin/customers` - Customer management (auto-created from orders, manual CRUD)
- `/admin/settings` - Store info, contacts, display settings

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

## Recent Changes
- Added admin customers page at /admin/customers: table with search, filter tabs (Все/Неактивно/Первый заказ/Никогда не заказывал), add/edit/delete customers, auto-created from orders
- Added admin orders page at /admin/orders: table with search, filter tabs (Все/Неоплаченный/Подтверждение/Оплачено), inline status/payment/fulfillment dropdowns, order detail panel with internal notes
- Added order/invoice system: orders saved to DB on checkout, WhatsApp message includes "See invoice" link
- Invoice page at /invoice/:id shows order number, items, totals, customer info, payment method
- Storefront redesigned to take.app style: banner + circular avatar, tabs (Обзор/Поиск), horizontal product cards, bottom cart bar
- Added Kaspi payment integration (toggle, pay URL, recipient name in store_settings)
- Kaspi pay button shown on storefront checkout when enabled
- Added Zod validation schemas on all API routes
