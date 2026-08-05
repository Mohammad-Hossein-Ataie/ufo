# Environment Variables

Do not commit real credentials. Use `.env.local` locally and Liara environment settings in production.

## Core

- `NODE_ENV`
- `APP_BASE_URL`
- `B2B_BASE_URL`: same host with `/b2b`, for example `http://localhost:3000/b2b`.
- `ADMIN_BASE_URL`: same host with `/admin`, for example `http://localhost:3000/admin`.

## MongoDB

- `MONGODB_URI`: full Mongo connection string.
- `MONGODB_DB_NAME`: database name.

## Liara Object Storage

- `LIARA_ENDPOINT`: example `https://storage.c2.liara.site`
- `LIARA_BUCKET_NAME`: bucket name
- `LIARA_ACCESS_KEY`: secret value
- `LIARA_SECRET_KEY`: secret value
- `LIARA_PUBLIC_BASE_URL`: optional public URL prefix for uploaded product images.
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

## Store Settings Seed

- `STORE_OWNER_NAME`
- `STORE_PHONE`
- `STORE_ADDRESS`
- `STORE_TELEGRAM`
