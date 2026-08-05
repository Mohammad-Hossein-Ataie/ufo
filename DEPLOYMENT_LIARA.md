# Liara Deployment

## ساختار نهایی

این پروژه یک Next.js app استاندارد در ریشه دارد:

- سورس اپ: `src`
- فایل‌های public: `public`
- کانفیگ Next: `next.config.mjs`
- پورت: `3000`
- package اصلی: `package.json` ریشه

پوشه‌ی `packages/*` فقط ماژول‌های داخلی TypeScript هستند و Next app جدا محسوب نمی‌شوند.

## مسیرهای production

- فروش تکی: `https://ufopuff.ir/`
- فروش عمده: `https://ufopuff.ir/b2b`
- پنل ادمین: `https://ufopuff.ir/admin`

## دستورهای Liara

در Liara مسیر deploy را روی ریشه‌ی همین پروژه، یعنی پوشه‌ی `frontend`، قرار بدهید.

`liara.json` این دستورها را اجرا می‌کند:

```bash
npm ci
npm run build
npm run start
```

registry در `.npmrc` روی mirror رسمی Liara تنظیم شده است:

```ini
registry=https://package-mirror.liara.ir/repository/npm/
```

چون registry اختصاصی داریم، در `liara.json` مقدار زیر هم تنظیم شده است:

```json
{
  "node": {
    "mirror": false
  }
}
```

## Environment Variables

این مقدارها باید در پنل Liara برای همان یک سرویس Next.js تنظیم شوند:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_PHONE`
- `SESSION_SECRET`
- `LIARA_ENDPOINT`
- `LIARA_BUCKET_NAME`
- `LIARA_ACCESS_KEY`
- `LIARA_SECRET_KEY`
- `STORAGE_PROVIDER=liara`

## DNS

فقط دامنه‌ی `ufopuff.ir` را به همین Liara app وصل کنید. فروش عمده و پنل ادمین روی مسیرهای `/b2b` و `/admin` هستند و subdomain جدا لازم ندارند.
