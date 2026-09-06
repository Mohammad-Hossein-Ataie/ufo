# Product card autoplay

The existing server-rendered card contents remain intact. `HomepageProductSlot` uses the reusable `useProductCardCarousel` hook to switch the entire card atomically, including its actual `AddToCartButton` variant and detail links. Catalog selection and cart business logic are unchanged.

## Behavior

- Two or three items rotate every 4500ms and loop. One-item slots have no autoplay or speculative image preload.
- Each mounted slot owns its state and timer. The first rotation is staggered by `slotIndex * 400ms`; manual interaction and resume reset the timer. A committed manual selection receives a fresh 4500ms interval, and a slow pending manual selection cannot be superseded by autoplay.
- Complete outgoing content fades and moves 6px horizontally for 200ms; the decoded incoming card enters from the opposite side for 200ms. Both stages use `cubic-bezier(0.4, 0, 0.2, 1)`. RTL reverses movement.
- Mouse hover, focus anywhere in the card, and touch independently pause playback. Leaving one interaction does not clear another pause reason. A small pause/resume control also allows persistent user control.
- Initial hover and focus are also read when the hook mounts, so interaction that starts before hydration still pauses the first rotation.
- Hidden documents and cards outside the viewport plus a 100px margin have no autoplay timer. Visible cards resume from the same product with a fresh timer.
- Reduced motion disables autoplay and makes manual changes immediate.
- Indicators are 44px semantic buttons with item position/name and `aria-pressed`. Keyboard arrows respect computed direction; Home/End select the endpoints. Focus remains on the selected control.
- Native pointer gestures use a 48px horizontal threshold and horizontal/vertical dominance check. Vertical gestures remain browser scrolling; `touch-action` permits vertical pan and pinch zoom. RTL rightward swipes advance. Successful swipes suppress the trailing pointer click to avoid accidental purchases/navigation.

## Images and correctness

`product-carousel-image.ts` prepares the next protected card derivative and decodes it before transition. A failed or timed-out derivative uses the existing category fallback. If both fail, the current complete card stays visible and a later request can retry. A small per-slot promise cache avoids repeat preparation; no originals or alternative image hosts are introduced.

The prepared source and active index commit in one state update. `StorefrontProductImageSource` supplies an already-decoded fallback when needed, preventing the incoming card from retrying a known-broken image first. Operation IDs discard stale slow-image completions and superseded indicator requests. Abort signals and effect cleanup handle unmount/route changes. State updates remain within the slot, with no list-wide carousel state or new dependency.

## Validation

- Final hover-hydration fix: 30 focused unit tests passed, along with the real-browser long-hover/focus/RTL keyboard test. TypeScript, ESLint, production build and `git diff --check` passed. Browser verification was run separately from the build after a concurrent run exhausted its overall timeout.
- Unit tests cover 1/2/3 items, exact timing, loop, deterministic stagger, reset, combined pauses, hidden tabs, offscreen cards, reduced motion, slow/error images, stale requests, rapid selection, cancellation and cleanup.
- Image preparation tests cover derivative decode, fallback decode, timeout, abort and cleanup.
- Browser tests use the real catalog: autoplay and manual cart/price/link/image consistency in an isolated guest session; long hover, focus and RTL keyboard controls; small/vertical/horizontal touch gestures and rapid indicator changes. Existing discovery checks verify stable heights across all available slot items, mobile/desktop layouts, filters and protected detail images.

## Files for this follow-up

- `src/hooks/use-product-card-carousel.ts`
- `src/lib/product-carousel-image.ts`
- `src/components/homepage-product-slot.tsx`
- `src/components/homepage-products.tsx`
- `src/components/storefront-product-image.tsx`
- `src/app/globals.css`
- `tests/unit/product-card-carousel.test.ts`
- `tests/unit/product-carousel-image.test.ts`
- `tests/e2e/product-card-carousel.spec.ts`
- `tests/e2e/storefront-discovery.spec.ts`
- `AGENTS.md`, `STOREFRONT_REFINEMENT.md`, `PRODUCT_CARD_CAROUSEL.md`
