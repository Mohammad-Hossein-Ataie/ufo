# MongoDB Schema

## Collections

Collections تعریف‌شده:

`users`, `customers`, `userAddresses`, `businessProfiles`, `roles`, `sessions`, `otpChallenges`, `products`, `productVariants`, `brands`, `categories`, `compatibilityGroups`, `inventoryItems`, `inventoryTransactions`, `inventoryReservations`, `restockEvents`, `carts`, `cartItems`, `orders`, `orderEvents`, `payments`, `paymentReceipts`, `shipments`, `shipmentEvents`, `shippingMethods`, `shippingRateRules`, `invoices`, `invoiceEvents`, `invoiceDeliveries`, `preorders`, `restockSubscriptions`, `notificationDeliveries`, `coupons`, `reviews`, `wishlists`, `chatConversations`, `chatMessages`, `blogPosts`, `pages`, `redirects`, `notifications`, `auditLogs`, `settings`.

## Core Documents

### Product

- `id`, `slug`, `nameFa`, `brandId`, `categoryId`
- `nameEn`, `productKind`, `salesChannels`
- `shortDescriptionFa`, `descriptionFa`
- `image`, `images`, `tags`, `attributes`
- `specs`, `highlightsFa`, `packageItemsFa`
- `sourceNoteFa`, `adminNotesFa`
- `isActive`, `isAgeRestricted`
- `seoTitle`, `seoDescription`
- `createdAt`, `updatedAt` as ISO UTC

### ProductVariant

- `id`, `productId`, `nameFa`, `sku`
- `retailPriceRial`, `wholesalePriceRial`, `compareAtPriceRial`
- `cartonSize`, `minWholesaleCartonCount`
- `wholesaleEnabled`: keeps B2B hidden until real wholesale pricing is approved.
- `attributes`, `isActive`

### InventoryItem

- `id`, `variantId`
- `onHand`, `reserved`
- `preorderEnabled`, `restockThreshold`
- `updatedAt`

### Customer

- `id`
- `mobileNumber`: normalized Iranian mobile number, unique with `customerType`
- `firstName`, `lastName`
- `email` optional
- `customerType`: `retail` or `wholesale`
- `status`: `active` or `suspended`
- Wholesale-only readiness fields: `companyName`, `businessType`, `taxId`, `customerLevel`, `pricingGroup`
- `createdAt`, `updatedAt` as ISO UTC

### Cart

- `id`
- `customerId`
- `platformType`: `retail` or `wholesale`
- `status`: `ACTIVE`, `CHECKED_OUT`, `ABANDONED`
- `items`: file-backed mock embeds items; Mongo can split them into `cartItems`
- `createdAt`, `updatedAt` as ISO UTC

### CartItem

- `id`, `cartId`
- `productId`
- `variantId` optional
- `quantity`
- `unitPriceSnapshot`: backend-calculated Rial snapshot
- `discountAmount`
- `cartonCount` for wholesale lines
- `selectedVariant` optional UI selection metadata
- `createdAt`

Cart price is never trusted from frontend payloads. API handlers send only product/variant IDs and quantities; the backend looks up active variants and recalculates unit price, discount, subtotal and final total.

### Order

- `orderNumber` human-readable and unique
- `userId`: current implementation stores the owning `customerId` here for customer-created orders.
- `channel`: `retail` or `wholesale`
- `items` as snapshots
- `subtotalRial`, `discountRial`, `shippingRial`, `totalRial`
- `status`, `paymentMethod`, `shippingMethod`
- every status change should append an `orderEvents` document

### OrderItem Snapshot

- `productName`, `variantName`, `sku`, `image`
- `selectedAttributes`
- `unitPriceRial`, `quantity`, `discountRial`, `totalRial`
- `cartonSize`, `cartonCount` for wholesale

Order items intentionally store snapshots. Later product name, SKU or price changes must not rewrite historical orders.

### Wishlist

- `customerId`
- `productId`
- `createdAt`

Wishlist indexes are prepared for future implementation with a unique `customerId + productId` key.

### Settings

Store information is stored as editable settings with `id: "store"` and should not be hardcoded into UI components.

## Money And Dates

- Money is stored as integer Rial.
- UI displays Toman.
- Dates are stored as ISO UTC strings.
