# ADR 0003: Single Next App With Subdirectories

## Status

Accepted.

## Context

Retail, wholesale and admin should feel like separate platforms, but the project should deploy as one Next.js service. SEO should keep retail and B2B authority on one domain.

## Decision

Use one root-level Next.js app:

- `/` for retail
- `/b2b` for wholesale
- `/admin` for admin

Shared business logic stays in `packages/*`.

## Consequences

- `npm run dev` starts the whole product on one port.
- Liara deployment uses one Node app.
- B2B uses a subdirectory instead of a separate subdomain.
- Admin protection must be scoped to `/admin` and `/api/admin` only.
