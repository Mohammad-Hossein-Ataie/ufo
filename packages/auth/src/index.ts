import type { UserRole } from "@ufo/types";
import { normalizeIranPhone } from "@ufo/validation";

export interface OtpChallenge {
  id: string;
  phone: string;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  createdAt: string;
}

export interface SessionClaims {
  userId: string;
  phone: string;
  roles: UserRole[];
  issuedAt: string;
  expiresAt: string;
}

export const rolePermissions: Record<UserRole, string[]> = {
  retail_customer: ["cart:write", "order:read:self", "review:create"],
  wholesale_customer: ["b2b:catalog:read", "b2b:order:create", "invoice:read:self"],
  support_agent: ["chat:read", "chat:write", "order:read"],
  content_editor: ["content:write", "seo:write"],
  inventory_manager: ["inventory:write", "product:read"],
  order_manager: ["order:write", "shipment:write"],
  finance_manager: ["payment:review", "invoice:write"],
  admin: ["admin:read", "admin:write"],
  super_admin: ["*"],
};

export function can(roleList: UserRole[], permission: string): boolean {
  return roleList.some(
    (role) => rolePermissions[role]?.includes("*") || rolePermissions[role]?.includes(permission),
  );
}

export function requirePermission(roleList: UserRole[], permission: string): void {
  if (!can(roleList, permission)) {
    throw new Error("شما به این عملیات دسترسی ندارید.");
  }
}

export function createOtpCode(seed: string, now = new Date()): string {
  const numeric = Array.from(`${seed}:${now.toISOString().slice(0, 16)}`).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return String(100000 + (numeric % 900000));
}

export async function hashToken(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createOtpChallenge(args: {
  phone: string;
  secret: string;
  now?: Date;
}): Promise<{ challenge: OtpChallenge; code: string }> {
  const nowDate = args.now ?? new Date();
  const phone = normalizeIranPhone(args.phone);
  const code = createOtpCode(`${phone}:${args.secret}`, nowDate);
  const expiresAt = new Date(nowDate.getTime() + 2 * 60 * 1000).toISOString();
  return {
    code,
    challenge: {
      id: `otp_${phone}_${nowDate.getTime()}`,
      phone,
      codeHash: await hashToken(`${code}:${args.secret}`),
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      createdAt: nowDate.toISOString(),
    },
  };
}

export async function verifyOtpChallenge(args: {
  challenge: OtpChallenge;
  code: string;
  secret: string;
  now?: Date;
}): Promise<OtpChallenge> {
  const nowDate = args.now ?? new Date();
  if (nowDate.toISOString() > args.challenge.expiresAt) {
    throw new Error("کد ورود منقضی شده است.");
  }
  if (args.challenge.attempts >= args.challenge.maxAttempts) {
    throw new Error("تعداد تلاش‌ها بیش از حد مجاز است.");
  }
  const expected = await hashToken(`${args.code}:${args.secret}`);
  if (expected !== args.challenge.codeHash) {
    return { ...args.challenge, attempts: args.challenge.attempts + 1 };
  }
  return args.challenge;
}

export function createSessionClaims(args: {
  userId: string;
  phone: string;
  roles: UserRole[];
  now?: Date;
}): SessionClaims {
  const nowDate = args.now ?? new Date();
  const expiresAt = new Date(nowDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    userId: args.userId,
    phone: normalizeIranPhone(args.phone),
    roles: args.roles,
    issuedAt: nowDate.toISOString(),
    expiresAt,
  };
}
