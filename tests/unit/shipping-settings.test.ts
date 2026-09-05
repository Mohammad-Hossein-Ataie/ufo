import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  listAvailableShippingQuotes,
  listShippingMethods,
  quoteConfiguredShipping,
  saveShippingMethod,
} from "@ufo/orders";

const tehranAddress = {
  province: "تهران",
  city: "تهران",
  line1: "خیابان ولیعصر",
  receiverName: "کاربر تست",
  receiverPhone: "09123456789",
};

describe("secure shipping settings", () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "ufo-shipping-"));
    vi.stubEnv("UFO_MOCK_DATA_DIR", directory);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
  });

  it("returns only active methods and calculates their price on the server", () => {
    expect(listShippingMethods()).toHaveLength(4);
    expect(listAvailableShippingQuotes(tehranAddress).map((item) => item.method)).not.toContain(
      "iran_post",
    );

    const post = listShippingMethods().find((item) => item.code === "iran_post")!;
    saveShippingMethod({ ...post, isActive: true, costRial: 1_400_000 }, post.id);
    const quote = quoteConfiguredShipping(tehranAddress, "iran_post");
    expect(quote.costRial).toBe(1_400_000);
    expect(quote.titleFa).toBe("پست ملی ایران");
  });

  it("rejects inactive, invalid and out-of-scope methods", () => {
    expect(() => quoteConfiguredShipping(tehranAddress, "iran_post")).toThrow("فعال نیست");
    expect(() =>
      saveShippingMethod({
        code: "<script>",
        titleFa: "ناامن",
        descriptionFa: "",
        costRial: -1,
        etaFa: "یک روز",
        scope: "nationwide",
        isActive: true,
        sortOrder: 1,
      }),
    ).toThrow();
    expect(
      quoteConfiguredShipping(
        { ...tehranAddress, province: "فارس", city: "شیراز" },
        "tehran_courier",
      ),
    ).toMatchObject({ available: false, costRial: 0 });
  });
});
