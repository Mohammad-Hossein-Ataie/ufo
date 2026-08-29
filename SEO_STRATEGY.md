# SEO Strategy

## Public Indexable Areas

- `/`
- `/products`
- `/products/category/[slug]` برای دسته‌های دارای محصول فعال
- `/products/[slug]`
- `/store/tehran-molavi`
- `/blog`
- `/b2b`

## Noindex / Disallow Areas

- cart، checkout، account، login و search داخلی
- صفحه‌های order و chat کاربر
- `/b2b/catalog`, `/b2b/cart`, `/b2b/checkout`, `/b2b/login`, `/b2b/orders`, `/b2b/account`
- همه مسیرهای `/admin`
- همه مسیرهای `/api`
- URLهای sort/filter کم‌ارزش
- URLهای جستجوی دارای `q`
- route قدیمی `/wholesale`

## Implemented

- helper مرکزی canonical/absolute URL در `@ufo/seo`
- `generateMetadata` برای محصولات، کاتالوگ و صفحات دسته
- canonical URLهای absolute و بدون query
- Open Graph defaults و dynamic OG image
- `Product`, `BreadcrumbList`, `Organization`, `WebSite`, `SearchAction`, `LocalBusiness`, `ItemList`, `CollectionPage`, `FAQPage` JSON-LD
- sitemap واحد در `src/app/sitemap.ts`
- robots واحد در `src/app/robots.ts`
- skip link و landmarks برای دسترسی‌پذیری بهتر

## Canonical Rules

- canonical باید از `APP_BASE_URL` ساخته شود و در نبود مقدار معتبر روی `https://ufopuff.com` fallback کند.
- hostهای `ufopuff.ir`، `www.ufopuff.ir` و `www.ufopuff.com` باید با redirect دائمی 301 به `https://ufopuff.com` منتقل شوند.
- queryهای داخلی مثل `q`, `sort` و `filter` در canonical حفظ نمی‌شوند.
- صفحات دسته مسیر تمیز `/products/category/[slug]` دارند؛ لینک‌های داخلی نباید به query دسته‌بندی متکی باشند.
- `/b2b/catalog` به دلیل نمایش قیمت همکاری noindex است و در sitemap قرار نمی‌گیرد.

## Sitemap Behavior

- فقط URLهای public و indexable وارد sitemap می‌شوند.
- محصولات باید `isActive: true` داشته باشند.
- دسته‌ها فقط وقتی وارد sitemap می‌شوند که حداقل یک محصول فعال داشته باشند.
- auth، cart، checkout، admin، API، search و کاتالوگ قیمت همکاری از sitemap حذف می‌شوند.

## Structured Data Rules

- JSON-LD باید با محتوای visible صفحه همخوان باشد.
- rating، review، گارانتی، certificaton یا claim تجاری بدون داده واقعی اضافه نمی‌شود.
- قیمت Product schema از `ProductVariant.retailPriceRial` و currency برابر `IRR` خوانده می‌شود.
- FAQPage فقط برای FAQهایی مجاز است که روی صفحه دیده می‌شوند.

## Content Rules

ادعای پزشکی، keyword stuffing و doorway page ممنوع است.

## Remaining Work

- اتصال داده محصول، redirect و CMS به MongoDB production.
- افزودن صفحات برند فقط بعد از داشتن توضیح و محصول کافی برای هر برند.
- بررسی حقوقی محتوای مربوط به محصولات سن‌محدود پیش از انتشار گسترده.
- اتصال Search Console و داده‌های واقعی Core Web Vitals برای تصمیم‌های بعدی.
