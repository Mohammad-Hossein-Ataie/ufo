# Production origin and session security

## Findings and changes

The upload and both shipping-method mutation routes compared the browser Origin to
`new URL(request.url).origin`. An internal HTTP container URL therefore rejects a
legitimate browser request from `https://ufopuff.com`. This code path is confirmed;
the actual reverse-proxy headers in the deployed container were not accessible.

`src/lib/request-origin.ts` now resolves the target origin in this order:

1. Explicit `APP_BASE_URL`, normalized to its HTTP(S) origin.
2. With `TRUST_PROXY_HEADERS=true` only: a single `x-forwarded-proto` and
   `x-forwarded-host` (or `host`); without forwarded headers, Host and request protocol.
3. Request URL origin when no configured/trusted origin is available.

An invalid configured URL fails closed. Forwarded headers are ignored by default.
Malformed or comma-separated trusted headers are rejected. A configured public URL
takes precedence over every client-supplied header. Source Origin must match exactly
after URL normalization, including scheme and effective port. If Origin is absent,
a same-origin Referer is required; `Origin: null`, invalid Origin, and requests with
neither header are rejected. There is no suffix matching or wildcard allowance.

`src/proxy.ts` already required a signed admin session for private admin pages/APIs.
It now also checks the origin for every unsafe admin API method, including login
and logout. Upload and shipping mutations additionally verify the signed admin
cookie inside their handlers. These handlers return 401 for missing/invalid sessions
and 403 for rejected origins before reading payloads or changing storage.
GET/HEAD/OPTIONS retain their existing authentication behavior.

Existing HttpOnly, SameSite=Lax and production Secure cookies are preserved.
Admin and customer signing now share a production secret policy: missing, short
(less than 32 non-padding characters), and known development/example placeholders
are rejected. The old audience-specific fallbacks remain available in development
and test. `src/instrumentation.ts` validates security configuration when Next
initializes the server. Because Next can initialize instrumentation lazily,
`npm run start` also validates the production secret before opening the port.

No custom NODE_ENV assignment was found in tracked deployment configuration.
`development` is a standard value, but inappropriate for a production server; the
reported non-standard value must be checked in the deployment dashboard/container.
The npm dev/build/start commands now set development/production/production before
loading Next.js, so inherited stage names cannot change Next/React behavior.
Use a separate variable such as DEPLOYMENT_ENV for staging labels.

## Deployment

Set these **runtime** environment variables in Liara/the container deployment:

```ini
NODE_ENV=production
APP_BASE_URL=https://ufopuff.com
B2B_BASE_URL=https://ufopuff.com/b2b
ADMIN_BASE_URL=https://ufopuff.com/admin
TRUST_PROXY_HEADERS=false
ORIGIN_DEBUG=false
```

Set `SESSION_SECRET` privately to a cryptographically random value of at least 32
characters (for example, 32 random bytes encoded as hex). Never use the example
placeholder. Use the same secret on all replicas. Changing it invalidates existing
admin and customer sessions; everyone must sign in again. No database migration is
required. Rotate credentials disclosed in shared prompts/logs, including the admin
password and database credential, through their respective providers.

Do not copy local development URLs into production or change `.env.local` as a
deployment mechanism. `.liaraignore` already excludes local env files. The tracked
`liara.json` uses the Node platform, `npm ci && npm run build`, then `npm run start`
on port 3000. No Dockerfile, Compose file, or reverse-proxy configuration is tracked.
Keep production secrets out of image layers; inject them at runtime. If using a
custom Docker entrypoint, set NODE_ENV=production and use `npm run start`.

No Express-style `trust proxy` switch, CORS relaxation, Next header override, or
Server Actions allowed-origins setting is needed for these Route Handlers. The
canonical APP_BASE_URL is sufficient behind TLS termination.

Only enable TRUST_PROXY_HEADERS when APP_BASE_URL is unavailable and the backend
can be reached exclusively through a trusted ingress. That ingress must validate
the public Host and overwrite forwarded headers, rather than passing through or
appending client values. For example, inside an HTTPS nginx server block accepting
only `ufopuff.com`:

```nginx
location / {
    client_max_body_size 9m;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://private_next_backend:3000;
}
```

Reject unknown virtual hosts and restrict direct backend access. For a multi-proxy
deployment, configure the final trusted hop to provide one validated public host
and protocol. Do not enable header trust merely to suppress a 403.

The Origin fix does not configure persistent object storage. If production still
uses STORAGE_PROVIDER=mock, configure STORAGE_PROVIDER=liara and real storage keys
privately for persistence; existing image validation and private originals remain.

## Diagnostics

Temporarily set ORIGIN_DEBUG=true, restart, and reproduce one request. The
`request-origin` log includes sanitized origin, host, forwardedHost, forwardedProto,
canonicalOrigin and accepted. Invalid header values become `[invalid]`; URL paths,
query strings, Referer, cookies, session tokens, credentials and upload bodies are
not logged. Handler and proxy validation can produce two entries for one request.
Disable the flag after diagnosis. APP_BASE_URL remaining localhost in production
will intentionally continue to reject ufopuff.com until configuration is corrected.

## Verification

Completed locally: all 76 tests in the eight focused suites passed, TypeScript and
ESLint passed, the production build succeeded, and the real production-server smoke
script passed both invalid-secret startup cases, secure login, image upload and
negative authentication/origin cases. The build does not require deployment secrets.

Run the focused security/auth regression suite:

```powershell
npx vitest run tests/unit/request-origin.test.ts tests/unit/session-security.test.ts tests/unit/admin-origin-routes.test.ts tests/unit/admin-session.test.ts tests/unit/otp-sms.test.ts tests/unit/send-otp-route.test.ts tests/unit/customer-otp-flow.test.ts tests/unit/auth.test.ts
npm run typecheck
npm run lint
npm run build
node scripts/verify-production-security.mjs
```

The smoke script starts the built application on loopback port 3105, uses ephemeral
credentials and mock storage, checks missing/short-secret startup failures,
normalizes an inherited staging NODE_ENV, signs in over an internal HTTP URL with
the public HTTPS Origin, checks secure cookie attributes, and uploads an actual PNG.
It also rejects unauthenticated, cross-origin, null-origin and forged-proxy requests.
It stops its server and does not contact the production application or database.

For normal local development, use APP_BASE_URL=http://localhost:3000, run npm run
dev, log in, and upload through that same hostname (127.0.0.1 is a different origin).
For scripted mutations, send a matching Origin or Referer and a valid admin cookie.

After deploying the new image and environment, sign in at
https://ufopuff.com/admin/login and upload a small valid image. In DevTools Network,
expect upload 200 and a protected `/api/product-images/` URL. Confirm unauthenticated
upload returns 401, authenticated cross-origin requests return 403, shipping updates
work, and logs resolve canonicalOrigin to https://ufopuff.com. Verify no non-standard
NODE_ENV warning remains. Run negative secret-startup tests only on a staging
replica, never by removing the secret from the live service. Actual public
deployment and production verification remain operator steps.

## Changed files

- `.env.example`, `package.json`, `scripts/next-command.mjs`
- `packages/config/src/index.ts`, `packages/config/src/session-security.ts`
- `src/instrumentation.ts`, `src/proxy.ts`
- `src/lib/request-origin.ts`, `src/lib/admin-request.ts`
- `src/lib/admin-session.ts`, `src/lib/customer-session.ts`
- `src/app/api/admin/storage/upload/route.ts`
- `src/app/api/admin/shipping-methods/route.ts`
- `src/app/api/admin/shipping-methods/[methodId]/route.ts`
- `tests/unit/request-origin.test.ts`, `tests/unit/session-security.test.ts`
- `tests/unit/admin-origin-routes.test.ts`, `scripts/verify-production-security.mjs`
- `PRODUCTION_SECURITY.md`

Pre-existing product-card carousel edits were left intact.

## References

- [OWASP CSRF prevention: verify source and target origins](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Next.js self-hosting and reverse proxies](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js non-standard NODE_ENV warning](https://nextjs.org/docs/messages/non-standard-node-env)
- [Next.js instrumentation startup hook](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
