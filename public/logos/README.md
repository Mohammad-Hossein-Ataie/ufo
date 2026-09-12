# UFO Puff header branding

- `ufo-puff-logo.webp`: 232 × 48 horizontal lockup. Custom outlined lettering; no font dependency. Use on dark surfaces.
- `ufo-puff-logo.webp`: 40 × 40 standalone saucer with heavier strokes and fewer details, selected below 1024px by `BrandLogo`.
- `ufo-puff-symbol.svg`: 64 × 64 favicon source, with a dark rounded tile and solid cyan shapes. No lettering or smoke. Use this file for external favicon conversion.

Palette: cyan `#63E6FF`, off-white `#F5F7FA`, near-black `#05070B`. Artwork uses local SVG paths, without filters, scripts, external resources, or raster images.

The original `logo.png` remains available for existing non-header uses. Wholesale and admin retain their separate header designs.

## Favicon handoff

The existing generated files and metadata references are unchanged. When converting the new source, replace the contents of these exact paths in `public/favicons/`:

- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180 × 180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

Keep `site.webmanifest` and all filenames intact. The browser tab continues to use the existing artwork until these generated files are replaced.

## Header verification

Run `npx playwright test tests/e2e/header-branding.spec.ts --workers=1`. This uses installed Chrome via the project's Playwright configuration. Screenshots are written to the gitignored `temp/header-branding/` folder. Coverage includes the requested seven widths, 768px and 1023px tablet cases, asset selection, dimensions, control overlap, RTL, focus indication, search/navigation, sticky filter clearance, and mobile menu/cart controls.
