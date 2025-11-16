# Product Management Guide for Excalibury Jerky

This guide explains how to create and manage products for your e-commerce store without needing technical knowledge or running scripts.

## Table of Contents
- [Understanding the System](#understanding-the-system)
- [Creating a New Product in Stripe](#creating-a-new-product-in-stripe)
- [Adding Size Variants (Prices)](#adding-size-variants-prices)
- [Setting Inventory](#setting-inventory)
- [Adding Product Images](#adding-product-images)
- [How Products Appear on Your Website](#how-products-appear-on-your-website)
- [Managing Products in Sanity Studio](#managing-products-in-sanity-studio)
- [Troubleshooting](#troubleshooting)

---

## Understanding the System

Your e-commerce store uses two platforms working together:

- **Stripe**: Manages products, prices, inventory, and payments
- **Sanity**: Stores additional product information like descriptions and images
- **Automatic Sync**: When you create/update products in Stripe, they automatically sync to Sanity (if your development server is running)

### Product Structure

Each product (e.g., "Traditional Beef Jerky") has:
- A single product entry in Stripe
- Multiple **size variants** (4oz, 8oz, 12oz, 1lb) as different "prices"
- **Base units** for inventory tracking (4oz = 1 unit, 8oz = 2 units, etc.)
- Inventory tracked in 4oz base units

**Example**: If you have 100 base units in stock:
- You can sell 100× 4oz packages, OR
- 50× 8oz packages, OR
- 25× 1lb packages, OR
- Any combination that totals 100 base units

---

## Creating a New Product in Stripe

### Step 1: Access the Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in with your Stripe account
3. Make sure you're in **Test Mode** (toggle at the top right) for testing, or **Live Mode** for real products
4. Navigate to **Products** in the left sidebar

### Step 2: Create the Product

1. Click the **"+ Add product"** button (top right)
2. Fill in the product information:

   **Product name**: Enter the product name WITHOUT the size
   - ✅ Correct: "Traditional Beef Jerky"
   - ❌ Wrong: "4oz Traditional Beef Jerky"

   **Description**: Enter a short, catchy description (1-2 sentences)
   - Example: "Classic beef jerky with authentic flavor - a timeless favorite"
   - This appears as the subtitle on product cards

   **Image**: (Optional for now, see [Adding Product Images](#adding-product-images))
   - Click "Add image" to upload a product photo
   - Use high-quality images (minimum 800×800 pixels)

### Step 3: Configure Pricing

**Important**: Do NOT use the default pricing section. We'll add custom prices in the next section.

1. In the pricing section, select **"One time"** (not recurring)
2. Skip setting a price here - we'll add all size variants separately
3. Click **"Add product"** at the bottom

### Step 4: Add Product Metadata (Inventory)

After creating the product, you'll be on the product detail page.

1. Scroll down to the **"Metadata"** section
2. Click **"+ Add metadata"**
3. Add this metadata field:
   - **Key**: `stock`
   - **Value**: Enter the total base units available (e.g., `100`)

   💡 **What is a base unit?** One base unit = one 4oz package
   - 100 base units = 100× 4oz packages worth of inventory

4. Click **"Save"** (top right)

---

## Adding Size Variants (Prices)

Now we'll add the different size options (4oz, 8oz, 12oz, 1lb) for your product.

### Standard Pricing Formula

Use this pricing structure (based on $10.49 per 4oz):

| Size | Price | Base Units |
|------|-------|------------|
| 4oz  | $10.49 | 1 |
| 8oz  | $20.98 | 2 |
| 12oz | $31.47 | 3 |
| 1lb  | $41.96 | 4 |

### Step 1: Add First Price (4oz)

1. On the product detail page, scroll to the **"Pricing"** section
2. Click **"+ Add another price"**
3. Fill in the price details:

   **Price**: `10.49`

   **Currency**: `USD`

   **Billing period**: Select **"One time"** (not recurring)

   **Price description** (also called nickname): `4oz`
   - This is what customers will see in the size selector

4. Scroll down to **"Additional options"**
5. Click **"+ Add metadata"**
6. Add this metadata:
   - **Key**: `base_units`
   - **Value**: `1`

   ⚠️ **Critical**: This tells the system that a 4oz package uses 1 base unit of inventory

7. Click **"Add price"**

### Step 2: Add Remaining Sizes

Repeat Step 1 for each size, using the table above:

**8oz Package:**
- Price: `20.98`
- Price description: `8oz`
- Metadata: `base_units` = `2`

**12oz Package:**
- Price: `31.47`
- Price description: `12oz`
- Metadata: `base_units` = `3`

**1 lb Package:**
- Price: `41.96`
- Price description: `1 lb`
- Metadata: `base_units` = `4`

### Step 3: Verify Your Prices

After adding all prices, you should see all 4 sizes listed in the Pricing section of your product. Each should have:
- ✅ The correct price amount
- ✅ A clear nickname (4oz, 8oz, 12oz, 1 lb)
- ✅ Metadata with `base_units` set correctly

---

## Setting Inventory

Inventory is managed through product metadata (as shown in Step 4 of product creation).

### How Inventory Works

- **Stock is tracked in base units** (4oz packages)
- When a customer orders an 8oz package (2 base units), inventory decrements by 2
- When inventory reaches 0, the product shows as "Out of Stock"

### Updating Inventory

1. Go to your product in the Stripe Dashboard
2. Scroll to **"Metadata"** section
3. Find the `stock` key
4. Update the value to your new inventory count (in base units)
5. Click **"Save"**

**Example**:
- You have 50 base units left
- A customer orders 2× 8oz packages (2 packages × 2 base units = 4 total)
- Inventory automatically updates to 46 base units after purchase

### Unlimited Inventory

To allow unlimited purchases (not recommended for physical products):
- Remove the `stock` metadata entirely, OR
- Set `stock` to a very high number like `999999`

---

## Adding Product Images

Good product images are crucial for sales. Here's how to add them:

### In Stripe Dashboard

1. Go to your product in the Stripe Dashboard
2. In the product details, find the **"Images"** section at the top
3. Click **"Add image"**
4. Upload your image:
   - **Format**: JPG or PNG
   - **Size**: Minimum 800×800 pixels (1200×1200 recommended)
   - **Style**: Clean, well-lit product photos with plain background

5. Add multiple images if available (product from different angles)
6. The first image will be the primary image shown on product cards
7. Click **"Save"**

### Image Best Practices

✅ **Do:**
- Use high-resolution images
- Show the product clearly
- Use consistent lighting and style across products
- Include the product packaging if relevant

❌ **Don't:**
- Use blurry or low-quality images
- Include text overlays (like "SALE" or "NEW")
- Use images with busy backgrounds
- Mix different image styles across products

### In Sanity Studio (Optional)

You can also manage images in Sanity Studio for more control:

1. Go to your Sanity Studio (usually at `yourwebsite.com/studio`)
2. Find your product in the Products section
3. Click on it to edit
4. Upload images to the **"Primary Image"** field
5. Add additional images to **"Additional Images"**
6. Add alt text for accessibility
7. Click **"Publish"**

**Note**: Images uploaded to Sanity won't override Stripe images - both sources are displayed.

---

## How Products Appear on Your Website

### Automatic Syncing

When you create or update a product in Stripe:

1. **If the development server is running** (`npm run dev`):
   - Changes sync automatically within seconds via webhooks
   - Product appears on the catalog page immediately

2. **If the server is not running**:
   - Products will show with basic Stripe data (name, price, description)
   - To get full sync with images and rich descriptions, run: `npm run sync-stripe-products`

### What Customers See

**Catalog Page:**
- Product card with primary image
- Product name
- Price (starting from lowest size option)
- Stock status ("In Stock" with quantity, or "Out of Stock")
- Size selector dropdown (if multiple sizes exist)
- "Add to Cart" button

**Product Detail Page:**
- Large product images (gallery if multiple images)
- Product name and subtitle
- Size selector with all available options
- Current price (updates when size changes)
- Stock availability
- Rich text description (managed in Sanity)
- Quantity controls
- "Add to Cart" button

**Cart:**
- Shows product name with selected size (e.g., "Traditional Beef Jerky - 8oz")
- Respects max quantity based on available inventory
- Updates totals automatically

---

## Managing Products in Sanity Studio

While Stripe handles the core product data, Sanity Studio lets you add rich content.

### Accessing Sanity Studio

1. Navigate to your Sanity Studio URL (ask your developer)
2. Log in with your Sanity credentials
3. Click on **"Products"** in the left sidebar

### What to Edit in Sanity

**Rich Text Description:**
- Click on a product
- Scroll to the **"Description"** field
- Write a detailed product description with:
  - Ingredients
  - Flavor profile
  - Nutrition information
  - Any allergen warnings
- Use formatting (bold, lists, etc.) for better readability

**Featured Products:**
- Toggle the **"Featured"** checkbox
- Featured products appear first on the catalog page
- Use this for bestsellers or promotional items

**Current Discount:**
- Enter a discount percentage (0-100) in **"Currently Discounted (%)"**
- If you enter `20`, customers will see:
  - Current price: $10.49
  - Original price: $13.11 (strikethrough)
  - "20% OFF" badge

**What NOT to Edit in Sanity:**
- ❌ **Name**: Always edit in Stripe (will be overwritten)
- ❌ **Price**: Always edit in Stripe (will be overwritten)
- ❌ **Prices Array**: Managed automatically, don't touch
- ❌ **Stripe Product ID**: Never change this

### Publishing Changes

After editing in Sanity:
1. Click **"Publish"** at the bottom
2. Changes appear on your website immediately

---

## Troubleshooting

### Problem: Product doesn't appear on website

**Solutions:**
1. Check that product is **active** in Stripe (not archived)
2. Ensure product has at least one **active price** with `base_units` metadata
3. If webhook sync is not working, ask your developer to run: `npm run sync-stripe-products`
4. Clear your browser cache and refresh the page

### Problem: "Product not found" when clicking from catalog

**Solutions:**
1. This usually means the product hasn't synced yet
2. Ask your developer to run: `npm run sync-stripe-products`
3. Wait a few seconds and refresh the page

### Problem: Wrong stock quantity showing

**Solutions:**
1. Check the `stock` metadata value in Stripe
2. Remember: stock is in base units (4oz packages)
   - If you want 25 lbs in stock, that's 100 base units (25 lbs ÷ 0.25 lbs per unit)
3. Verify that price `base_units` metadata is correct
4. Recent orders may have decremented inventory - check Stripe Dashboard > Payments

### Problem: Images not showing

**Solutions:**
1. Ensure images are uploaded to Stripe product
2. Wait a few minutes for automatic sync (if webhook is running)
3. Check image format (must be JPG or PNG)
4. Try uploading images directly to Sanity Studio
5. Ask your developer to manually trigger sync

### Problem: Size selector not appearing

**Solutions:**
1. Product must have **2 or more** active prices to show size selector
2. Check that all prices have proper nicknames (4oz, 8oz, etc.)
3. Ensure prices are set to **"One time"** (not recurring)
4. Verify all prices have `base_units` metadata

### Problem: Customers can't complete checkout

**Solutions:**
1. Check that all prices are **active** in Stripe
2. Verify inventory is available (`stock` > 0)
3. Ensure Stripe is in the correct mode (Test or Live)
4. Check that payment methods are enabled in Stripe settings

---

## Quick Reference: Creating a New Product Checklist

- [ ] Create product in Stripe Dashboard
- [ ] Add product name (WITHOUT size)
- [ ] Add short description (1-2 sentences)
- [ ] Add `stock` metadata (e.g., `100`)
- [ ] Add 4oz price ($10.49) with `base_units` = `1`
- [ ] Add 8oz price ($20.98) with `base_units` = `2`
- [ ] Add 12oz price ($31.47) with `base_units` = `3`
- [ ] Add 1lb price ($41.96) with `base_units` = `4`
- [ ] Upload product image (800×800px minimum)
- [ ] Save the product
- [ ] Wait for automatic sync (or ask developer to run sync script)
- [ ] Check product appears on website
- [ ] (Optional) Add rich description in Sanity Studio
- [ ] (Optional) Mark as featured in Sanity Studio
- [ ] (Optional) Add discount percentage in Sanity Studio

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Stripe Dashboard** for error messages or warnings
2. **Contact your developer** with specific details:
   - Product name and Stripe ID
   - What you were trying to do
   - What happened instead
   - Screenshots if possible

3. **Common Resources**:
   - [Stripe Dashboard](https://dashboard.stripe.com)
   - [Stripe Product Documentation](https://stripe.com/docs/products-prices/overview)
   - Your Sanity Studio URL (provided by developer)

---

## Appendix: Understanding Base Units

### Why Base Units?

This system allows customers to order different sizes of the same product while tracking one shared inventory pool.

### Conversion Table

| Size | Weight | Base Units | Packages per 100 Base Units |
|------|--------|------------|------------------------------|
| 4oz  | 0.25 lbs | 1 | 100 packages |
| 8oz  | 0.50 lbs | 2 | 50 packages |
| 12oz | 0.75 lbs | 3 | 33 packages |
| 1 lb | 1.00 lbs | 4 | 25 packages |

### Real-World Example

You have **100 base units** in stock. Customers order:
- 10× 4oz (10 base units used) → 90 remaining
- 5× 8oz (10 base units used) → 80 remaining
- 3× 12oz (9 base units used) → 71 remaining
- 2× 1 lb (8 base units used) → 63 remaining

The website automatically calculates max quantities for each size based on remaining inventory.

---

*Last updated: [Current Date]*
*For technical documentation, see the main README.md*
