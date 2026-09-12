# B2B technical audit — 2026-09-12

Scope: non-promotional indexation safety, removal of unsupported statistics, and skip-link targets. This is not a completed sales-copy, keyword-targeting, conversion, or competitive-positioning rewrite.

## Findings and changes

- B2B login, account, cart, checkout, order history, and quick order had no route-level robots metadata. They inherited the `/b2b` canonical. The parent layout now defaults to `noindex, nofollow`, clears the inherited canonical, and clears inherited retail OpenGraph/Twitter defaults. Existing explicit metadata on child pages takes precedence.
- Production `robots.txt` blocked B2B account/transaction URLs, preventing compliant crawlers from reading their noindex metadata. Those B2B crawl blocks were removed; admin/API and non-production crawl restrictions remain. This does not change authentication or data access. Search exclusion takes effect when a search engine recrawls the page; noindex is not access control.
- The homepage statistics strip contained hard-coded `+۵۰۰` partners and `۲۴h` tracking claims. Neither was connected to a business data source. Other counters came from seed product/variant arrays rather than the filtered admin-backed catalog. The entire statistics strip was removed without replacement promotional claims.
- Six B2B utility pages lacked the `main-content` target referenced by the shared skip link. The missing IDs were added without changing form or transaction logic.

Google documents why crawlers need access to read noindex: [Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Route decisions

| Route                                       | Existing function                                                | Result                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `/b2b`                                      | Public landing page                                              | Existing explicit index/follow and canonical retained           |
| `/b2b/about`                                | Public information page                                          | Existing explicit index/follow and canonical retained           |
| `/b2b/catalog`                              | Catalog with cooperation pricing                                 | Existing noindex/nofollow and self-canonical retained           |
| `/b2b/quick-order`                          | Transaction form using seed variants and writing cart selections | Inherits noindex/nofollow; no homepage canonical                |
| `/b2b/login`, `/b2b/account`                | Account utilities                                                | Inherit noindex/nofollow; no homepage canonical                 |
| `/b2b/cart`, `/b2b/checkout`, `/b2b/orders` | Transaction utilities                                            | Inherit noindex/nofollow; no homepage canonical                 |
| `/b2b/orders/[orderId]`                     | Account-specific order detail                                    | Existing noindex retained; inherited homepage canonical removed |

The sitemap is unchanged and continues to exclude the catalog and transaction/account routes. New B2B pages inherit noindex unless they explicitly override it.

## Inspected implementation

- `SEO_STRATEGY.md`, `SEO_AEO_AUDIT.md`
- B2B landing, catalog, about, quick-order, layout, header, and account/transaction wrappers
- Global metadata, robots, sitemap, and `@ufo/seo` helpers
- `catalog-data.ts` / admin-backed catalog rows and `quick-order-client.ts` / static domain data

The existing SEO strategy intentionally keeps cooperation pricing out of search. This pass preserves that decision. The catalog and quick-order data sources differ; neither was refactored.

## Unchanged / not completed

- Public sales copy, search-intent targeting, keyword strategy, and competitive claims
- Public-page title/description rewrites and additional internal links
- Existing JSON-LD; no new schema types, ratings, reviews, or FAQ markup
- Pricing, inventory, authentication, cart, checkout, order creation, and APIs
- Previously implemented retail header changes

## Verification

- `npx vitest run tests/unit/b2b-indexation.test.ts`
- `npx playwright test tests/e2e/b2b-indexation.spec.ts --workers=1` checks generated HTTP HTML before hydration, robots metadata, canonical inheritance, headings, skip-link targets, removed statistics, and sitemap exclusions.
- `npm run typecheck`
- `npm run lint` plus lint for the two new test files
- `npm run build`

Results: all 4 unit tests and 11 generated-HTML checks passed. TypeScript, lint, and the production build passed. Exactly one H1 and one skip-link target were verified on the nine tested non-detail pages. Order-detail verification covers metadata only, without an authenticated order session.

No Search Console access or production recrawl verification is included. The HTTP checks do not submit forms, authenticate users, or create orders.

## Files changed in this pass

- `src/app/b2b/layout.tsx`
- `src/app/robots.ts`
- `src/app/b2b/page.tsx`
- `src/app/b2b/quick-order/page.tsx`
- `src/app/b2b/login/page.tsx`
- `src/app/b2b/account/page.tsx`
- `src/app/b2b/cart/page.tsx`
- `src/app/b2b/checkout/page.tsx`
- `src/app/b2b/orders/page.tsx`
- `tests/unit/b2b-indexation.test.ts`
- `tests/e2e/b2b-indexation.spec.ts`
- `SEO_STRATEGY.md`
- `B2B_TECHNICAL_AUDIT.md`
