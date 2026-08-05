# MongoDB Schema

## Collections

Collections تعریف‌شده:

`users`, `userAddresses`, `businessProfiles`, `roles`, `sessions`, `otpChallenges`, `products`, `productVariants`, `brands`, `categories`, `compatibilityGroups`, `inventoryItems`, `inventoryTransactions`, `inventoryReservations`, `restockEvents`, `carts`, `orders`, `orderEvents`, `payments`, `paymentReceipts`, `shipments`, `shipmentEvents`, `shippingMethods`, `shippingRateRules`, `invoices`, `invoiceEvents`, `invoiceDeliveries`, `preorders`, `restockSubscriptions`, `notificationDeliveries`, `coupons`, `reviews`, `chatConversations`, `chatMessages`, `blogPosts`, `pages`, `redirects`, `notifications`, `auditLogs`, `settings`.

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

### Order

- `orderNumber` human-readable and unique
- `channel`: `retail` or `wholesale`
- `items` as snapshots
- `subtotalRial`, `discountRial`, `shippingRial`, `totalRial`
- `status`, `paymentMethod`, `shippingMethod`
- every status change should append an `orderEvents` document

### Settings

Store information is stored as editable settings with `id: "store"` and should not be hardcoded into UI components.

## Money And Dates

- Money is stored as integer Rial.
- UI displays Toman.
- Dates are stored as ISO UTC strings.
