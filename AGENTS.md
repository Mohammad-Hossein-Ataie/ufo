# Project Conventions

- One Next.js app in `src`; shared TypeScript packages in `packages/*`.
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
