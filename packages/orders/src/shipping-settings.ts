import { getCities, getProvince } from "@code-plate/iran-cities";
import type {
  ShippingAddress,
  ShippingMethodCode,
  ShippingMethodConfig,
  ShippingQuote,
} from "@ufo/types";
import { normalizeIranPhone } from "@ufo/validation";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const initialDate = "2026-01-01T00:00:00.000Z";

export const defaultShippingMethods: ShippingMethodConfig[] = [
  {
    id: "shipping_tipax",
    code: "tipax",
    titleFa: "تیپاکس",
    descriptionFa: "ارسال مطمئن به سراسر ایران",
    costRial: 1_650_000,
    etaFa: "۲ تا ۴ روز کاری",
    scope: "nationwide",
    isActive: true,
    sortOrder: 10,
    createdAt: initialDate,
    updatedAt: initialDate,
  },
  {
    id: "shipping_tehran_courier",
    code: "tehran_courier",
    titleFa: "پیک تهران",
    descriptionFa: "تحویل سریع ویژه شهر تهران",
    costRial: 950_000,
    etaFa: "همان روز یا روز کاری بعد",
    scope: "tehran",
    isActive: true,
    sortOrder: 20,
    createdAt: initialDate,
    updatedAt: initialDate,
  },
  {
    id: "shipping_pickup",
    code: "pickup",
    titleFa: "تحویل حضوری",
    descriptionFa: "دریافت از فروشگاه مولوی",
    costRial: 0,
    etaFa: "هماهنگی همان روز",
    scope: "pickup",
    isActive: true,
    sortOrder: 30,
    createdAt: initialDate,
    updatedAt: initialDate,
  },
  {
    id: "shipping_iran_post",
    code: "iran_post",
    titleFa: "پست ملی ایران",
    descriptionFa: "ارسال پستی به سراسر کشور",
    costRial: 1_200_000,
    etaFa: "۳ تا ۷ روز کاری",
    scope: "nationwide",
    isActive: false,
    sortOrder: 40,
    createdAt: initialDate,
    updatedAt: initialDate,
  },
];

function findWorkspaceRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "turbo.json"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

export function getShippingSettingsPath(): string {
  return resolve(
    process.env.UFO_MOCK_DATA_DIR ?? join(findWorkspaceRoot(), "mock-data"),
    "shipping-methods.json",
  );
}

function readShippingMethods(): ShippingMethodConfig[] {
  const path = getShippingSettingsPath();
  if (!existsSync(path)) return defaultShippingMethods.map((item) => ({ ...item }));
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { methods?: ShippingMethodConfig[] };
    return Array.isArray(parsed.methods) ? parsed.methods : defaultShippingMethods;
  } catch {
    return defaultShippingMethods.map((item) => ({ ...item }));
  }
}

function writeShippingMethods(methods: ShippingMethodConfig[]): void {
  const path = getShippingSettingsPath();
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify({ methods }, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  if (existsSync(path)) rmSync(path, { force: true });
  renameSync(tempPath, path);
}

export type ShippingMethodInput = Pick<
  ShippingMethodConfig,
  "code" | "titleFa" | "descriptionFa" | "costRial" | "etaFa" | "scope" | "isActive" | "sortOrder"
>;

function validateShippingMethod(input: ShippingMethodInput): ShippingMethodInput {
  const code = input.code.trim().toLowerCase();
  const titleFa = input.titleFa.trim();
  const descriptionFa = input.descriptionFa.trim();
  const etaFa = input.etaFa.trim();
  if (!/^[a-z][a-z0-9_]{2,39}$/.test(code))
    throw new Error("کد روش ارسال باید ۳ تا ۴۰ کاراکتر انگلیسی، عدد یا زیرخط باشد.");
  if (!titleFa || titleFa.length > 80) throw new Error("عنوان روش ارسال معتبر نیست.");
  if (descriptionFa.length > 180 || !etaFa || etaFa.length > 100)
    throw new Error("توضیحات یا زمان ارسال معتبر نیست.");
  if (!Number.isSafeInteger(input.costRial) || input.costRial < 0 || input.costRial > 1_000_000_000)
    throw new Error("هزینه ارسال باید یک عدد صحیح معتبر به ریال باشد.");
  if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 10_000)
    throw new Error("ترتیب نمایش معتبر نیست.");
  if (!(["nationwide", "tehran", "pickup"] as const).includes(input.scope))
    throw new Error("محدوده روش ارسال معتبر نیست.");
  return { ...input, code, titleFa, descriptionFa, etaFa };
}

export function listShippingMethods(options?: { activeOnly?: boolean }): ShippingMethodConfig[] {
  return readShippingMethods()
    .filter((method) => !options?.activeOnly || method.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.titleFa.localeCompare(b.titleFa, "fa"));
}

export function saveShippingMethod(
  input: ShippingMethodInput,
  methodId?: string,
): ShippingMethodConfig {
  const methods = readShippingMethods();
  const valid = validateShippingMethod(input);
  if (methods.some((method) => method.code === valid.code && method.id !== methodId))
    throw new Error("این کد روش ارسال قبلاً استفاده شده است.");
  const now = new Date().toISOString();
  const current = methodId ? methods.find((method) => method.id === methodId) : undefined;
  if (methodId && !current) throw new Error("روش ارسال پیدا نشد.");
  const saved: ShippingMethodConfig = current
    ? { ...current, ...valid, updatedAt: now }
    : { id: `shipping_${crypto.randomUUID()}`, ...valid, createdAt: now, updatedAt: now };
  writeShippingMethods(
    current
      ? methods.map((method) => (method.id === current.id ? saved : method))
      : [...methods, saved],
  );
  return saved;
}

export function deleteShippingMethod(methodId: string): void {
  const methods = readShippingMethods();
  if (!methods.some((method) => method.id === methodId)) throw new Error("روش ارسال پیدا نشد.");
  writeShippingMethods(methods.filter((method) => method.id !== methodId));
}

export function isValidIranLocation(province: string, city: string): boolean {
  const foundProvince = getProvince(province.trim());
  const normalizedCity = city.trim();
  return Boolean(
    foundProvince &&
      getCities(foundProvince.en).some(
        (item) => item.fa === normalizedCity || item.en === normalizedCity.toLowerCase(),
      ),
  );
}

export function quoteConfiguredShipping(
  address: ShippingAddress,
  code: ShippingMethodCode,
): ShippingQuote {
  normalizeIranPhone(address.receiverPhone);
  if (!address.receiverName.trim()) throw new Error("اطلاعات گیرنده کامل نیست.");
  const method = readShippingMethods().find((item) => item.code === code && item.isActive);
  if (!method) throw new Error("روش ارسال انتخاب‌شده فعال نیست.");
  if (method.scope !== "pickup" && !isValidIranLocation(address.province, address.city)) {
    throw new Error("استان یا شهر انتخاب‌شده معتبر نیست.");
  }
  const available =
    method.scope !== "tehran" ||
    (address.province.trim() === "تهران" && address.city.trim() === "تهران");
  return {
    method: method.code,
    titleFa: method.titleFa,
    costRial: available ? method.costRial : 0,
    etaFa: available ? method.etaFa : "فقط برای شهر تهران فعال است",
    available,
    ...(available ? {} : { reasonFa: "این روش ارسال فقط برای شهر تهران قابل انتخاب است." }),
  };
}

export function listAvailableShippingQuotes(
  address: ShippingAddress,
): Array<ShippingQuote & { descriptionFa: string; scope: ShippingMethodConfig["scope"] }> {
  return listShippingMethods({ activeOnly: true }).map((method) => ({
    ...quoteConfiguredShipping(address, method.code),
    descriptionFa: method.descriptionFa,
    scope: method.scope,
  }));
}
