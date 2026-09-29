import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getOrderStorePath } from "@ufo/orders";

export const announcementIcons = ["none", "info", "truck", "sparkles", "alert"] as const;
export const announcementStyles = ["neutral", "info", "success", "warning"] as const;

export type AnnouncementIcon = (typeof announcementIcons)[number];
export type AnnouncementStyle = (typeof announcementStyles)[number];

export interface SiteAnnouncement {
  id: string;
  enabled: boolean;
  text: string;
  icon: AnnouncementIcon;
  link?: string;
  startsAt?: string;
  endsAt?: string;
  priority: number;
  style: AnnouncementStyle;
}

function announcementsPath() {
  return join(dirname(getOrderStorePath()), "site-announcements.json");
}

function optionalDate(value: unknown, fieldLabel: string) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${fieldLabel} معتبر نیست.`);
  }
  return new Date(value).toISOString();
}

function optionalLink(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error("لینک اعلان معتبر نیست.");
  const link = value.trim();
  if (link.length > 500 || (!link.startsWith("/") && !/^https:\/\//i.test(link))) {
    throw new Error("لینک اعلان باید داخلی یا HTTPS باشد.");
  }
  return link;
}

export function validateSiteAnnouncements(value: unknown): SiteAnnouncement[] {
  if (!Array.isArray(value) || value.length > 12) {
    throw new Error("حداکثر ۱۲ اعلان قابل ذخیره است.");
  }
  const ids = new Set<string>();
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error("اطلاعات اعلان معتبر نیست.");
    const raw = entry as Record<string, unknown>;
    const id =
      typeof raw.id === "string" && /^[a-zA-Z0-9_-]{3,100}$/.test(raw.id)
        ? raw.id
        : `announcement_${crypto.randomUUID()}`;
    if (ids.has(id)) throw new Error("شناسه اعلان تکراری است.");
    ids.add(id);
    const text = typeof raw.text === "string" ? raw.text.trim() : "";
    if (!text || text.length > 240) {
      throw new Error(`متن اعلان ${index + 1} باید بین ۱ تا ۲۴۰ کاراکتر باشد.`);
    }
    const icon = announcementIcons.includes(raw.icon as AnnouncementIcon)
      ? (raw.icon as AnnouncementIcon)
      : "none";
    const style = announcementStyles.includes(raw.style as AnnouncementStyle)
      ? (raw.style as AnnouncementStyle)
      : "neutral";
    const priority = Number(raw.priority ?? 0);
    if (!Number.isSafeInteger(priority) || priority < -1000 || priority > 1000) {
      throw new Error("اولویت اعلان باید عددی بین ۱۰۰۰- تا ۱۰۰۰ باشد.");
    }
    const startsAt = optionalDate(raw.startsAt, "زمان شروع");
    const endsAt = optionalDate(raw.endsAt, "زمان پایان");
    const link = optionalLink(raw.link);
    if (startsAt && endsAt && startsAt >= endsAt) {
      throw new Error("زمان پایان اعلان باید بعد از زمان شروع باشد.");
    }
    return {
      id,
      enabled: raw.enabled === true,
      text,
      icon,
      priority,
      style,
      ...(link ? { link } : {}),
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
    };
  });
}

export function isAnnouncementActive(announcement: SiteAnnouncement, now = new Date()) {
  const timestamp = now.getTime();
  return (
    announcement.enabled &&
    (!announcement.startsAt || Date.parse(announcement.startsAt) <= timestamp) &&
    (!announcement.endsAt || Date.parse(announcement.endsAt) >= timestamp)
  );
}

export function sortSiteAnnouncements(announcements: SiteAnnouncement[]) {
  return announcements
    .slice()
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
}

export function listSiteAnnouncements(): SiteAnnouncement[] {
  const path = announcementsPath();
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { announcements?: unknown };
    return sortSiteAnnouncements(validateSiteAnnouncements(parsed.announcements ?? []));
  } catch {
    return [];
  }
}

export function listActiveSiteAnnouncements(now = new Date()) {
  return listSiteAnnouncements().filter((announcement) => isAnnouncementActive(announcement, now));
}

export function saveSiteAnnouncements(value: unknown): SiteAnnouncement[] {
  const announcements = sortSiteAnnouncements(validateSiteAnnouncements(value));
  const path = announcementsPath();
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    writeFileSync(
      temporary,
      `${JSON.stringify({ schemaVersion: 1, announcements }, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
    if (existsSync(path)) rmSync(path, { force: true });
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) rmSync(temporary, { force: true });
  }
  return announcements;
}
