import { describe, expect, it } from "vitest";
import {
  normalizeIranPhone,
  normalizePersianText,
  toEnglishDigits,
  toPersianDigits,
} from "@ufo/validation";

describe("Persian validation helpers", () => {
  it("normalizes Persian and Arabic characters", () => {
    expect(normalizePersianText("كيك  يزد")).toBe("کیک یزد");
  });

  it("normalizes Iranian phone numbers", () => {
    expect(normalizeIranPhone("+989362157181")).toBe("09362157181");
    expect(normalizeIranPhone("۰۹۳۶۲۱۵۷۱۸۱")).toBe("09362157181");
  });

  it("converts digits for UI and parsing", () => {
    expect(toEnglishDigits("۱۲۳٤")).toBe("1234");
    expect(toPersianDigits(1234)).toBe("۱۲۳۴");
  });
});
