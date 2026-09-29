import { describe, expect, it } from "vitest";
import { getNicotineGuide } from "@/lib/nicotine-guide";

describe("nicotine guide", () => {
  it("keeps a light smoker using a low-power pod in the lowest salt range", () => {
    const result = getNicotineGuide(4, "after-60", "pod-mtl");

    expect(result.band).toBe("light");
    expect(result.nicotineStrength).toBe("5–10 mg/ml");
    expect(result.catalogHref).toBe("/products/category/salt-nicotine");
  });

  it("raises the starting band when the first cigarette is within 30 minutes", () => {
    const result = getNicotineGuide(10, "within-30", "pod-mtl");

    expect(result.band).toBe("regular");
    expect(result.nicotineStrength).toBe("12–18 mg/ml");
  });

  it("recommends lower-strength freebase for a high-power device", () => {
    const result = getNicotineGuide(20, "within-60", "mod-dtl");

    expect(result.productType).toContain("فری‌بیس");
    expect(result.nicotineStrength).toBe("6 mg/ml");
    expect(result.catalogHref).toBe("/products/category/e-liquid");
  });

  it("never recommends more than 20 mg/ml for heavy consumption", () => {
    const result = getNicotineGuide(60, "within-30", "pod-mtl");

    expect(result.band).toBe("high");
    expect(result.nicotineStrength).toBe("18–20 mg/ml");
  });

  it("shows both device paths when the device is unknown", () => {
    const result = getNicotineGuide(8, "unknown", "unknown");

    expect(result.nicotineStrength).toContain("پاد کم‌وات");
    expect(result.alternative).toContain("ویپ/مود پرقدرت");
    expect(result.catalogHref).toBe("/products");
  });
});
