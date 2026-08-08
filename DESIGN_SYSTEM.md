# Design System

## Tokens

Retail uses a dark product-focused palette. The canonical values live as CSS
variables in `src/app/globals.css` (`--retail-*`). Reuse the variables/utility
classes on the landing page, product page and checkout instead of hardcoding hex.

| Token | Variable | Value | Use |
| --- | --- | --- | --- |
| Background | `--retail-bg` | `#05070B` | Page background (near-black) |
| Surface | `--retail-surface` | `#0D1117` | Cards, panels, footer |
| Elevated | `--retail-surface-alt` | `#141A22` | Separated / hover surfaces |
| Border | `--retail-border` | `#22303D` | Hairlines, card borders |
| Text primary | `--retail-text-primary` | `#F5F7FA` | Headings, body |
| Text secondary | `--retail-text-secondary` | `#9BA7B4` | Supporting copy (AA on bg) |
| Accent (cyan) | `--retail-accent` | `#00D9FF` | Primary CTA, links |
| Accent 2 (emerald) | `--retail-accent-2` | `#20F28B` | Success, in-stock, highlights |

Cyan is the single primary accent for retail — do **not** introduce a new hue
(e.g. orange) without updating this table first, so the reference stays unified.

### Reusable utility classes (globals.css)

- `.section-surface` / `.section-surface-alt` — elevated section band that
  separates content from the near-black background.
- `.hairline` — border color bound to `--retail-border`.
- `.glow-accent` — soft cyan halo for the primary CTA on dark backgrounds.
- `.hero-overlay` / `.accent-halo` — atmospheric gradient overlays (kept dark
  enough for WCAG-AA text contrast).
- `.card-interactive` — lift + accent-edge hover for cards (honours
  `prefers-reduced-motion`).
- `.showcase-grid` — restrained grid texture for B2B/retail showcase bands.
- `.reveal-up`, `.reveal-up-delay-*`, `.float-slow` — reusable motion utilities
  for landing pages. They disable under `prefers-reduced-motion`.

Radius `--retail-radius` (`14px`) gives the premium retail feel; B2B uses a
tighter radius. B2B uses a brighter operational light palette (surface `#FFFFFF`,
accent blue `#2563EB`); Admin follows the B2B light theme as an internal tool.
Never mix retail and B2B color tokens in a shared component — pass the theme via
prop or a parent `.theme-*` class.

Marketing-facing B2B pages may use the dark retail showcase shell when the goal
is brand consistency with the main storefront. Keep B2B-specific information
dense and operational inside that shell: carton minimums, stock, quick order,
and account actions must remain scannable.

## Typography

`@fontsource/vazirmatn` is imported locally in every app. No external font service is required at render time.

## Components

`@ufo/ui` contains:

- `Button`, `IconButton`, `Input`, `Textarea`
- `Badge`, `Price`, `Alert`
- `Dialog`, `Tabs`, `Tooltip`
- `ProductCard`, `StockStatus`, `StatusPill`
- `Skeleton`, `EmptyState`, `ErrorState`

Components avoid business logic. Domain behavior lives in shared packages.

## Interaction Rules

- Touch targets are at least 44px.
- Focus states are visible.
- RTL is enabled at the document root.
- `prefers-reduced-motion` is respected.
