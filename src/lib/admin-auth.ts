import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const ADMIN_SESSION_COOKIE = "ufo_admin_session";

interface AdminCredentials {
  username: string;
  password: string;
}

function findWorkspaceRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "turbo.json"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

function parseDotEnv(value: string): Record<string, string> {
  return Object.fromEntries(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
      }),
  );
}

function readLocalEnv(): Record<string, string> {
  if (process.env.NODE_ENV === "production") return {};
  const envPath = join(findWorkspaceRoot(), ".env.local");
  if (!existsSync(envPath)) return {};
  return parseDotEnv(readFileSync(envPath, "utf8"));
}

export function getAdminCredentials(): AdminCredentials {
  const localEnv = readLocalEnv();
  const username = process.env.ADMIN_USERNAME ?? localEnv.ADMIN_USERNAME ?? "admin@ufopuff.local";
  const password = process.env.ADMIN_PASSWORD ?? localEnv.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD تنظیم نشده است.");
  return { username, password };
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const credentials = getAdminCredentials();
  return (
    username.trim().toLowerCase() === credentials.username.toLowerCase() &&
    password === credentials.password
  );
}
