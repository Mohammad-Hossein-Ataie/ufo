# ADR 0002: Dependency Choices

## Status

Accepted.

## Choices

- Next.js App Router for server components, metadata and route handlers.
- React 19 because the current patched Next release expects it.
- Zod for validation.
- MongoDB official driver for database access.
- AWS SDK S3 client for Liara Object Storage compatibility.
- Radix primitives for accessible dialogs, tabs and tooltips.
- TanStack Table for admin inventory tables.
- Vitest for unit/integration tests.
- Playwright for E2E tests.

## Notes

Next was upgraded to the current patched registry version during implementation after npm warned that the older pinned version had a CVE.
