import { z } from "zod";
import type { StoreSettings } from "@ufo/types";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  B2B_BASE_URL: z.string().url().default("http://localhost:3000/b2b"),
  ADMIN_BASE_URL: z.string().url().default("http://localhost:3000/admin"),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB_NAME: z.string().min(1).default("my-app"),
  LIARA_ENDPOINT: optionalUrl.default(""),
  LIARA_BUCKET_NAME: z.string().optional(),
  LIARA_ACCESS_KEY: z.string().optional(),
  LIARA_SECRET_KEY: z.string().optional(),
  LIARA_PUBLIC_BASE_URL: optionalUrl.default(""),
  SESSION_SECRET: z.string().min(16).optional(),
  OTP_SECRET: z.string().min(16).optional(),
  SUPER_ADMIN_PHONE: z.string().optional(),
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_PHONE: z.string().optional(),
  SMS_PROVIDER: z.enum(["mock", "liara", "manual"]).default("mock"),
  PAYMENT_PROVIDER: z.enum(["manual", "mock"]).default("manual"),
  SHIPPING_PROVIDER: z.enum(["mock", "tipax"]).default("mock"),
  CHAT_PROVIDER: z.enum(["mock"]).default("mock"),
  STORAGE_PROVIDER: z.enum(["mock", "liara"]).default("mock"),
  SEARCH_PROVIDER: z.enum(["memory", "database"]).default("memory"),
  ANALYTICS_PROVIDER: z.enum(["mock"]).default("mock"),
  STORE_OWNER_NAME: z.string().default("امیر محمودی"),
  STORE_PHONE: z.string().default("09362157181"),
  STORE_ADDRESS: z.string().default("تهران، بازار مولوی، پاساژ صفویه"),
  STORE_TELEGRAM: z.string().url().default("https://t.me/vapeufostoree"),
});

export type RuntimeEnv = z.infer<typeof envSchema>;

export function getRuntimeEnv(env: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  return envSchema.parse(env);
}

export const defaultStoreSettings: StoreSettings = {
  id: "store",
  brandName: "UFO Puff",
  ownerName: "امیر محمودی",
  phone: "09362157181",
  address: "تهران، بازار مولوی، پاساژ صفویه",
  telegramUrl: "https://t.me/vapeufostoree",
  workingHours: "شنبه تا پنجشنبه، ۱۰ تا ۲۰",
  legalNotice:
    "فروش فقط برای افراد بالای ۱۸ سال انجام می‌شود. محصولات دخانی و نیکوتین‌دار برای ترک یا درمان توصیه نمی‌شوند.",
};

export const appHosts = {
  retail: "ufopuff.com",
  b2b: "ufopuff.com",
  admin: "ufopuff.com",
} as const;

export const appPaths = {
  retail: "/",
  b2b: "/b2b",
  admin: "/admin",
} as const;

export const localPorts = {
  retail: 3000,
  b2b: 3000,
  admin: 3000,
} as const;
