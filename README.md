# UFO Puff

فروشگاه فارسی و RTL محصولات UFO Puff روی یک Next.js app استاندارد در ریشه پروژه.

## ساختار

فقط یک Next.js app وجود دارد:

- `src`: routeها، APIها و componentهای اپ
- `public`: favicon، logo و تصویرهای عمومی
- `packages/*`: ماژول‌های داخلی TypeScript، نه Next app جدا

مسیرهای اصلی:

- فروش تکی: `http://localhost:3000/`
- فروش عمده: `http://localhost:3000/b2b`
- پنل ادمین: `http://localhost:3000/admin`
- ورود ادمین: `http://localhost:3000/admin/login`

## نصب و اجرا

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Assets

- faviconها: `public/favicons`
- لوگوها: `public/logos`
- تصویرها: `public/images`

## Deploy

جزئیات استقرار Liara در `DEPLOYMENT_LIARA.md` آمده است. deploy باید از ریشه‌ی همین پروژه انجام شود.
