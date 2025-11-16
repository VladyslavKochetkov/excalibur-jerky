# Quick Reference: Adding Products

## 📋 Checklist

### 1. Create Product in Stripe
- Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products → **"+ Add product"**
- **Name**: Product name WITHOUT size (e.g., "Traditional Beef Jerky")
- **Description**: Short 1-2 sentence description
- Click **"Add product"**

### 2. Add Inventory Metadata
- Scroll to **"Metadata"** section
- Click **"+ Add metadata"**
- Key: `stock`
- Value: Total base units (e.g., `100`)
- Click **"Save"**

### 3. Add All Size Prices

Repeat for each size:

#### 4oz
- Price: `10.49`
- Description: `4oz`
- Metadata: `base_units` = `1`

#### 8oz
- Price: `20.98`
- Description: `8oz`
- Metadata: `base_units` = `2`

#### 12oz
- Price: `31.47`
- Description: `12oz`
- Metadata: `base_units` = `3`

#### 1 lb
- Price: `41.96`
- Description: `1 lb`
- Metadata: `base_units` = `4`

### 4. Add Images (Optional)
- Upload product photo (minimum 800×800px)
- Click **"Save"**

### 5. Wait for Sync
- Product will appear on website within seconds (if dev server running)
- Or ask developer to run: `npm run sync-stripe-products`

---

## 🔢 Base Units Explained

One base unit = one 4oz package

| Size | Base Units | Max Orders with 100 Units |
|------|-----------|---------------------------|
| 4oz  | 1 | 100 packages |
| 8oz  | 2 | 50 packages |
| 12oz | 3 | 33 packages |
| 1 lb | 4 | 25 packages |

**Example**: 100 base units = 25 lbs of total inventory

---

## 🎯 Common Tasks

### Update Inventory
Stripe → Product → Metadata → Edit `stock` value → Save

### Add Discount
Sanity Studio → Products → Product → "Currently Discounted (%)" field → Publish

### Make Featured
Sanity Studio → Products → Product → Toggle "Featured" → Publish

### Add Description
Sanity Studio → Products → Product → "Description" field → Publish

---

## ⚠️ Important Rules

✅ **DO:**
- Create product in Stripe first
- Add ALL size prices with correct `base_units`
- Use consistent naming (4oz, 8oz, 12oz, 1 lb)
- Upload high-quality images

❌ **DON'T:**
- Include size in product name
- Edit product name/price in Sanity
- Forget `base_units` metadata on prices
- Change Stripe Product ID in Sanity

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Product not showing | Check active in Stripe, has prices with metadata |
| Wrong stock amount | Update `stock` in Stripe metadata (remember: base units!) |
| No size selector | Need 2+ active prices with nicknames |
| Images missing | Upload to Stripe, wait for sync |

---

For detailed instructions, see [PRODUCT-MANAGEMENT-GUIDE.md](./PRODUCT-MANAGEMENT-GUIDE.md)
