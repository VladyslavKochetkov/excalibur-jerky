# Excalibury Jerky E-Commerce Store

A modern e-commerce platform for Excalibury Jerky, built with Next.js, Stripe, and Sanity CMS.

## Features

- 🛍️ Product catalog with multiple size variants
- 🛒 Shopping cart with real-time inventory validation
- 💳 Stripe Checkout integration
- 📦 Base unit inventory system (4oz packages as base unit)
- 🖼️ Dynamic product images from Stripe and Sanity
- 📝 Rich text product descriptions
- 🔄 Automatic webhook sync between Stripe and Sanity
- 📱 Responsive design with modern UI

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **CMS**: Sanity Studio
- **Payments**: Stripe
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Stripe account
- Sanity account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd excalibury-jerky
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_WRITE_TOKEN=sk...
```

4. Run the development server:
```bash
npm run dev
```

This will:
- Generate Sanity types
- Start Next.js dev server on port 3000
- Start Stripe webhook listener

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Documentation

### For Store Managers (Non-Technical)

- **[Product Management Guide](./docs/PRODUCT-MANAGEMENT-GUIDE.md)** - Complete guide for creating and managing products using Stripe Dashboard and Sanity Studio
- **[Quick Reference](./docs/QUICK-REFERENCE.md)** - Printable quick reference card for common tasks

### For Developers

See sections below for technical documentation.

## Product Management

### Creating Products (Non-Technical)

See the [Product Management Guide](./docs/PRODUCT-MANAGEMENT-GUIDE.md) for step-by-step instructions on:
- Creating products in Stripe Dashboard
- Adding size variants with proper metadata
- Setting inventory
- Adding images
- Managing product descriptions in Sanity

### Product Structure

Each product has:
- **Single product entry** in Stripe
- **Multiple price variants** (4oz, 8oz, 12oz, 1lb)
- **Base unit inventory system**:
  - 4oz = 1 base unit
  - 8oz = 2 base units
  - 12oz = 3 base units
  - 1 lb = 4 base units
- **Automatic sync** to Sanity via webhooks

### Available Scripts

```bash
# Development
npm run dev              # Run dev server with webhook listener
npm run dev:next         # Run only Next.js dev server
npm run dev:stripe       # Run only Stripe webhook listener

# Build & Deploy
npm run build            # Build for production
npm run start            # Start production server

# Sanity
npm run typegen          # Generate TypeScript types from Sanity schema

# Product Management (Technical)
npm run sync-stripe-products      # Manually sync all Stripe products to Sanity
npm run delete-products           # Delete all products from Sanity
npm run delete-stripe-products    # Archive all products in Stripe

# Code Quality
npm run lint             # Run Biome linter
npm run format           # Format code with Biome
```

## Project Structure

```
excalibury-jerky/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (user-facing)/        # Public-facing pages
│   │   │   ├── catalog/          # Product catalog
│   │   │   │   └── [id]/         # Product detail page
│   │   │   └── checkout/         # Checkout pages
│   │   ├── api/                  # API routes
│   │   │   └── webhooks/stripe/  # Stripe webhook handler
│   │   └── studio/               # Sanity Studio
│   ├── components/               # React components
│   │   ├── ProductCard.tsx       # Product card with size selector
│   │   ├── ProductAddToCart.tsx  # Add to cart component
│   │   └── CartValidator.tsx     # Cart validation component
│   ├── contexts/                 # React contexts
│   │   └── CartContext.tsx       # Shopping cart state management
│   ├── lib/
│   │   └── stripe/               # Stripe integration
│   │       └── products.ts       # Product and inventory management
│   └── sanity/                   # Sanity CMS
│       ├── lib/
│       │   └── products.ts       # Sanity product operations & sync
│       └── schemaTypes/
│           └── products.ts       # Product schema definition
├── scripts/                      # Utility scripts
│   ├── sync-stripe-products.ts   # Manual sync script
│   ├── delete-all-products.ts    # Cleanup script
│   └── delete-stripe-products.ts # Stripe cleanup script
└── docs/                         # Documentation
    ├── PRODUCT-MANAGEMENT-GUIDE.md
    └── QUICK-REFERENCE.md
```

## Key Concepts

### Base Unit Inventory System

Inventory is tracked in **base units** (4oz packages):

| Size | Base Units | Price |
|------|-----------|-------|
| 4oz  | 1 | $10.49 |
| 8oz  | 2 | $20.98 |
| 12oz | 3 | $31.47 |
| 1 lb | 4 | $41.96 |

**Example**: With 100 base units in stock, customers can order:
- 100× 4oz packages, OR
- 50× 8oz packages, OR
- 33× 12oz packages, OR
- 25× 1lb packages, OR
- Any valid combination

The system automatically:
- Calculates max quantity per size based on remaining inventory
- Prevents overselling across different size variants
- Validates cart on every page load
- Decrements inventory by base units on purchase

### Product Sync Flow

1. **Create/update product in Stripe** (via Dashboard or CLI)
2. **Webhook event fires** → hits `/api/webhooks/stripe`
3. **Webhook handler**:
   - Validates event signature
   - Ensures all prices have `base_units` metadata
   - Calls `syncStripeProductToSanity()`
4. **Sync function**:
   - Fetches all active prices for product
   - Creates or updates product in Sanity
   - Downloads and uploads images to Sanity
   - Preserves Sanity-only fields (description, featured status)
5. **Product appears on website** with merged data from both sources

### Cart Item Structure

Cart items are uniquely identified by `${productId}-${priceId}`:

```typescript
{
  id: "prod_123-price_456",           // Unique cart item ID
  productId: "prod_123",               // Stripe product ID
  priceId: "price_456",                // Specific price variant ID
  name: "Traditional Beef Jerky",      // Product name
  sizeNickname: "8oz",                 // Size variant
  price: 20.98,                        // Price in dollars
  quantity: 2,                         // Number of items
  baseUnits: 2,                        // Base units per item
  maxQuantity: 50                      // Max available for this variant
}
```

This allows:
- Same product with different sizes to exist separately in cart
- Individual quantity controls per size variant
- Accurate max quantity calculations per variant

## Webhook Setup

### Local Development

The `npm run dev` command automatically starts the Stripe CLI webhook listener.

If you need to start it manually:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret and add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `product.created`
   - `product.updated`
   - `price.created`
   - `price.updated`
   - `checkout.session.completed`
5. Copy the signing secret to your production environment variables

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure you:
- Set all required environment variables
- Configure webhook endpoint in Stripe
- Run `npm run build` to build the application
- Serve with `npm run start`

## Troubleshooting

### Products not syncing

1. Check webhook listener is running: `npm run dev` or `npm run dev:stripe`
2. Verify webhook secret in `.env.local`
3. Check Stripe Dashboard → Developers → Webhooks for failed events
4. Manually sync: `npm run sync-stripe-products`

### "Product not found" errors

This usually means product IDs don't match. Solution:
1. Delete all products from Sanity: `npm run delete-products`
2. Resync from Stripe: `npm run sync-stripe-products`

### Inventory not updating

1. Verify `stock` metadata exists on product in Stripe
2. Check `base_units` metadata exists on all prices
3. Look for webhook errors in logs
4. Ensure checkout webhook (`checkout.session.completed`) is configured

### Images not loading

1. Check images are uploaded to Stripe product
2. Verify images are accessible (not broken URLs)
3. Wait for webhook sync or run manual sync
4. Check browser console for CORS or 404 errors

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Yes |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name | Yes |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version | Yes |
| `SANITY_API_WRITE_TOKEN` | Sanity write token | Yes |

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run linter: `npm run lint`
4. Format code: `npm run format`
5. Test thoroughly
6. Submit a pull request

## License

[Your License Here]

## Support

For technical support, please contact [your contact information]

---

**Quick Links:**
- [Product Management Guide](./docs/PRODUCT-MANAGEMENT-GUIDE.md) - For store managers
- [Quick Reference](./docs/QUICK-REFERENCE.md) - Quick reference card
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Sanity Studio](./studio) - Local Sanity Studio
