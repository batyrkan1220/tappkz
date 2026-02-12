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

### Admin (authenticated)
- `/admin` - Dashboard with analytics
- `/admin/products` - Product CRUD
- `/admin/categories` - Category CRUD
- `/admin/branding` - Logo, banner, colors
- `/admin/whatsapp` - Phone number + message template
- `/admin/settings` - Store info, contacts, display settings

### API
- `POST /api/stores` - Create store (validated)
- `GET /api/my-store` - Get current user's store
- `GET/POST/PATCH/DELETE /api/my-store/products` - Products CRUD (validated)
- `GET/POST/PATCH/DELETE /api/my-store/categories` - Categories CRUD (validated)
- `GET/PUT /api/my-store/theme` - Store theme/branding (validated)
- `GET/PUT /api/my-store/settings` - Store settings (validated)
- `PUT /api/my-store/whatsapp` - WhatsApp settings (validated)
- `GET /api/my-store/analytics` - Store analytics
- `GET /api/storefront/:slug` - Public store data
- `POST /api/storefront/:slug/event` - Track events (validated)
- `POST /api/upload` - Image upload (auth required)

## Database Tables
users, sessions, stores, store_themes, store_settings, categories, products, store_events

## Demo Store
Seed data creates a demo store at `/s/arai-beauty` (Arai Beauty cosmetics shop) with 8 products across 4 categories

## Plans
- Free: 30 products
- Pro: 300 products  
- Business: 2000 products

## Recent Changes
- Added Zod validation schemas on all API routes
- All CRUD endpoints validate request bodies before processing
- Event tracking validates event types (visit, add_to_cart, checkout_click)
