# Security

## Implemented Foundations

- Secrets are read from environment variables and are not hardcoded.
- `.env*` is ignored except `.env.example`.
- Zod-based environment validation exists in `@ufo/config`.
- Persian/mobile validation exists in `@ufo/validation`.
- Server-side RBAC primitives exist in `@ufo/auth`.
- Storage upload route validates file presence and an 8MB size limit.
- Admin and B2B robots are noindex.
- Analytics adapter removes sensitive personal fields before tracking.

## Required Before Production Traffic

- Persist sessions in MongoDB with secure cookies.
- Add CSRF protection to mutating forms.
- Add rate limiting to OTP, login, upload and checkout.
- Enforce authorization inside every admin route handler/server action.
- Add file MIME allowlist and virus scanning policy.
- Add CSP headers in deployment config.
- Rotate any credential that was pasted into chat before public launch.
