# Customer Account, Cart And Order APIs

Customer account APIs support both B2C retail and B2B wholesale sessions after OTP login. The current local implementation persists mock customer/cart data under `UFO_MOCK_DATA_DIR`; production can map the same contracts to MongoDB collections documented in `DATABASE_SCHEMA.md`.

## Authentication

- `POST /api/auth/send-otp`
  - Body: `phone`, `customerType` (`retail` or `wholesale`)
  - Creates an OTP challenge. In `SMS_PROVIDER=mock` or non-production it returns the test `code`.
- `POST /api/auth/verify-otp`
  - Body: `challengeId`, `code`, `customerType`, profile fields, `guestCart`
  - Creates or updates the customer account, merges guest cart lines into the active customer cart, and returns a signed customer session token.

Clients store the returned token in platform-specific local storage and send it as:

```http
Authorization: Bearer <token>
```

## Customer

- `GET /api/customer/profile`
  - Requires a valid customer session token.
  - Returns the current customer profile.
- `PATCH /api/customer/profile`
  - Requires a valid customer session token.
  - Updates retail profile fields and wholesale fields such as `companyName`, `businessType`, `taxId`, `customerLevel`, and `pricingGroup`.

## Cart

- `GET /api/cart`
  - Requires a valid customer session token.
  - Returns the active cart, enriched items, and backend-calculated totals.
- `POST /api/cart/items`
  - Requires a valid customer session token.
  - Body: `variantId`, `quantity`, optional `cartonCount`, optional `selectedVariant`.
  - The backend recalculates unit price from product variants; frontend price values are ignored.
- `PATCH /api/cart/items/:itemId`
  - Requires a valid customer session token.
  - Updates quantity or wholesale carton count for an item owned by the current customer's active cart.
- `DELETE /api/cart/items/:itemId`
  - Requires a valid customer session token.
  - Removes only an item owned by the current customer's active cart.

Guest carts remain in localStorage (`ufo-retail-cart`, `ufo-b2b-cart`) until OTP verification. `verify-otp` merges them into the customer's active cart and the client clears localStorage.

## Orders

- `GET /api/orders`
  - Retail only. Requires retail session token. Returns only orders where the stored owner id matches the current customer.
- `POST /api/orders`
  - Retail checkout. Converts the current active cart into an order, snapshots product data, then marks the cart `CHECKED_OUT`.
- `GET /api/orders/:orderId`
  - Retail only. Requires ownership.
- `POST /api/orders/:orderId/reorder`
  - Retail repeat order. Finds active variants from historical SKUs and adds available lines to the active cart.
- `GET /api/b2b/orders`
  - Wholesale equivalent.
- `POST /api/b2b/orders`
  - Wholesale checkout from active cart.
- `GET /api/b2b/orders/:orderId`
  - Wholesale detail with ownership check.
- `POST /api/b2b/orders/:orderId/reorder`
  - Wholesale repeat order.

## Security Notes

- Customer/order/cart APIs do not trust `phone`, `customerId`, `orderId`, `cartId`, or price values from frontend payloads.
- Order detail and reorder calls verify `customerId` ownership from the signed token.
- Cart item updates look up the active cart by the current `customerId` and platform before changing an item.
- OTP, profile, cart and reorder routes include in-process rate limits for the local app. Production should replace this with a shared store such as Redis or Mongo-backed counters.
