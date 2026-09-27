# Melipayamak OTP

Official references reviewed 2026-09-27:

- https://www.melipayamak.com/api/sendbybasenumber2/
- https://www.melipayamak.com/blog/posts/sms-with-pattern-mode/

Both storefronts use `/api/auth/send-otp`. The server generates a random six-digit
code, sends it through the shared service-line pattern, and persists its hash
only after the provider accepts the message. Verification expires after two
minutes with at most five attempts. Neither real nor mock OTP codes, provider
credentials, or raw provider responses are returned to clients or logged.
Provider acceptance does not prove handset delivery.

## Register the pattern before enabling OTP

In the Melipayamak panel, create a service web-service pattern with exactly
one variable (`{0}`) and request approval. Suggested text:

```text
یوفوپاف
کد ورود: {0}
اعتبار: ۲ دقیقه
ufopuff.com
```

The brand is at the start so recipients recognize the sender, and the website
domain is at the end as requested by the provider's pattern guide. The API
supplies only the six-digit code as `text`; the approved panel pattern supplies
the rest of the SMS. Do not put this full text in the API `text` field. The
pattern's approved numeric `bodyId` must be configured before real delivery.
As of 2026-09-27, no approved `bodyId` has been provided, so live OTP delivery
has **not** been verified. Do not switch to an advertising sender as a fallback.

## Configuration

Set these server-only variables locally in the gitignored `.env` or `.env.local`
and in Liara's application environment after approval. `.env.local` takes
precedence over `.env`. Do not use `NEXT_PUBLIC_` prefixes or reuse the website
admin credentials for the SMS panel.

- `SMS_PROVIDER=melipayamak`
- `MELIPAYAMAK_USERNAME`: Melipayamak panel username.
- `MELIPAYAMAK_API_KEY`: API key from panel Settings; required for OTP. The
  panel password is **not** used as a fallback for this flow.
- `MELIPAYAMAK_BODY_ID`: approved numeric pattern ID; required for OTP.
- `MELIPAYAMAK_OTP_MODE=pattern`: optional, but if set, must be `pattern`.
- `OTP_SECRET`: random server secret of at least 16 characters.

`MELIPAYAMAK_PASSWORD` and `MELIPAYAMAK_FROM` may still be needed by other SMS
flows such as order notifications, but they are **not** used for OTP. Website
admin login uses `ADMIN_USERNAME` and `ADMIN_PASSWORD` separately.

OTP uses an HTTPS POST to the fixed `SendByBaseNumber2` endpoint with form
fields `username`, `password` (the API key), `text` (the code), `to`, and
`bodyId`. Credentials and the code are never put in the URL. TLS verification
stays enabled; redirects are forbidden; timeout is ten seconds. There is no
automatic retry or mock/advertising fallback after a real delivery failure.
The provider documents `-110` as requiring an API key, `-4`/`-5` as
pattern-related failures, and `-109`/`-111` as IP-access failures.

## Customer onboarding

Both `/login` and `/b2b/login` use `CustomerOtpLogin`: phone, code, then profile
only when required. Verification ignores any client-supplied name/profile
fields; it finds or creates the customer using the verified phone and sales
channel. `POST /api/auth/verify-otp` returns `needsProfileCompletion` alongside
the session. Completion requires first and last name, plus companyName for
wholesale. The authenticated `PATCH /api/customer/profile` updates these
fields and returns the completion flag. Returning complete customers skip the
profile step. Customer-controlled profile updates cannot assign pricingGroup
or customerLevel. Names are not requested and account existence is not
disclosed before OTP verification. The UI normalizes Persian/Arabic digits,
supports changing phone and resending after a 60-second cooldown, and
restricts the next URL to the same sales platform.

## Current operational limits

OTP challenges remain in the existing file store and rate limits in process
memory. Concurrent verification of one challenge is rejected within the same
process. Use a shared persistent store and atomic consume/attempt counters
before running multiple application workers. This transport change does not
migrate that storage. `SMS_PROVIDER=mock` is supported only outside production
for tests; it does not expose the generated code to the browser.
