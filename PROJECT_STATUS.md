# PROJECT_STATUS

آخرین به‌روزرسانی: 2026-08-03

## وضعیت فعلی

پروژه اکنون یک Next.js app استاندارد در ریشه دارد. مسیرهای `src`، `public`، `next.config.mjs`، `tsconfig.json`، `postcss.config.mjs` و `tailwind.config.ts` مستقیم در ریشه هستند.

پوشه‌ی app قبلی حذف شده است. پوشه‌ی `packages/*` فقط برای ماژول‌های داخلی TypeScript استفاده می‌شود و Next app جدا نیست.

## مسیرها

- فروش تکی: `/`
- فروش عمده: `/b2b`
- پنل ادمین: `/admin`

## Deploy

Liara باید از ریشه‌ی `frontend` deploy شود. `liara.json` از `npm ci && npm run build` استفاده می‌کند و `.npmrc` registry را روی mirror رسمی Liara قرار می‌دهد.

## اولین کار اجرایی باقی‌مانده

اتصال production order/chat store و sessionها به MongoDB واقعی، همراه migration داده mock از `mock-data/orders.json`.
