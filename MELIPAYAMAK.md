# Melipayamak OTP

Official references reviewed 2026-09-05:

- https://www.melipayamak.com/api/sendotp/
- https://www.melipayamak.com/api/sendbybasenumber/
- https://github.com/Melipayamak/melipayamak-node/blob/master/src/sms/rest.js

Both storefronts use `/api/auth/send-otp`. The server generates a random six-digit
code, sends it over HTTPS, and persists its hash only after the provider accepts
the message. Verification expires after two minutes with at most five attempts.
Real codes and provider credentials are never included in the HTTP response.
Provider acceptance does not prove handset delivery.

## Configuration

Local SMS credentials are in the gitignored `.env`. Next.js loads `.env.local`
before `.env`; do not duplicate SMS settings there. Deployment uses host env vars.
All names below are server-only (never use NEXT_PUBLIC prefixes).

- `SMS_PROVIDER=melipayamak`
- `MELIPAYAMAK_USERNAME`: panel username.
- `MELIPAYAMAK_PASSWORD`: panel password.
- `MELIPAYAMAK_API_KEY`: optional; takes precedence over password. Required by
  accounts returning -110. Configure allowed server IPs for -109/-111.
- `MELIPAYAMAK_OTP_MODE=otp`: calls REST SendOtp; requires `MELIPAYAMAK_FROM`,
  a sender line assigned to the panel. Username/password alone are insufficient.
- `MELIPAYAMAK_OTP_MODE=pattern`: calls REST BaseServiceNumber; requires
  `MELIPAYAMAK_BODY_ID`, an approved pattern with exactly one variable (the code).
  Shared service patterns support recipients blocking advertising SMS.
- `OTP_SECRET`: random server secret of at least 16 characters.

POST form fields are username, password, to and either from/code or bodyId/text.
The fixed base URL is https://rest.payamak-panel.com/api/SendSMS/.
TLS verification stays enabled; redirects are forbidden; timeout is ten seconds.
There is no automatic retry or mock fallback after a real delivery failure.

The local API key and sender have been configured in `.env`. A read-only
GetUserNumbers call authenticated successfully and returned the assigned sender.
No live OTP message has been sent or handset delivery verified.

## Customer onboarding

Both `/login` and `/b2b/login` use `CustomerOtpLogin`: phone, code, then profile
only when required. Verification ignores any client-supplied name/profile fields;
it finds or creates the customer using the verified phone and sales channel.
`POST /api/auth/verify-otp` returns `needsProfileCompletion` alongside the session.
Completion requires first and last name, plus companyName for wholesale.
The authenticated `PATCH /api/customer/profile` updates these fields and returns
the completion flag. Returning complete customers skip the profile step.
Customer-controlled profile updates cannot assign pricingGroup or customerLevel.
Names are not requested and account existence is not disclosed before OTP verification.
The UI normalizes Persian/Arabic digits, supports changing phone and resending
after a 60-second cooldown, and restricts the next URL to the same sales platform.

## Current operational limits

OTP challenges remain in the existing file store and rate limits in process memory.
Concurrent verification of one challenge is rejected within the same process.
Use a shared persistent store and atomic consume/attempt counters before running
multiple application workers. This transport change does not migrate that storage.
`SMS_PROVIDER=mock` is supported only outside production, explicitly for tests.
