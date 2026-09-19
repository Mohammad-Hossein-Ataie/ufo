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

- Retail and B2B storefront headers start as rounded floating headers with viewport spacing and dock
  to the top after the user scrolls; keep both experiences behaviorally aligned and respect reduced motion.
- Storefront facet dropdowns are searchable custom controls with their own bounded scroll area. Search
  inputs inside auto-submit forms must not trigger catalog navigation while the user is typing.

- Product `card` and `detail` derivatives both preserve the full source artwork over a defocused
  square fill; bump the corresponding image version when changing derivative output so immutable
  browser/storage caches are invalidated.

- Root `tsconfig.json` intentionally maps `@ufo/*` directly to `packages/*/src/index.ts(x)` as a
  deployment-safe fallback. Keep this mapping when changing workspace/package resolution so Next builds
  still resolve shared packages even when the hosting installer does not materialize npm workspace links.

- Retail and B2B headers share `useHeaderDocked` (20px dock / 16px restore) and `.storefront-header` geometry. Keep the top margin and header height constant in document flow; CSS sticky consumes the top gap without moving the hero. Homepages use `header-overlay-home` to extend hero artwork to viewport top behind the frosted pill; its responsive offsets must match header row heights and safe-area padding. Keep hero content below the header. Do not clip header overflow: search suggestions must escape the rounded surface.
- Product detail gallery thumbnails should use the dark gallery treatment (no white tile frame); if aspect ratios do not match, preserve the full product image and use a subtle blurred fill behind it instead of letterboxing on white.
