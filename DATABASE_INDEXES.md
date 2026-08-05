# Database Indexes

Indexes are declared in `packages/database/src/index.ts` as `databaseIndexes`.

## High-value indexes

- `users.phone` unique: login and IDOR-safe ownership checks.
- `products.slug` unique: product pages and canonical URLs.
- `products.categoryId + isActive`: catalog category filters.
- `products.nameFa + tags` text: internal search.
- `productVariants.sku` unique: order snapshots and admin lookup.
- `inventoryItems.variantId` unique: shared inventory lookup.
- `inventoryReservations.expiresAt` TTL: automatic release of abandoned reservations.
- `orders.orderNumber` unique: human-readable order references.
- `orders.channel + status + createdAt`: admin queues for retail and wholesale.
- `payments.status + createdAt`: receipt review queue.
- `shipments.trackingCode`: shipment support lookup.
- `invoices.secureTokenHash` unique: secure invoice sharing.
- `restockSubscriptions.variantId + phone` unique: duplicate restock prevention.
- `reviews.productId + status + createdAt`: verified reviews on product pages.
- `redirects.source` unique: redirect manager.
- `auditLogs.actorId + createdAt`: security review trail.

Run `npm run seed` with `MONGODB_URI` set to create indexes and seed development data.
