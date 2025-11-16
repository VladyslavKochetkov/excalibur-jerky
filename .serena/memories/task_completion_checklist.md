# Task Completion Checklist

When completing a development task, follow these steps:

## 1. Code Quality
```bash
npm run lint             # Check for linting errors
npm run format           # Format code with Biome
```
Fix any linting errors before committing.

## 2. Type Safety
```bash
npm run typegen          # Regenerate Sanity types if schemas changed
npm run build            # Verify TypeScript compilation works
```
Ensure no TypeScript errors.

## 3. Testing
- Manually test the feature in development mode
- Test on different screen sizes (responsive design)
- Verify Stripe integration if payment-related
- Check Sanity Studio if CMS-related
- Validate cart functionality if product/inventory-related

## 4. Verification
- [ ] Code follows project conventions
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Responsive design works
- [ ] Caching invalidation works (if applicable)
- [ ] Webhooks tested (if Stripe-related)

## 5. Git Commit
Only after all checks pass:
```bash
git add .
git commit -m "descriptive message"
git push
```

## Important Notes
- **Always run `npm run typegen`** after modifying Sanity schemas
- **Test webhooks locally** with `npm run dev` (includes Stripe listener)
- **Check browser console** for React/Next.js errors
- **Verify cache invalidation** if modifying cached routes
- **Test on port 8437** (custom dev server port)
