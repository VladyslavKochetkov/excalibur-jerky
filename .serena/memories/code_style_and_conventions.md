# Code Style and Conventions

## General Style
- **Formatting**: Managed by Biome
  - Indent: 2 spaces (not tabs)
  - Line endings: auto
  - Organize imports automatically on save
- **Linting**: Biome with recommended rules for React and Next.js

## TypeScript
- Full TypeScript usage across the codebase
- Strict type checking enabled
- Interface definitions for all data structures
- Type imports from `sanity.types.ts` (auto-generated)

## File Naming
- Components: PascalCase (e.g., `ProductCard.tsx`)
- Pages: lowercase with hyphens for routes (e.g., `catalog/[id]/page.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Config files: lowercase with dots (e.g., `next.config.ts`)

## Component Patterns
- Server Components by default (Next.js 16 App Router)
- Client Components marked with `"use client"` directive
- Async server components for data fetching
- Props typed with TypeScript interfaces

## Caching Patterns
- Use `"use cache"` directive for server component caching
- Apply `cacheTag()` for cache invalidation
- Set `cacheLife("hours")` for cache duration
- Fetch functions use `next: { revalidate: 60 }` for ISR

## Import Organization
- Third-party imports first
- Local imports after
- Organized by Biome automatically
- Use `@/` alias for src directory imports

## Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE (when truly constant)
- Types/Interfaces: PascalCase with descriptive names
- Boolean props/variables: Prefixed with `is`, `has`, `should`

## Comments
- Use JSDoc comments for functions when helpful
- Inline comments for complex logic
- Avoid obvious comments
