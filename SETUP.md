# Excalibury Jerky Setup Guide

This guide will help you set up the application with all required integrations.

## Prerequisites

1. Node.js 18+ installed
2. A Sanity account and project
3. A Stripe account (for payments and product management)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### Required Variables

#### Stripe Configuration
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Get these from [Stripe Dashboard](https://dashboard.stripe.com/):
- **API Keys**: Go to Developers → API Keys
  - Use **test keys** for development (starts with `pk_test_` and `sk_test_`)
  - Use **live keys** for production (starts with `pk_live_` and `sk_live_`)
- **Webhook Secret**: Go to Developers → Webhooks → Add endpoint
  - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
  - Events to listen for: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
  - Copy the signing secret (starts with `whsec_`)

#### Sanity Configuration
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=your_sanity_write_token
```
- Project ID and dataset: [Sanity Manage](https://sanity.io/manage)
- Write token: [Sanity Tokens](https://sanity.io/manage/personal/tokens) (needs Editor/Admin permissions)

## Installation

```bash
npm install
```

## Running Locally

### First Time Setup

1. **Install Stripe CLI** (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe  # macOS
   # or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```
   This authenticates the Stripe CLI with your Stripe account.

### Starting Development

```bash
npm run dev
```

This automatically starts **both**:
- **Next.js dev server** on `http://localhost:3000` (cyan logs)
- **Stripe webhook forwarding** to `/api/webhooks/stripe` (magenta logs)

**On first run**, the Stripe CLI will output:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxx
```

**Copy that secret** to your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
```

Then restart the dev server for it to take effect.

### Running Components Separately (Optional)

If you need to run them separately:
```bash
npm run dev:next    # Just Next.js
npm run dev:stripe  # Just Stripe webhook forwarding
```

## Deployment

### Vercel / Netlify / etc.

1. Set all environment variables in your deployment platform:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `SANITY_API_WRITE_TOKEN`

2. Configure Stripe webhook endpoint:
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

3. Deploy!

## Sanity Studio

Access the Sanity Studio at `/studio` to manage:
- Banner announcements
- Landing page content
- Products (links to Stripe products)

### Creating Products

Products are managed in two places:

#### 1. Create Product in Stripe

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **Add Product**
3. Fill in:
   - **Name**: Product name
   - **Description**: Product description
   - **Images**: Upload product photos
   - **Pricing**: Set price and currency (USD)
   - **Metadata** (for inventory tracking):
     - Key: `quantity`, Value: `100` (your initial stock quantity)
     - Inventory is automatically tracked for all products
4. Save the product
5. Copy the **Product ID** (starts with `prod_`) and **Price ID** (starts with `price_`)

#### 2. Link Product in Sanity

1. Go to `/studio`
2. Create a new **Products** document
3. Fill in:
   - **Stripe Product ID**: The `prod_xxx` ID from Stripe
   - **Stripe Price ID**: The `price_xxx` ID from Stripe
   - **Name**: Product name (for display in CMS)
   - **Price**: Price in USD (should match Stripe)
   - **Description**: Rich text description with formatting
   - **Images**: Upload product photos (at least one required)
   - **Featured Product**: Check to feature on catalog page

## How Product Data Works

The catalog page combines data from two sources:

1. **Sanity CMS**: Product content and metadata
   - Product descriptions (rich text)
   - Product images
   - Featured status
   - Links to Stripe (via product/price IDs)

2. **Stripe API**: Pricing and inventory
   - Real-time inventory quantities
   - Product availability status
   - Pricing information

The data is fetched server-side on each page load, ensuring inventory is always current.

## Payment Flow

```
User adds to cart
  ↓
Clicks checkout
  ↓
POST /api/stripe/create-checkout-session
  ↓
Redirects to Stripe Checkout
  ↓
User completes payment
  ↓
Stripe sends webhook: checkout.session.completed
  ↓
POST /api/webhooks/stripe
  ↓
Verify signature & process payment
  ↓
Decrement inventory (if enabled)
  ↓
User redirected to /checkout/success
  ↓
✅ Order complete
```

## Troubleshooting

### "STRIPE_SECRET_KEY is not defined" error

- Check that `STRIPE_SECRET_KEY` is set in `.env.local` (local) or deployment environment variables
- Ensure the value starts with `sk_test_` (test mode) or `sk_live_` (live mode)
- Restart the dev server after adding environment variables

### Checkout redirect not working

- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set and correct
- Check browser console for errors
- Ensure products have valid `stripePriceId` values in Sanity
- Test checkout session creation: check `/api/stripe/create-checkout-session` response

### Webhooks not being received

- For local development: Use Stripe CLI to forward webhooks
- For production: Verify webhook endpoint is publicly accessible
- Check `STRIPE_WEBHOOK_SECRET` matches the webhook's signing secret
- View webhook logs in [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)

### Products not showing inventory

- Verify `quantity` metadata is set on the Stripe product
- Look at server logs for Stripe API errors
- Products without `quantity` metadata will show as "In Stock" with no quantity limit

### Payment succeeded but inventory not decremented

- Check webhook is configured and receiving events
- Verify `checkout.session.completed` event is enabled on webhook
- Check server logs for webhook processing errors
- Ensure product has `quantity` metadata set in Stripe

## Development Workflow

1. Create products in Stripe Dashboard
2. Link products in Sanity Studio (`/studio`)
3. Start dev server: `npm run dev`
4. Use Stripe CLI for local webhook testing
5. Visit `/catalog` to see products
6. Add items to cart and test checkout flow

## Production Checklist

- [ ] All environment variables set in deployment platform
- [ ] Stripe webhook endpoint configured with production URL
- [ ] `STRIPE_WEBHOOK_SECRET` matches webhook signing secret
- [ ] Using production Stripe keys (`pk_live_` and `sk_live_`)
- [ ] Sanity write token has correct permissions
- [ ] At least one product created in Stripe and linked in Sanity
- [ ] Test checkout flow end-to-end
- [ ] Verify webhook events are being received

## Support

For issues:
- Check server logs for detailed error messages
- Verify all environment variables are set
- Test webhook endpoints using Stripe CLI or Dashboard
- Review Stripe Dashboard logs for payment/webhook errors
