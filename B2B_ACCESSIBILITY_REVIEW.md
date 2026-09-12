# B2B accessibility and responsive review

This pass addresses accessibility defects and header crowding. It does not implement the requested commercial visual redesign, merchandising changes, or purchase-flow optimization. Existing visible copy, metadata, pricing, inventory, authentication, cart, and order logic are preserved.

## Findings and implementation

- Header navigation links contained nested buttons, creating invalid interactive nesting and duplicate keyboard targets. They now render as individual links with their existing destinations.
- The mobile navigation toggle lacked disclosure state. It now exposes `aria-expanded` and `aria-controls`; Escape closes the menu and returns keyboard focus to the trigger.
- Navigation now identifies the current page with `aria-current` on desktop and mobile.
- The intermediate-width header tried to fit desktop navigation, search, and multiple actions in one row. It now uses the disclosure menu below 1280px. Search retains its existing 768px breakpoint; all navigation destinations remain available through the menu.
- Header controls and the brand link reserve at least 44px touch targets. The logo link has one accessible name instead of repeated image and text announcements.
- The open menu has a viewport-bounded scroll area for shorter screens.
- The B2B search field has a persistent accessible name independent of its placeholder.
- The existing table now has a caption, scoped row/column headers, row descriptions for controls, and a focusable labelled scroll region. Its wide-table layout remains; keyboard users can scroll horizontally without moving the whole document.
- The B2B shell declares a light native control scheme and respects reduced-motion preferences throughout its subtree.
- Existing green primary controls were receiving cyan fills from shared button utilities. A B2B-scoped override uses `#176D48` with white text (approximately 6.33:1 contrast), including a darker hover state.

## Scope and remaining limitations

- Homepage/about compositions, imagery, product cards, filter architecture, brand assets, and copy were not redesigned. No new drawer, promotional process stepper, or merchandising system was introduced.
- The B2B shell has no footer in the existing implementation; none was added.
- The quick-order table continues to require horizontal scrolling on mobile, confined to the table region.
- Quick order uses static domain products/variants while the catalog reads admin-backed rows. This existing data-source difference was observed and not changed.
- Tests do not authenticate, modify quantities, submit orders, or validate payment/inventory behavior.
- Browser coverage is local Chrome. It does not establish full WCAG conformance, physical-device compatibility, or production Core Web Vitals.
- The preceding SEO work was a technical/indexation pass, not an optimized sales-copy rewrite.

## Changed files in this pass

- `src/components/b2b/b2b-header.tsx`
- `src/components/b2b/quick-order-client.tsx`
- `src/components/app-shell.tsx` (B2B scope class only)
- `src/components/smart-search.tsx` (wholesale accessible label only)
- `src/app/globals.css` (scoped B2B contrast, native control theme, active navigation, reduced motion)
- `tests/e2e/b2b-accessibility.spec.ts`
- `B2B_ACCESSIBILITY_REVIEW.md`

No packages or assets were added. Earlier retail header and B2B indexation changes remain in the workspace.

## Verification

`tests/e2e/b2b-accessibility.spec.ts` checks all four public B2B pages at 1440, 1280, 1024, 768, 430, 390, 375, and 360px. Checks cover one H1/main landmark, light native controls, header target dimensions, clipping, overlapping controls, document overflow, RTL, primary-control contrast, keyboard menu dismissal/focus restoration, table semantics/scrolling, and browser page errors.

Screenshots are saved under the gitignored `temp/b2b-accessibility/` directory. Desktop and mobile screenshots of all four pages were inspected. These are accessibility/layout previews, not completed redesign deliverables.

Commands:

- `npx playwright test tests/e2e/b2b-accessibility.spec.ts tests/e2e/b2b-indexation.spec.ts --workers=1`
- `npm run typecheck`
- `npm run lint`
- `npx eslint tests/e2e/b2b-accessibility.spec.ts`
- `npm run build`

Final results: 22 combined Playwright checks passed (11 accessibility/responsive checks and 11 indexation regressions). TypeScript, full application lint, test-file lint, and the production build passed. The responsive checks visited four pages at all eight requested widths and reported no document overflow, overlapping header controls, or browser page errors.
