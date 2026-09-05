# Product image protection

Product image uploads are stored with private object ACLs under:

- `storage/products/original/{assetId}` — immutable originals; never exposed or presigned.
- `storage/products/generated/{cacheId}-{card|detail}.webp` — private cached derivatives.

Public pages only use `/api/product-images/...`. The controller validates the requested product or
random asset identifier, reads the original on the server, applies orientation, exact square resize,
compression, WebP conversion, and a bottom-right `UFO Puff` watermark at 15% opacity. Generated
derivatives are cached with immutable response headers because asset IDs are immutable.

## Deployment requirements

1. Keep the object-storage bucket private. The application also writes originals and derivatives with
   a private ACL, but the bucket policy must not grant anonymous `GetObject` access to either product
   prefix.
2. Do not map `storage/products/original/` or `storage/products/generated/` to a CDN or static web
   directory. Cache the controller response at the reverse proxy/CDN instead.
3. Set `PRODUCT_IMAGE_SOURCE_HOSTS` only while migrating existing HTTPS image URLs. It must contain
   exact comma-separated hostnames, never wildcards, IP addresses, or user-controlled values.
4. Existing public originals should be migrated to the private prefix and removed from the public
   bucket after product records point to the new `/api/product-images/asset/.../detail` references.

The browser-side drag, context-menu, and selection controls deter casual copying. They cannot prevent
screenshots or a determined user from saving pixels that a browser is allowed to display; the private
original plus lower-resolution watermarked derivatives are the actual protection boundary.
