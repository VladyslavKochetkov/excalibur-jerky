# Excalibury Jerky - Project Overview

## Purpose
A modern e-commerce platform for Excalibury Jerky, selling premium jerky products with size variants and inventory management.

## Tech Stack
- **Framework**: Next.js 16.0.1 (App Router) with React Compiler enabled
- **React**: Version 19.2.0
- **CMS**: Sanity Studio for content management
- **Payments**: Stripe for checkout and payments
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Code Quality**: Biome (linting & formatting)
- **Animation**: Framer Motion
- **Icons**: Lucide React + React Icons

## Key Features
- Product catalog with multiple size variants (4oz, 8oz, 12oz, 1lb)
- Shopping cart with real-time inventory validation
- Base unit inventory system (4oz packages as base unit)
- Stripe Checkout integration
- Automatic webhook sync between Stripe and Sanity
- Rich text product descriptions via Portable Text
- Responsive design

## Architecture
- **Data Flow**: Stripe (source of truth) → Webhooks → Sanity (CMS) → Next.js (frontend)
- **Inventory**: Tracked in base units (4oz packages) in Stripe metadata
- **Product Sync**: Automated via Stripe webhooks to Sanity
- **Caching**: Uses Next.js 16 "use cache" directive with cache tags and revalidation

## Development Server
- Main: `npm run dev` (runs Next.js + Stripe webhook listener concurrently)
- Port: 8437 (custom port, not default 3000)
