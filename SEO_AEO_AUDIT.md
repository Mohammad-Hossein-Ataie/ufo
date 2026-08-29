# SEO and AEO Audit

Date: 2026-08-05

## Repository Understanding

UFO Puff is a single root-level Next.js App Router project with shared TypeScript packages under `packages/*`. Public retail routes live under `/`, wholesale/B2B under `/b2b`, and admin under `/admin`. The project uses server-rendered App Router pages, static generation for product detail pages, route handlers for API endpoints, local Persian/RTL UI, and shared domain seed data for products, variants, categories, brands, inventory and store settings.

The data model stores money as integer Rial and renders Toman in UI. Products can now carry optional English names, product kind, channel visibility, technical specs, highlights and package contents. Admin and storage routes are protected by middleware and environment-based credentials.

## Findings

### Critical

- No critical public-indexing failure remained after the latest product import fix. Inactive products are excluded from product lookup and static params.

### High

- `src/app/sitemap.ts` used hard-coded URLs and included all products, regardless of active state.
- `packages/seo/src/index.ts` hard-coded host behavior and had limited canonical handling.
- `src/components/app-shell.tsx` linked to `/support`, but no such route exists.
- `/b2b/catalog` was treated inconsistently: listed as indexable in older docs while visible copy says price data should stay out of search.

### Medium

- Category discovery relied on query URLs under `/products?category=...`, producing weaker canonical structure.
- Product JSON-LD used the product slug as SKU and always used `UFO Puff` as brand instead of actual variant SKU and brand.
- FAQ JSON-LD was absent on visible FAQ/guide content.
- The guide page was thin and mostly placeholder content.

### Low

- No skip-to-content link existed for keyboard users.
- Sitemap did not include clean category URLs.
- SEO strategy documentation did not describe new product-data and canonical rules.

## Implemented Changes

- Centralized SEO helpers in `@ufo/seo` for site origin, absolute URLs, canonical URLs and safe JSON-LD serialization.
- Added schema helpers for `WebSite`, `SearchAction`, `ItemList`, `CollectionPage` and `FAQPage`.
- Updated product JSON-LD to use the actual variant SKU, real brand name when available, canonical product URL and IRR pricing.
- Added clean category landing pages at `/products/category/[slug]`.
- Updated product/category links to use clean category URLs instead of query filters.
- Marked searched/filtered `/products` URLs as noindex while preserving follow.
- Updated sitemap to include only public indexable URLs, active products and non-empty categories.
- Removed `/b2b/catalog` from sitemap and marked it noindex because it exposes cooperation pricing.
- Added visible AEO FAQ content on home, B2B and guide/store pages with matching JSON-LD.
- Added related-product internal links on product pages.
- Added skip-to-content support and fixed the broken footer support link.

## Remaining Limitations

- Product images still mostly use placeholder imagery and should be replaced with accurate product photos.
- Product specs are only as complete as the client-supplied files.
- Brand pages were not created because many brands would be thin without unique brand copy and curated product sets.
- Search Console, Bing Webmaster Tools, analytics, server headers and legal review require production access or business decisions.
- Redirect management exists in the schema but no public redirect resolver was implemented in this pass.

## Manual Verification Checklist

- Verify `APP_BASE_URL=https://ufopuff.com` in production.
- Verify `ufopuff.ir`, `www.ufopuff.ir` and `www.ufopuff.com` return 301 redirects to the same path on `https://ufopuff.com`.
- Open `/robots.txt` and confirm non-public routes are excluded.
- Open `/sitemap.xml` and confirm only active products and clean category pages appear.
- Submit sitemap in Google Search Console and Bing Webmaster Tools.
- Test representative pages in Google Rich Results Test.
- Run PageSpeed Insights after production deployment.
- Review product prices, stock, age restriction copy and legal notices before launch.
