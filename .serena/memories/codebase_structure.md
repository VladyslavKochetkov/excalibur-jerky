# Codebase Structure

## Root Directory
```
excalibury-jerky/
├── src/                  # Source code
├── public/               # Static assets
├── scripts/              # Utility scripts
├── docs/                 # Documentation
├── .serena/              # Serena MCP cache
├── .claude/              # Claude Code settings
├── node_modules/         # Dependencies
└── .next/                # Next.js build output
```

## src/ Directory Structure

### App Router (`src/app/`)
```
app/
├── (user-facing)/        # Public-facing pages (route group)
│   ├── page.tsx          # Home/landing page
│   ├── catalog/          # Product catalog
│   │   ├── page.tsx      # Catalog list
│   │   └── [id]/         # Individual product pages
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       └── not-found.tsx
│   ├── checkout/         # Checkout flow
│   │   ├── success/
│   │   └── cancel/
│   ├── about-us/
│   ├── contact/
│   └── layout.tsx        # User-facing layout
├── (studio)/             # Sanity Studio (route group)
│   └── studio/[[...tool]]/
├── api/                  # API routes
│   ├── contact/
│   ├── webhooks/stripe/  # Stripe webhook handler
│   └── stripe/           # Stripe checkout sessions
├── globals.css           # Global styles
└── providers/            # React context providers
```

### Components (`src/components/`)
```
components/
├── ui/                   # Reusable UI components
│   └── button.tsx
├── sections/             # Page sections (Header, Navigation, etc.)
│   ├── Navigation.tsx
│   ├── Header.tsx
│   ├── BannerAnnouncement.tsx
│   └── NavigationItem.tsx
├── ProductCard.tsx       # Product card with size selector
├── ProductAddToCart.tsx  # Add to cart component
├── ProductImageGallery.tsx
├── CartModal.tsx         # Shopping cart modal
├── CartValidator.tsx     # Real-time cart validation
├── SearchModal.tsx       # Search functionality
├── StripeCheckoutButton.tsx
├── ContactForm.tsx
└── Providers.tsx         # App-wide providers wrapper
```

### Sanity CMS (`src/sanity/`)
```
sanity/
├── lib/                  # Sanity utilities
│   ├── client.ts         # Sanity client config
│   ├── live.ts           # Live preview
│   ├── products.ts       # Product queries & sync logic
│   ├── landing.ts
│   ├── aboutUs.ts
│   ├── contactUs.ts
│   ├── announcements.ts
│   └── image.ts          # Image URL builder
├── schemaTypes/          # Content schemas
│   ├── products.ts
│   ├── landing.ts
│   ├── aboutUs.ts
│   ├── contactUs.ts
│   ├── bannerAnnouncement.ts
│   └── index.ts
├── structure.ts          # Studio structure
└── env.ts                # Environment config
```

### Utilities (`src/lib/`)
```
lib/
├── stripe/               # Stripe integration
│   ├── client.ts         # Stripe client
│   └── products.ts       # Product & inventory from Stripe
├── email/
│   └── order-emails.ts   # Email notifications
├── utils.ts              # General utilities
└── checkout-session.ts   # Checkout session helpers
```

### Context (`src/contexts/`)
```
contexts/
└── CartContext.tsx       # Shopping cart state management
```

## Key Configuration Files
- `next.config.ts` - Next.js configuration (React Compiler, cacheComponents enabled)
- `sanity.config.ts` - Sanity Studio configuration
- `sanity.types.ts` - Auto-generated TypeScript types from Sanity
- `biome.json` - Code formatting and linting rules
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
