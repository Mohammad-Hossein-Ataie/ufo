# معماری UFO Puff

## ساختار

پروژه یک Next.js app استاندارد در ریشه دارد:

- `src/app`: مسیرها، layoutها و API routeها
- `src/components`: componentهای اپ
- `src/lib`: helperهای runtime اپ
- `public`: assetهای عمومی
- `packages/*`: ماژول‌های داخلی TypeScript برای domain، UI، auth، orders، storage و adapterها

## مسیرها

- `/`: فروش تکی روی دامنه اصلی
- `/b2b`: فروش عمده روی subdirectory برای تمرکز SEO دامنه
- `/admin`: پنل ادمین

هر بخش shell و navigation خودش را دارد تا از دید کاربر سه پلتفرم جدا باشند، اما build و deploy فقط یک Next app است.

## APIها

- Retail: `/api/orders`, `/api/chat`
- B2B: `/api/b2b/orders`, `/api/b2b/chat`
- Admin: `/api/admin/*`

پنل ادمین با `src/proxy.ts` محافظت می‌شود و فقط مسیرهای `/admin` و `/api/admin` نیاز به session ادمین دارند.

## تصمیم‌های اصلی

- B2B به جای subdomain روی `/b2b` قرار گرفت تا اعتبار دامنه و محتوای SEO متمرکز بماند.
- route قدیمی `/wholesale` حذف شد.
- cart و session تکی/عمده جدا هستند: `ufo-retail-*` و `ufo-b2b-*`.
- `@ufo/orders` در development یک store فایل‌محور mock دارد تا سفارش و چت بین retail، B2B و admin مشترک دیده شود.
- Liara Object Storage پشت `StorageProvider` قرار دارد و در نبود env واقعی با `MemoryStorageProvider` اجرا می‌شود.
