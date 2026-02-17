# Tapp (tapp.kz) - WhatsApp Storefront Platform

## Overview
Tapp is a multi-tenant SaaS platform designed for Small and Medium Businesses (SMBs) globally. It enables businesses to quickly create branded mobile storefronts, facilitating product display and order placement directly through WhatsApp. The platform is localized for Russian-speaking users (UI in Russian). The primary goal is to provide a streamlined e-commerce solution leveraging the widespread use of WhatsApp for order communication and management.

## User Preferences
I prefer clear and concise communication. When making changes, prioritize iterative development and ask for confirmation before implementing major architectural shifts or significant feature additions. Ensure all UI elements are in Russian.

## System Architecture
The platform follows a modern web application architecture:
- **Frontend**: Built with React, Vite, Tailwind CSS, shadcn/ui for UI components, and wouter for routing. The storefront design is inspired by `take.app` with a centered logo header, a hamburger sidebar featuring search and categories, a 2-column product grid, and a prominent primary-color cart bar. Dynamic terminology (e.g., "Товары", "Меню", "Услуги") based on business type is applied across the UI.
- **Backend**: Utilizes Express.js as the server framework, Drizzle ORM for database interaction, and PostgreSQL for data storage.
- **Authentication**: Custom email/password authentication using bcrypt for hashing and `express-session` with a PostgreSQL session store.
- **File Uploads**: Implemented via Multer, storing files locally in the `/uploads` directory.
- **Data Validation**: Comprehensive Zod schemas are applied to all API endpoints to ensure data integrity.
- **Product Management**: Products support a flexible attribute system using JSONB columns for business-type-specific data (e.g., F&B, E-commerce, Service). This allows for dynamic product forms and storefront displays. A product variants system enables managing multiple options (size, color) with custom pricing and images.
- **Business Type Customization**: Stores select a business type during registration (26 types across 3 groups), which dynamically adjusts UI terminology and available attributes.
- **Onboarding**: A guided onboarding flow assists new merchants in setting up their store, emphasizing category and product creation.
- **Super Admin Panel**: A dedicated interface for platform administrators to manage stores, users, orders, and platform-wide analytics. It includes tools for plan management, user role assignment, and event logging.
- **Discount System**: Supports six types of discounts (code, order_amount, automatic, bundle, buy_x_get_y, free_delivery) with comprehensive administration and storefront application.
- **Theme Customization**: Merchants can customize their storefront's secondary color, button/card/font styles, and banner overlay.
- **Analytics**: Admin panels include dashboards with charts for page views, sales, and orders.
- **Order Management**: Comprehensive order lifecycle management, including status, payment, and fulfillment controls.
- **Customer Management**: Automatic customer creation from orders with manual CRUD capabilities.
- **Delivery System**: Supports two methods: pickup and own courier, with configurable settings for address, fees, and free delivery thresholds.
- **SEO**: Implements base meta tags, dynamic server-side meta injection for storefronts, client-side title management, and generates `robots.txt` and `sitemap.xml`.
- **Performance**: Optimizations include React.lazy() for code splitting, gzip compression, database indexing, image lazy loading, and intelligent caching strategies.

## External Dependencies
- **PostgreSQL**: Primary database for all application data and session storage.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Component library for UI elements.
- **Vite**: Frontend build tool.
- **Express.js**: Backend web application framework.
- **Drizzle ORM**: TypeScript ORM for interacting with PostgreSQL.
- **bcrypt**: Library for password hashing.
- **Multer**: Middleware for handling `multipart/form-data`, primarily for file uploads.
- **Zod**: TypeScript-first schema declaration and validation library.
- **360dialog WhatsApp Business API**: Integrated for order notifications to store owners, and broadcast/newsletter capabilities to customers. Configurable via SuperAdmin panel.