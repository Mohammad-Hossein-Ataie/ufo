# Design System

## Tokens

Retail uses a dark product-focused palette:

- Background `#05070B`
- Surface `#0D1117`
- Elevated `#141A22`
- Cyan `#00D9FF`
- Emerald `#20F28B`
- Border `#22303D`

B2B uses a brighter operational palette with green and gold accents. Admin uses neutral productivity colors with blue status accents.

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
