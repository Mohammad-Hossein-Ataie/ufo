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
