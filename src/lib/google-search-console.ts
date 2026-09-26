import { createSign } from "node:crypto";

const tokenEndpoint = "https://oauth2.googleapis.com/token";
const searchConsoleScope = "https://www.googleapis.com/auth/webmasters.readonly";
const cacheDurationMs = 6 * 60 * 60 * 1_000;

export interface SearchConsoleMetricSet {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleRow extends SearchConsoleMetricSet {
  key: string;
}

export interface SearchConsoleReport {
  configured: boolean;
  siteUrl?: string;
  startDate: string;
  endDate: string;
  totals: SearchConsoleMetricSet;
  previousTotals: SearchConsoleMetricSet;
  daily: SearchConsoleRow[];
  queries: SearchConsoleRow[];
  pages: SearchConsoleRow[];
  opportunities: SearchConsoleRow[];
  fetchedAt?: string;
  error?: string;
}

interface ApiRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

interface ApiResponse {
  rows?: ApiRow[];
}

interface SearchConsoleConfiguration {
  siteUrl: string;
  clientEmail: string;
  privateKey: string;
}

const globalSearchConsole = globalThis as typeof globalThis & {
  __ufoSearchConsoleCache?: { expiresAt: number; report: SearchConsoleReport };
  __ufoGoogleAccessToken?: { expiresAt: number; token: string };
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateRange(days: number, offsetDays = 3) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - offsetDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function previousRange(startDate: string, days: number) {
  const end = new Date(`${startDate}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function configuration(): SearchConsoleConfiguration | undefined {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim();
  const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!siteUrl || !clientEmail || !privateKey) return undefined;
  return { siteUrl, clientEmail, privateKey };
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken(config: SearchConsoleConfiguration) {
  const cached = globalSearchConsole.__ufoGoogleAccessToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1_000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: config.clientEmail,
    scope: searchConsoleScope,
    aud: tokenEndpoint,
    iat: now,
    exp: now + 3_600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const signature = createSign("RSA-SHA256").update(unsignedToken).sign(config.privateKey);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  const result = (await response.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "دریافت دسترسی Search Console ناموفق بود.");
  globalSearchConsole.__ufoGoogleAccessToken = {
    token: result.access_token,
    expiresAt: Date.now() + Math.max(300, result.expires_in ?? 3_600) * 1_000,
  };
  return result.access_token;
}

async function query(
  config: SearchConsoleConfiguration,
  token: string,
  range: { startDate: string; endDate: string },
  dimensions: Array<"date" | "query" | "page"> = [],
  rowLimit = 1_000,
) {
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...range, dimensions, rowLimit, type: "web", dataState: "final" }),
      cache: "no-store",
    },
  );
  const result = (await response.json()) as ApiResponse & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "دریافت گزارش Search Console ناموفق بود.");
  return result.rows ?? [];
}

function metric(row?: ApiRow): SearchConsoleMetricSet {
  return {
    clicks: row?.clicks ?? 0,
    impressions: row?.impressions ?? 0,
    ctr: row?.ctr ?? 0,
    position: row?.position ?? 0,
  };
}

function rows(values: ApiRow[]): SearchConsoleRow[] {
  return values.map((row) => ({ key: row.keys?.[0] ?? "—", ...metric(row) }));
}

export function searchConsoleConfigured() {
  return Boolean(configuration());
}

export async function getSearchConsoleReport(periodDays = 28): Promise<SearchConsoleReport> {
  const currentRange = dateRange(periodDays);
  const empty: SearchConsoleReport = {
    configured: false,
    ...currentRange,
    totals: metric(),
    previousTotals: metric(),
    daily: [],
    queries: [],
    pages: [],
    opportunities: [],
  };
  const config = configuration();
  if (!config) return empty;
  const cached = globalSearchConsole.__ufoSearchConsoleCache;
  if (cached && cached.expiresAt > Date.now()) return cached.report;

  try {
    const token = await accessToken(config);
    const previous = previousRange(currentRange.startDate, periodDays);
    const [totalRows, previousRows, dailyRows, queryRows, pageRows] = await Promise.all([
      query(config, token, currentRange, [], 1),
      query(config, token, previous, [], 1),
      query(config, token, currentRange, ["date"], periodDays + 5),
      query(config, token, currentRange, ["query"], 500),
      query(config, token, currentRange, ["page"], 250),
    ]);
    const queries = rows(queryRows);
    const report: SearchConsoleReport = {
      configured: true,
      siteUrl: config.siteUrl,
      ...currentRange,
      totals: metric(totalRows[0]),
      previousTotals: metric(previousRows[0]),
      daily: rows(dailyRows),
      queries: queries.slice(0, 20),
      pages: rows(pageRows).slice(0, 20),
      opportunities: queries
        .filter((row) => row.impressions >= 20 && row.position >= 4 && row.position <= 20 && row.ctr < 0.03)
        .sort((left, right) => right.impressions - left.impressions)
        .slice(0, 10),
      fetchedAt: new Date().toISOString(),
    };
    globalSearchConsole.__ufoSearchConsoleCache = { report, expiresAt: Date.now() + cacheDurationMs };
    return report;
  } catch (error) {
    return {
      ...empty,
      configured: true,
      siteUrl: config.siteUrl,
      error: error instanceof Error ? error.message : "ارتباط با Search Console برقرار نشد.",
    };
  }
}
