export type JalaliDateParts = { year: number; month: number; day: number };
export type GregorianDateParts = { year: number; month: number; day: number };

const TEHRAN_TIME_ZONE = "Asia/Tehran";
const persianPartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  timeZone: TEHRAN_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});
const gregorianPartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  timeZone: TEHRAN_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});
const conversionCache = new Map<string, GregorianDateParts | null>();

function numericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  return Number(parts.find((part) => part.type === type)?.value ?? 0);
}

export function getJalaliDateParts(date: Date): JalaliDateParts {
  const parts = persianPartsFormatter.formatToParts(date);
  return {
    year: numericPart(parts, "year"),
    month: numericPart(parts, "month"),
    day: numericPart(parts, "day"),
  };
}

function getGregorianDateTimeParts(date: Date) {
  const parts = gregorianPartsFormatter.formatToParts(date);
  return {
    year: numericPart(parts, "year"),
    month: numericPart(parts, "month"),
    day: numericPart(parts, "day"),
    hour: numericPart(parts, "hour"),
    minute: numericPart(parts, "minute"),
    second: numericPart(parts, "second"),
  };
}

export function findGregorianDate(jalali: JalaliDateParts): GregorianDateParts | undefined {
  const key = `${jalali.year}-${jalali.month}-${jalali.day}`;
  if (conversionCache.has(key)) return conversionCache.get(key) ?? undefined;

  const start = Date.UTC(jalali.year + 620, 1, 15, 12);
  const end = Date.UTC(jalali.year + 622, 3, 15, 12);
  for (let timestamp = start; timestamp <= end; timestamp += 86_400_000) {
    const candidate = new Date(timestamp);
    const parts = getJalaliDateParts(candidate);
    if (parts.year === jalali.year && parts.month === jalali.month && parts.day === jalali.day) {
      const result = getGregorianDateTimeParts(candidate);
      const date = { year: result.year, month: result.month, day: result.day };
      conversionCache.set(key, date);
      return date;
    }
  }
  conversionCache.set(key, null);
  return undefined;
}

export function jalaliMonthLength(year: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  return findGregorianDate({ year, month: 12, day: 30 }) ? 30 : 29;
}

export function tehranDateTimeToIso(jalali: JalaliDateParts, hour: number, minute: number): string | undefined {
  const gregorian = findGregorianDate(jalali);
  if (!gregorian) return undefined;

  const intended = Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, hour, minute, 0);
  let timestamp = intended;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getGregorianDateTimeParts(new Date(timestamp));
    const represented = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const delta = intended - represented;
    timestamp += delta;
    if (delta === 0) break;
  }
  return new Date(timestamp).toISOString();
}

export function jalaliDateTimeFromIso(value?: string): (JalaliDateParts & { hour: number; minute: number }) | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const jalali = getJalaliDateParts(date);
  const time = getGregorianDateTimeParts(date);
  return { ...jalali, hour: time.hour, minute: time.minute };
}

export function jalaliWeekdayIndex(jalali: JalaliDateParts): number {
  const gregorian = findGregorianDate(jalali);
  if (!gregorian) return 0;
  const weekday = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 12)).getUTCDay();
  return (weekday + 1) % 7;
}
