# Testing

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run e2e
npm run build
```

## Current Coverage

- Unit: pricing, wholesale carton minimums, inventory reservation, phone/Persian normalization, OTP/RBAC.
- Integration: checkout quote/order/invoice and Tehran courier validation.
- E2E: retail home and catalog smoke test using installed Chrome channel.

## Notes

Playwright CDN download was blocked by regional 403 on this machine, so `playwright.config.ts` uses the locally installed Chrome channel.
