# Storefront refinement

## Previous selection and data flow

The homepage called `listCatalogRows()` → `listAdminProducts()`, filtered active retail products (missing sales channels defaulted to retail), and took the first four rows. There was no manually featured flag and no homepage date sort. MongoDB queried products by `updatedAt` descending; database overrides preceded bundled catalog entries. Without MongoDB, the existing in-memory/bundled array order applied. `createdAt` was not used for selection.

Categories are domain records with IDs and slugs, linked through `product.categoryId`. Listing, category, related, and wholesale cards share `@ufo/ui`'s `ProductCard`; the homepage previously had separate markup. Mobile uses responsive classes on the same cards.

## Selection and interaction

- The reusable selector explicitly sorts active retail catalog rows by `updatedAt` descending, preserving the existing update-based freshness convention. Invalid/missing update dates fall back to `createdAt`, then zero; product IDs break date ties deterministically.
- Priority is `pod` (`cat-pod`), `vape` (`cat-vape`), `disposable` (`cat-disposable`), then `e-liquid` (`cat-eliquid`). Labels come from the category model.
- Reserve one latest product for every populated target category first. Fill missing slots with the latest unreserved catalog products, displaying their actual categories. Four slots remain populated whenever four eligible distinct products exist.
- Only after filling the four slots, allocate up to two more products to each represented target category. All slot pools are disjoint, including fallbacks, so manual browsing cannot reveal duplicates across slots. Fallback slots remain single-product slots.
- Follow-up: slots now autoplay every 4500ms with deterministic staggering, pause/resume, image preparation, RTL swipe/keyboard support and a 400ms two-stage transition. Reduced motion disables autoplay. Only the active card is mounted; initial cards are server-rendered. See `PRODUCT_CARD_CAROUSEL.md` for the behavior and validation details.
- The heading is now **محصولات جدید یوفوپاف**, with discovery-oriented supporting copy.

## Images and surfaces

Previously, the protected generator contained each original inside a white square, then listing cards added padding inside a 4:3 container. Portrait artwork became visibly undersized. Live catalog inspection confirmed both portrait promotional artwork and white-background product photographs.

Card derivatives now preserve the complete original over a blurred, dimmed copy that fills the square. Shared card media uses a consistent 1:1 ratio with edge-to-edge rendering and no extra padding. Native white backgrounds in source photographs remain intact. Homepage, listing, category, related, and shared wholesale card media benefit from the central change.

The existing protected route, validation, remote-host restrictions, private originals, watermark, WebP encoding, lazy loading, and cache policy remain. Card URLs use `?v=2` and generated storage keys use `card-v2.webp`, so old cached padded derivatives are replaced on demand. Detail derivatives retain their existing full-image presentation. Next/Image remains in use; protected storefront images continue using the existing server-generated derivatives without a second optimization pass.

Desktop retail cards, sticky filters, header, category guidance panel, and product-detail container share translucent dark gradients, restrained borders, 16px backdrop blur, inner highlights, and soft shadows. The new-products section adds a subtle background tint. Glass styles are scoped to desktop retail surfaces. Mobile navigation, safe-area rules, filters, and existing two-column grids are preserved; the homepage now also uses two compact columns on mobile.

## Validation

- `npm run typecheck`: passed.
- `npm run lint`: passed; shared UI also checked with ESLint.
- `npm run build`: passed.
- Focused Vitest: **16 passed** across homepage selection, image protection, and admin product tests.
- Focused Playwright: **4 passed**, covering desktop/mobile selection stability, duplicate prevention, controls, reduced motion, filtering, protected images, and product details.
- Visual inspection: homepage and catalog at 390px/1440px; loaded product detail images and related cards checked. Additional overflow checks passed at 320px, 768px, and 1024px on homepage, catalog, and category routes. No browser page errors in discovery checks.

## Existing architectural considerations

- The catalog already merges database records with bundled products and falls back to the bundled catalog when the database is unavailable. This is unchanged; no mock catalog was added. Bundled records can therefore appear in the new section, including the existing e-liquid item whose name mentions salt nicotine. Category membership follows stored IDs, not inferred names.
- `isActive` is the existing publication signal; there is no separate published status. Out-of-stock/preorder products remain eligible, preserving existing storefront behavior.
- Product edits can promote an older product because freshness is update-based. This matches the previous database ordering, rather than asserting that every displayed product was recently created.
- Regenerating a card derivative adds one-time image processing; subsequent requests use the existing cache. Old generated derivatives are not deleted.

## Files changed

- Selection: `src/lib/homepage-products.ts`.
- Homepage: `src/app/page.tsx`, `src/components/homepage-products.tsx`, `src/components/homepage-product-slot.tsx`.
- Shared cards/images: `packages/ui/src/index.tsx`, `src/components/storefront-product-image.tsx`, `src/lib/product-images.ts`, `src/lib/product-image-protection.ts`, `src/app/api/product-images/[...path]/route.ts`.
- Retail layouts/styles: `src/app/globals.css`, `src/app/products/page.tsx`, `src/app/products/[slug]/page.tsx`, `src/app/products/category/[slug]/page.tsx`, `src/components/product-detail-client.tsx`, `src/components/site-header.tsx`.
- Tests: `tests/unit/homepage-products.test.ts`, `tests/unit/product-image-protection.test.ts`, `tests/e2e/storefront-discovery.spec.ts`.
- Report: `STOREFRONT_REFINEMENT.md`.
