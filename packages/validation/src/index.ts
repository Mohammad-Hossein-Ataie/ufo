import { z } from "zod";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string): string {
  return value
    .split("")
    .map((char) => {
      const persianIndex = persianDigits.indexOf(char);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = arabicDigits.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      return char;
    })
    .join("");
}

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

export function normalizePersianText(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c+/g, "‌")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIranPhone(value: string): string {
  const normalized = toEnglishDigits(value).replace(/[\s\-()]/g, "");
  if (/^\+989\d{9}$/.test(normalized)) return `0${normalized.slice(3)}`;
  if (/^989\d{9}$/.test(normalized)) return `0${normalized.slice(2)}`;
  if (/^09\d{9}$/.test(normalized)) return normalized;
  throw new Error("شماره موبایل معتبر نیست.");
}

export function isTehran(city: string, province = ""): boolean {
  const normalizedCity = normalizePersianText(city).toLowerCase();
  const normalizedProvince = normalizePersianText(province).toLowerCase();
  return normalizedCity === "تهران" || normalizedProvince === "تهران";
}

export const iranPhoneSchema = z
  .string()
  .min(1, "شماره موبایل الزامی است.")
  .transform((value, ctx) => {
    try {
      return normalizeIranPhone(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "شماره موبایل معتبر نیست." });
      return z.NEVER;
    }
  });

export const moneyRialSchema = z
  .number({ invalid_type_error: "قیمت باید عدد باشد." })
  .int("قیمت باید عدد صحیح ریالی باشد.")
  .nonnegative("قیمت نمی‌تواند منفی باشد.");

export const quantitySchema = z
  .number({ invalid_type_error: "تعداد باید عدد باشد." })
  .int("تعداد باید عدد صحیح باشد.")
  .positive("تعداد باید بیشتر از صفر باشد.");

export const persianRequiredString = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} الزامی است.`)
    .transform((value) => normalizePersianText(value));
