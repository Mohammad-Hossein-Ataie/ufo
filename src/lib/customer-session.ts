import { createHmac, timingSafeEqual } from "node:crypto";
import type { CustomerType, SalesChannel, UserRole } from "@ufo/types";

export interface CustomerSessionPayload {
  customerId: string;
  phone: string;
  customerType: CustomerType;
  roles: UserRole[];
  issuedAt: string;
  expiresAt: string;
}

interface RateLimitHit {
  allowed: boolean;
  retryAfterSeconds: number;
}

const globalState = globalThis as typeof globalThis & {
  __ufoCustomerRateLimits?: Map<string, number[]>;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? "development-session-secret-change-me";
  if (secret.length < 16) throw new Error("SESSION_SECRET باید حداقل ۱۶ کاراکتر باشد.");
  return secret;
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createCustomerSessionToken(
  payload: Omit<CustomerSessionPayload, "issuedAt" | "expiresAt">,
): string {
  const now = new Date();
  const session: CustomerSessionPayload = {
    ...payload,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const body = base64Url(JSON.stringify(session));
  return `${body}.${sign(body)}`;
}

export function verifyCustomerSessionToken(token: string | null): CustomerSessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as CustomerSessionPayload;
    if (new Date(payload.expiresAt).getTime() <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export function requireCustomerSession(
  request: Request,
  channel?: SalesChannel,
): CustomerSessionPayload {
  const session = verifyCustomerSessionToken(getBearerToken(request));
  if (!session) throw new Error("ورود معتبر نیست.");
  if (channel && session.customerType !== channel)
    throw new Error("دسترسی به این پلتفرم مجاز نیست.");
  return session;
}

export function checkRateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitHit {
  const now = Date.now();
  const buckets = (globalState.__ufoCustomerRateLimits ??= new Map<string, number[]>());
  const hits = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }
  buckets.set(key, [...hits, now]);
  return { allowed: true, retryAfterSeconds: 0 };
}
