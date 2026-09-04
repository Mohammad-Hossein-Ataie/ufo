# Environment Variables

Do not commit real credentials. Use `.env.local` locally and Liara environment settings in production.

## Core

- `NODE_ENV`
- `APP_BASE_URL`: production canonical origin, `https://ufopuff.com`.
- `B2B_BASE_URL`: same host with `/b2b`, for example `https://ufopuff.com/b2b` in production or `http://localhost:3000/b2b` locally.
- `ADMIN_BASE_URL`: same host with `/admin`, for example `https://ufopuff.com/admin` in production or `http://localhost:3000/admin` locally.

## MongoDB

- `MONGODB_URI`: full Mongo connection string.
- `MONGODB_DB_NAME`: database name.

## Liara Object Storage

- `LIARA_ENDPOINT`: SDK endpoint, example `https://storage.c2.liara.site`.
- `LIARA_BUCKET_NAME`: bucket name
- `LIARA_ACCESS_KEY`: secret value
- `LIARA_SECRET_KEY`: secret value
- `LIARA_PUBLIC_BASE_URL`: optional public URL prefix for uploaded product images. Use the bucket custom domain, for example `https://bucket.ufopuff.com`, so public image URLs do not depend on the filtered Liara default domain. If SSL is not active for the custom domain yet, HTTP may work directly, but HTTPS pages can block HTTP images as mixed content.
- `STORAGE_PROVIDER`: `mock` or `liara`

## Auth

- `SESSION_SECRET`
- `OTP_SECRET`
- `SUPER_ADMIN_PHONE`
- `ADMIN_USERNAME`: admin panel username.
- `ADMIN_PASSWORD`: admin panel password. Store only in `.env.local` or Liara env.
- `ADMIN_PHONE`: admin contact phone for seed/support display.

## Providers

- `SMS_PROVIDER`
- `PAYMENT_PROVIDER`
- `SHIPPING_PROVIDER`
- `CHAT_PROVIDER`
- `SEARCH_PROVIDER`
- `ANALYTICS_PROVIDER`
- `UFO_MOCK_DATA_DIR`: local directory for file-backed mock orders/chat. Default: `./mock-data`.
  - Also stores file-backed OTP challenges, customer accounts and active carts in local development.

## Store Settings Seed

- `STORE_OWNER_NAME`
- `STORE_PHONE`
- `STORE_ADDRESS`
- `STORE_TELEGRAM`
