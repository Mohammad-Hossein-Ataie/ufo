// Calendar arithmetic uses Gregorian day keys; presentation uses the native Persian calendar.
const dayMs = 86_400_000;
const persian = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});
export function tehranDayKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function shiftDay(key: string, days: number): string {
  return new Date(Date.parse(`${key}T12:00:00Z`) + days * dayMs).toISOString().slice(0, 10);
}
export function jalaliParts(key: string) {
  const parts = persian.formatToParts(new Date(`${key}T12:00:00Z`));
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}
export function jalaliMonth(key: string) {
  const start = shiftDay(key, 1 - jalaliParts(key).day);
  const month = jalaliParts(start).month;
  const days: string[] = [];
  for (let i = 0; i < 31; i++) {
    const day = shiftDay(start, i);
    if (jalaliParts(day).month !== month) break;
    days.push(day);
  }
  return {
    start,
    days,
    offset: (new Date(`${start}T12:00:00Z`).getUTCDay() + 1) % 7,
    previous: shiftDay(start, -1),
    next: shiftDay(start, days.length),
  };
}
export function formatJalaliDay(
  key: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" },
) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { ...options, timeZone: "UTC" }).format(
    new Date(`${key}T12:00:00Z`),
  );
}
export function tehranDateTimeToIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("تاریخ و ساعت ارسال را کامل انتخاب کنید.");
  const result = new Date(`${value}:00+03:30`);
  if (!Number.isFinite(result.getTime()) || tehranDayKey(result) !== value.slice(0, 10))
    throw new Error("تاریخ ارسال معتبر نیست.");
  return result.toISOString();
}
