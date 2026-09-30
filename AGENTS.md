# Project Conventions

- One Next.js app in `src`; shared TypeScript packages in `packages/*`.
- Liara production data under `UFO_MOCK_DATA_DIR=./mock-data` must live on the
  `ufopuff-data` disk mounted at `/app/mock-data`. Before the first disk-backed
  deployment, back up the current container's `mock-data` privately and restore
  it to the new mount; mounting an empty disk does not migrate existing files.
- Zibal IPG uses server-only `ZIBAL_MERCHANT` at runtime and the callback origin from
  `APP_BASE_URL`; never derive payment callbacks from proxy/request hosts. Follow
  `https://help.zibal.ir/ipg/` (its linked OpenAPI schema includes result codes and badges).
  Only server verification with matching order/amount can approve payment. Payment logs
  must use allowlisted metadata; never log merchant values or raw provider responses.
- Footer trust badges use official clickable verification links in normal-flow wrappers.
  The mobile checkout bar is portaled outside the isolated checkout main, explicitly
  targets its form, measures bottom navigation height, and reserves footer clearance.
- OTP transport lives in `src/lib/otp-sms.ts`; both storefronts use the same route.
- Both login pages share `CustomerOtpLogin`. Verify phone before collecting profile;
  never update names from the OTP verification payload. Completion is defined in
  `src/lib/customer-onboarding.ts`; customer edits must not set pricing tiers.
- Read SMS credentials only from server environment variables. Local Melipayamak
  configuration is in gitignored `.env`; `.env.local` has higher precedence.
- Never log credentials, OTPs, or raw provider responses; never return real OTPs
  to clients. Keep HTTPS verification enabled and provider URLs fixed.
- See `MELIPAYAMAK.md` for setup, provider errors and existing storage limitations.
- Run focused OTP transport/auth tests and typecheck when changing authentication.

- Product-card rotation uses `useProductCardCarousel`. Keep each product's content/CTA
  atomic and preload protected derivatives only; preserve interaction, visibility and
  reduced-motion pauses. Run carousel unit/browser tests when changing this behavior.
- New Products uses one `HomepageProductDeck` provider and one `useProductCardCarousel`
  for every slot (four desktop columns / two mobile columns). Predecode the entire next
  page before any card exits; commit all content/images together, with no stagger.
  Keep shared hover/focus/touch/visibility pauses and manual-only reduced motion.
  There are no play/pause buttons. CSS phase duration comes from the shared hook.
- Product detail image changes use `ProductImageCrossfade`: retain the old frame until
  decode, overlap for 620ms, and coalesce rapid choices. Only one image is accessible.
  Matching gallery/choice sources must share the same protected URL. After the first frame
  loads, warm at most 12 protected detail images with two low-priority requests at a time;
  skip background warming for data saver/2G, and start it only while the page is visible.
  Reuse page-local pending/decoded requests and abort them when the gallery unmounts.

- Retail and B2B storefront headers start as rounded floating headers with viewport spacing and dock
  to the top after the user scrolls; keep both experiences behaviorally aligned and respect reduced motion.
- Storefront facet dropdowns are searchable custom controls with their own bounded scroll area. Search
  inputs inside auto-submit forms must not trigger catalog navigation while the user is typing.

- Product `card` and `detail` derivatives use portrait 3:4 canvases (600x800 / 1200x1600).
  Always contain the complete source without cropping or blurred side bands. Extend matching
  opaque studio corners; otherwise retain alpha so the theme supplies the backdrop. Bump both
  image versions when changing output; keep originals private.

- Root `tsconfig.json` intentionally maps `@ufo/*` directly to `packages/*/src/index.ts(x)` as a
  deployment-safe fallback. Keep this mapping when changing workspace/package resolution so Next builds
  still resolve shared packages even when the hosting installer does not materialize npm workspace links.

- Retail and B2B headers share `useHeaderDocked` (20px dock / 16px restore) and `.storefront-header` geometry. Keep the top margin and header height constant in document flow; CSS sticky consumes the top gap without moving the hero. Homepages use `header-overlay-home` to extend hero artwork to viewport top behind the frosted pill; its responsive offsets must match header row heights and safe-area padding. Keep hero content below the header. Do not clip header overflow: search suggestions must escape the rounded surface.
- Product cards, detail galleries and thumbnails use 3:4 frames and object-contain with no inset padding. Retail and B2B headers retain translucent glass backgrounds and backdrop blur in both floating and docked states.

- Shared `MediaFrame` in `@ufo/ui` reserves an explicit aspect ratio and defaults to
  `contain` for unprepared media. Opt into `cover` for decorative artwork; set its focal
  position explicitly. Product media explicitly uses ratio="3 / 4"; decorative hero backgrounds have their own framing.
- `MotionReveal` progressively enhances visible server markup with one viewport-entry
  animation. Use shared `--motion-*` tokens and respect reduced motion; do not use
  replaying scroll timelines for section entrances.
- Shared presentation tokens (`--ui-focus`, `--ui-accent`, `--ui-on-accent`, `--ui-media-bg`)
  default to Retail; `.b2b-shell` supplies light/green values. Keep palette overrides scoped.
- Use `ModalSurface` for storefront modal overlays: it reuses Radix focus containment,
  Escape handling and focus restoration. Closed overlays must not remain keyboard reachable.

- `ImageLightbox` shows only the existing protected derivative inside `ModalSurface`, with
  backdrop blur, Escape and focus restoration. Do not expose originals or add download links;
  context-menu/drag restrictions discourage casual saving but cannot prevent browser capture.
- Header width and radius ease together over 420ms only on dock-state changes; use a radius
  matching the actual pill height, not 999px, so curvature visibly interpolates. Reduced motion
  disables transitions, and block geometry must remain fixed.
- Shared product cards show `subtitle` (English name, LTR) below the Persian title and above
  status. Read-only variant summaries must label resistance with Ω, capacity with its actual
  value, and reserve color swatches for color data.
- Selectable product values remain in the existing `variantValueIds` / `variantImages` model.
  Store per-value admin state in optional `variantValueStates` and the preferred value in
  `defaultVariantValueId`; missing state is legacy-compatible active/available data. Public
  option helpers must omit inactive values, expose unavailable values as disabled, map exact
  quantities to semantic availability only, and resolve selection in this order: valid requested
  value, available configured default, first available value, then none. Disabling a value must
  preserve its image and metadata so it can be re-enabled. Cart/order validation must reject
  configured inactive, unavailable, invalid, or insufficient-stock selections.
- Products-list cards extend the existing CTA link across the card with a CSS pseudo-element;
  keep one navigation link and place independent cart controls above its click area. Never
  wrap cards containing buttons in an anchor. Search matches use text color only.
- Receiving accounts default to merchant-provided values in `payment-settings.ts`; preserve
  admin overrides and upgrade only untouched demo entries. Card-to-card approval belongs
  to the admin receipt-review flow, never chat messages or receipt upload alone.
- Order chat must authenticate the customer and verify order ownership/channel, or authenticate
  the admin. Receipts and chat attachments are private; fetch with session headers into blob
  URLs, never put tokens in URLs or expose storage keys through an unauthenticated downloader.
  JPG/PNG/WebP images are decoded/re-encoded; PDFs are served as downloads. Persistent storage
  for the order data directory must include `private-receipts` and `private-chat`.
- Site announcements are stored as `site-announcements.json` beside the order store on the
  persistent `mock-data` disk. Render active schedules server-side above storefront headers,
  preserve priority ordering, authenticate admin writes, and revalidate the root layout.
- Public storefronts and search APIs expose only `PublicAvailabilityState` via
  `getCatalogRowAvailability`; exact sellable quantities stay server/admin-only.
- Product `isActive` controls public visibility; optional `isAvailable` defaults to available for
  legacy records and independently controls parent-level purchasing. Use the shared domain
  purchasability helpers: a false parent availability overrides every option, while an available
  parent remains purchasable only when at least one configured variant value is available.
- Nicotine calculator business logic lives only in `src/lib/nicotine-guide.ts`. It uses daily
  cigarette count (1–100) and cigarette type coefficients (unknown/medium 0.7, light 0.4,
  heavy 1.0) and may return only the client-defined 20/25/35/50 mg strengths. UI and product
  recommendations must consume that pure calculation rather than reimplementing thresholds.
- Keep nicotine calculation and catalog selection separate. Device choice never changes the
  numeric result: Pod candidates are `salt-nicotine`, Vape candidates are `e-liquid`, and no
  Salt-to-Juice strength conversion may be inferred without an explicit business rule.
- Optional product-level `nicotineStrengthsMg` is the sole source for exact nicotine matching and
  is independent of flavor variants. Missing/empty metadata means unknown, never zero or a title-
  derived guess. Recommendations must first enforce public retail purchasability and exact family/
  strength eligibility, then deduplicate products and apply deterministic brand/flavor diversity.
- The homepage category carousel uses CSS 3D transforms with RTL keyboard, pointer/swipe and
  reduced-motion support. Keep it dependency-free and avoid persistent `will-change` layers.
- Admin order lists use `admin-order-query` summaries with server-side filtering, sorting and
  pagination. Do not return full chat, receipt, timeline or item snapshots to list views.
