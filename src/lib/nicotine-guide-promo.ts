export const NICOTINE_GUIDE_PROMO_STORAGE_KEY = "ufo:nicotine-guide-promo:v1";

export const NICOTINE_GUIDE_PROMO_REMINDER_DAYS = 7;

export type NicotineGuidePromoChoice = "opened" | "remind-later" | "never";

interface NicotineGuidePromoPreference {
  choice: NicotineGuidePromoChoice;
  savedAt: number;
  remindAt?: number;
}

function isPromoChoice(value: unknown): value is NicotineGuidePromoChoice {
  return value === "opened" || value === "remind-later" || value === "never";
}

export function parseNicotineGuidePromoPreference(
  rawValue: string | null,
): NicotineGuidePromoPreference | null {
  if (!rawValue) return null;

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") return null;

    const preference = parsed as Partial<NicotineGuidePromoPreference>;
    if (!isPromoChoice(preference.choice) || typeof preference.savedAt !== "number") {
      return null;
    }

    if (preference.choice === "remind-later" && typeof preference.remindAt !== "number") {
      return null;
    }

    return {
      choice: preference.choice,
      savedAt: preference.savedAt,
      ...(preference.choice === "remind-later" ? { remindAt: preference.remindAt } : {}),
    };
  } catch {
    return null;
  }
}

export function shouldShowNicotineGuidePromo(rawValue: string | null, now = Date.now()) {
  const preference = parseNicotineGuidePromoPreference(rawValue);
  if (!preference) return true;
  if (preference.choice !== "remind-later") return false;
  return (preference.remindAt ?? 0) <= now;
}

export function createNicotineGuidePromoPreference(
  choice: NicotineGuidePromoChoice,
  now = Date.now(),
) {
  const preference: NicotineGuidePromoPreference = {
    choice,
    savedAt: now,
    ...(choice === "remind-later"
      ? {
          remindAt: now + NICOTINE_GUIDE_PROMO_REMINDER_DAYS * 24 * 60 * 60 * 1_000,
        }
      : {}),
  };

  return JSON.stringify(preference);
}
