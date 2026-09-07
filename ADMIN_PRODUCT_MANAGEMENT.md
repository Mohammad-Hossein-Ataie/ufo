# Admin product management

## Implemented experience

The Persian RTL product screen now fetches one server page (20, 50 or 100 rows),
shows the filtered total and visible range, and keeps the table header and edit
actions visible while scrolling. Search covers Persian/English product name,
slug, SKU and brand name/slug. Filters cover category, brand, product kind, channel,
publication state and available stock. Column sorting includes stable ID tie-breaking.

Selection is limited to the current page and cleared when the query/page changes.
Bulk activate, deactivate, category, brand, absolute retail/wholesale price changes
and delete require confirmation and accept at most 100 explicit product IDs.
The confirmation shows price units and affected count. Individual failures are
displayed instead of silently claiming the entire batch succeeded.

The existing editor retains its flavor/color/resistance/capacity logic and image
assignments, organized into six tabs: basic, pricing/inventory, variants, images,
SEO and expandable specifications. The save footer stays outside the scrolling
panel. Closing a dirty form asks before discarding; page refresh/window close uses
the browser's beforeunload warning. Tab switching preserves edits and supports RTL
arrow keys. Loading, empty, retry, confirmation and dismissible notification states
are included. Mobile navigation is compact and horizontally scrollable.

ImageManager supports file picking and drag/drop upload, ordered galleries with
drag and keyboard-accessible movement buttons, primary image selection, preview,
removal and the existing variant-image assignments. Upload still uses the protected
admin endpoint and private originals. Gallery changes are persisted with Save;
removing an image from a product does not delete its stored object.

## Architecture and API

- `ProductManager` owns query, selection and draft state and reuses the existing
  product/variant/inventory input model. Requests are debounced 300 ms and cancelled
  on query changes; sequence checks prevent stale responses replacing newer data.
- `ProductTable`, `ProductFilters`, `Pagination`, `BulkActions`, `ProductTabs` and
  `ImageManager` are reusable components under `src/components/admin/products`.
- The image editor is dynamically imported. Full product detail and auxiliary
  flavor/color records are loaded when opening an editor, not on every list fetch.
- `GET /api/admin/products` accepts `page`, `pageSize`, `q`, `category`, `brand`,
  `kind`, `channel`, `status`, `stock`, `sort`, `direction`; empty filters mean all.
  It returns `{ rows, total, page, pageSize, categories, brands }`. Out-of-range
  pages are clamped. Invalid sizes/parameters return 400; database failures return
  503 with an explicit retry state rather than substitute production catalog data.
- `GET /api/admin/products/:id` returns the full row on demand. Existing POST/PATCH
  now persist `seoTitle`, `seoDescription` and `seoKeywords`. Product metadata uses
  these keywords. Existing custom SEO survives saves that omit those properties.
- `POST /api/admin/products/bulk` accepts `{ ids, action }`; category/brand add
  `value`, and prices add optional integer `retailPriceRial`/`wholesalePriceRial`.
  At least one price is required. UI prices are toman; API prices remain rial.
  The response is `{ succeeded: string[], failed: { id, error }[] }`.
- The existing admin proxy still guards all APIs with signed session/CSRF checks.
  Bulk also verifies authentication and canonical origin inside the handler.

The MongoDB list uses an aggregation with initial product filters, indexed joins
to variants/inventory, literal escaped search, stock calculations, a count facet,
stable sort and bounded skip/limit. Large descriptions, galleries and specification
fields are excluded from list responses. No full Mongo collections are fetched into
Node for the admin list or to locate a product being saved. The existing bundled
in-memory repository remains the local no-Mongo fallback.

Available stock is `max(0, onHand - reserved)`; low stock is positive available stock
at or below the restock threshold. The list/editor price and stock refer to the
primary model (MongoDB: first variant by ID), consistent with the existing single
model editor. SKU search matches any variant in MongoDB. Bulk price/state updates
apply to all models of the selected product. Price values are absolute assignments,
so retrying them does not compound a percentage adjustment.

The original storefront-wide catalog loading architecture is unchanged. Substring
search and sorting joined prices/stock still require server work over matching
records; they are not claimed to be index-only searches. Query execution has a
10-second limit. Use explain/realistic staging data before scaling far beyond
thousands; a materialized search/read model may eventually be appropriate.

## Database and migration

**Run the additive migration before deploying the new Mongo-backed admin list.**
Previously the app merged bundled catalog entries with database overrides on every
read. Database pagination now treats MongoDB as the authoritative admin catalog;
bundled records must exist there to appear in the total/list.

```powershell
npm run migrate:admin-catalog
```

Run from the application root with the intended server environment securely loaded.
The script uses the existing `.env`/`.env.local` precedence. Verify the target
environment before running it. It was prepared but was **not run against production**.

The migration uses `$setOnInsert` keyed by ID for bundled products, variants and
inventory. Existing overrides and tombstones are preserved. Re-running is safe;
there is no delete or overwrite step. Existing unique slug/SKU conflicts cause a
reported failure and must be reconciled, not bypassed by dropping constraints.
Do not use the existing destructive seed command for this migration.

Additional product indexes cover ID, deletedAt/updatedAt/ID, brand/state and
kind/channel. Existing productId and inventory variantId indexes support joins.
The migration invokes existing index setup. No new collection is required.

Product adds optional `seoKeywords: string[]` and `deletedAt: string`; old documents
need no field rewrite. Delete sets a tombstone and inactive state, preserving
order references, inventory records and images. The existing bundled merge honors
tombstones, preventing deleted seeded records from returning during successful
database reads. An operator can restore a tombstone explicitly if needed; there is
no restore UI in this change.

Bulk updates span product and variant documents and are **not a multi-document
transaction**. A database failure can leave a product partially updated; the UI
reports it as failed and asks for verification/retry. Concurrent administrator
edits retain the existing last-write-wins behavior. This change does not introduce
inventory reservation transactions or rewrite the order system.

Use MongoDB 5.0 or later for the concise lookup syntax. MongoDB documents the
[lookup syntax](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)
and [facet resource limits](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/).

## Verification

Local results: 3 browser scenarios passed, including real image upload and editing
an existing product; the production build and TypeScript checks passed. The focused
catalog/image/auth regression suite passed. The 2 MongoDB integration cases are
explicitly skipped until a local test database is supplied.

```powershell
npx vitest run tests/unit/admin-product-management.test.ts tests/unit/admin-products.test.ts
npm run test:admin-products
npm run typecheck
npm run lint
npm run build
```

Unit coverage includes 3,240-row pagination, 20/50/100 page sizes, combined filters,
sorting, exact totals, invalid queries, literal search, SEO and image-order
persistence, price/state changes, deletion and bulk authorization. Browser tests
use an isolated loopback server at port 3106, temporary signing secrets, mock
storage and no database; they exercise actual API calls, form tabs, dirty-close
confirmation, image upload/order/preview, editing, bulk actions and mobile layout.
Screenshots are written under ignored `test-results/`.

For the real MongoDB integration suite, provide a **local disposable MongoDB**:

```powershell
$env:UFO_TEST_MONGODB_URI='mongodb://127.0.0.1:27017/'
npx vitest run tests/integration/admin-products-mongo.test.ts
```

It creates and drops only a randomly named `ufo_admin_test_*` database. Without
that local-only variable the suite is skipped; it never uses the project's
production MONGODB_URI. MongoDB/Docker was unavailable locally during this change,
so the live aggregation integration and production dataset performance remain
staging verification steps, not claimed completed checks.

After migration/deploy: compare totals to MongoDB, inspect a 20-row network
response, search a known SKU, combine category/brand/stock filters, edit one
product, verify its public metadata and image order, then exercise bulk actions
on disposable staging products. Confirm missing admin sessions return 401 and
cross-origin mutations return 403. Test reservation-adjusted stock with real data.

## Changed files for this redesign

- `src/components/admin/product-manager.tsx`, `src/components/admin/admin-shell.tsx`
- `src/components/admin/products/product-table.tsx`
- `src/components/admin/products/product-filters.tsx`
- `src/components/admin/products/pagination.tsx`
- `src/components/admin/products/bulk-actions.tsx`
- `src/components/admin/products/product-tabs.tsx`
- `src/components/admin/products/image-manager.tsx`
- `src/lib/admin-products.ts`, `src/lib/admin-product-query.ts`, `src/lib/admin-product-bulk.ts`
- `src/app/api/admin/products/route.ts`, `src/app/api/admin/products/[productId]/route.ts`
- `src/app/api/admin/products/bulk/route.ts`, `src/app/products/[slug]/page.tsx`
- `packages/database/src/index.ts`, `packages/types/src/index.ts`, `package.json`
- `scripts/migrate-admin-catalog.ts`, `scripts/admin-products-test-server.mjs`
- `playwright.admin-products.config.ts`
- `tests/unit/admin-product-management.test.ts`
- `tests/integration/admin-products-mongo.test.ts`
- `tests/e2e/admin-product-management.spec.ts`, `ADMIN_PRODUCT_MANAGEMENT.md`

Existing authentication fixes and user environment-file changes are preserved.
