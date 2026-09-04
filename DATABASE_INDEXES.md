# Database Indexes

Indexes are declared in `packages/database/src/index.ts` as `databaseIndexes`.

## High-value indexes

- `users.phone` unique: login and IDOR-safe ownership checks.
- `customers.mobileNumber + customerType` unique: one customer profile per phone per platform.
- `products.slug` unique: product pages and canonical URLs.
- `products.categoryId + isActive`: catalog category filters.
- `products.nameFa + tags` text: internal search.
- `productVariants.sku` unique: order snapshots and admin lookup.
- `inventoryItems.variantId` unique: shared inventory lookup.
- `inventoryReservations.expiresAt` TTL: automatic release of abandoned reservations.
- `carts.customerId + platformType + status`: active cart lookup and cart ownership checks.
- `cartItems.cartId`: cart item listing and mutations.
- `orders.orderNumber` unique: human-readable order references.
- `orders.userId + createdAt`: customer order history.
- `orders.channel + status + createdAt`: admin queues for retail and wholesale.
- `payments.status + createdAt`: receipt review queue.
- `shipments.trackingCode`: shipment support lookup.
- `invoices.secureTokenHash` unique: secure invoice sharing.
- `restockSubscriptions.variantId + phone` unique: duplicate restock prevention.
- `reviews.productId + status + createdAt`: verified reviews on product pages.
- `wishlists.customerId + productId` unique: future wishlist duplicate prevention.
- `redirects.source` unique: redirect manager.
- `auditLogs.actorId + createdAt`: security review trail.

Run `npm run seed` with `MONGODB_URI` set to create indexes and seed development data.
