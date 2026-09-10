export function parseLocation(value: unknown): { latitude: number; longitude: number } | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object") throw new Error("موقعیت معتبر نیست.");
  const { latitude, longitude } = value as Record<string, unknown>;
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < 24 ||
    latitude > 40 ||
    longitude < 43 ||
    longitude > 64
  ) {
    throw new Error("موقعیت باید در محدوده ایران باشد.");
  }
  return { latitude, longitude };
}
