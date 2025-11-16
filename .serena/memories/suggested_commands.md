# Suggested Commands for Excalibury Jerky

## Development
```bash
npm run dev              # Run dev server with webhook listener (port 8437)
npm run dev:next         # Run only Next.js dev server
npm run dev:stripe       # Run only Stripe webhook listener
```

## Build & Deploy
```bash
npm run build            # Build for production (includes type generation)
npm run start            # Start production server
```

## Code Quality
```bash
npm run lint             # Run Biome linter
npm run format           # Format code with Biome
```

## Sanity CMS
```bash
npm run typegen          # Generate TypeScript types from Sanity schema
```

## Product Management (Technical)
```bash
npm run sync-stripe-products      # Manually sync all Stripe products to Sanity
npm run delete-products           # Delete all products from Sanity
npm run delete-stripe-products    # Archive all products in Stripe
```

## Git Commands (macOS/Darwin)
Standard git commands work normally on Darwin:
```bash
git status
git add .
git commit -m "message"
git push
git pull
```

## Common Utilities (Darwin/macOS)
```bash
ls -la                   # List files with details
find . -name "*.tsx"     # Find files by name
grep -r "pattern" .      # Search for pattern in files
cat filename             # Display file contents
cd directory             # Change directory
```
