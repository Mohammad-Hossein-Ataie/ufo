# SEO Strategy

## Public Indexable Areas

- `/`
- `/products`
- `/products/[slug]`
- `/store/tehran-molavi`
- `/blog`
- `/b2b`
- `/b2b/catalog`

## Noindex / Disallow Areas

- cart، checkout، account، login و search داخلی
- صفحه‌های order و chat کاربر
- `/b2b/cart`, `/b2b/checkout`, `/b2b/login`, `/b2b/orders`, `/b2b/account`
- همه مسیرهای `/admin`
- همه مسیرهای `/api`
- URLهای sort/filter کم‌ارزش
- route قدیمی `/wholesale`

## Implemented

- `generateMetadata` برای محصولات
- canonical URLها
- Open Graph defaults و dynamic OG image
- `Product`, `BreadcrumbList`, `Organization`, `LocalBusiness` JSON-LD
- sitemap واحد در `src/app/sitemap.ts`
- robots واحد در `src/app/robots.ts`

## Content Rules

ادعای پزشکی، keyword stuffing و doorway page ممنوع است.
