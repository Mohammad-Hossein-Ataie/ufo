import { describe, expect, it } from "vitest";
import {
  createNicotineGuidePromoPreference,
  NICOTINE_GUIDE_PROMO_REMINDER_DAYS,
  parseNicotineGuidePromoPreference,
  shouldShowNicotineGuidePromo,
} from "@/lib/nicotine-guide-promo";

describe("nicotine guide promo preference", () => {
  const now = Date.UTC(2026, 8, 29, 8);

  it("shows for a first-time visitor or an invalid stored value", () => {
    expect(shouldShowNicotineGuidePromo(null, now)).toBe(true);
    expect(shouldShowNicotineGuidePromo("not-json", now)).toBe(true);
  });

  it("snoozes the promotion for seven days", () => {
    const saved = createNicotineGuidePromoPreference("remind-later", now);
    const sixDaysLater = now + 6 * 24 * 60 * 60 * 1_000;
    const sevenDaysLater = now + NICOTINE_GUIDE_PROMO_REMINDER_DAYS * 24 * 60 * 60 * 1_000;

    expect(shouldShowNicotineGuidePromo(saved, sixDaysLater)).toBe(false);
    expect(shouldShowNicotineGuidePromo(saved, sevenDaysLater)).toBe(true);
  });

  it.each(["opened", "never"] as const)("does not repeat after the %s choice", (choice) => {
    const saved = createNicotineGuidePromoPreference(choice, now);
    expect(shouldShowNicotineGuidePromo(saved, now + 365 * 24 * 60 * 60 * 1_000)).toBe(false);
  });

  it("rejects a reminder without a valid reminder date", () => {
    const invalid = JSON.stringify({ choice: "remind-later", savedAt: now });
    expect(parseNicotineGuidePromoPreference(invalid)).toBeNull();
  });
});
