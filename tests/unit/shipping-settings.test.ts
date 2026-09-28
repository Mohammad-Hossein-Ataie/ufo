import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  listAvailableShippingQuotes,
  listShippingMethods,
  quoteConfiguredShipping,
  saveShippingMethod,
  defaultShippingMethods,
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
    expect(listShippingMethods()).toHaveLength(5);
    expect(listAvailableShippingQuotes(tehranAddress).map((item) => item.method)).toContain(
      "iran_post",
    );
    expect(listAvailableShippingQuotes(tehranAddress).map((item) => item.method)).toContain(
      "snapbox",
    );
    expect(listAvailableShippingQuotes(tehranAddress).map((item) => item.method)).not.toContain(
      "tehran_courier",
    );

    const post = listShippingMethods().find((item) => item.code === "iran_post")!;
    saveShippingMethod({ ...post, isActive: true, costRial: 1_400_000 }, post.id);
    const quote = quoteConfiguredShipping(tehranAddress, "iran_post");
    expect(quote.costRial).toBe(1_400_000);
    expect(quote.titleFa).toBe("پست ملی ایران");
  });

  it("rejects inactive, invalid and out-of-scope methods", () => {
    expect(() => quoteConfiguredShipping(tehranAddress, "missing_method")).toThrow("فعال نیست");
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
    const courier = listShippingMethods().find((item) => item.code === "tehran_courier")!;
    expect(() => quoteConfiguredShipping(tehranAddress, "tehran_courier")).toThrow();
    saveShippingMethod({ ...courier, isActive: true }, courier.id);
    expect(
      quoteConfiguredShipping(
        { ...tehranAddress, province: "فارس", city: "شیراز" },
        "tehran_courier",
      ),
    ).toMatchObject({ available: false, costRial: 0 });
    expect(
      quoteConfiguredShipping({ ...tehranAddress, province: "فارس", city: "شیراز" }, "snapbox"),
    ).toMatchObject({ available: false, costRial: 0 });
    expect(quoteConfiguredShipping(tehranAddress, "snapbox")).toMatchObject({
      available: true,
      costRial: 0,
      titleFa: "اسنپ‌باکس",
    });
    const snapbox = listShippingMethods().find((item) => item.code === "snapbox")!;
    expect(() => saveShippingMethod({ ...snapbox, scope: "nationwide" }, snapbox.id)).toThrow();
    expect(() => saveShippingMethod({ ...snapbox, costRial: 1000 }, snapbox.id)).toThrow();
  });

  it("disables an existing courier once and preserves later admin activation", () => {
    const path = join(directory, "shipping-methods.json");
    writeFileSync(
      path,
      JSON.stringify({
        methods: defaultShippingMethods
          .filter((method) => method.code !== "snapbox")
          .map((method) => ({ ...method, isActive: true })),
      }),
    );
    const courier = listShippingMethods().find((method) => method.code === "tehran_courier")!;
    expect(courier.isActive).toBe(false);
    expect(listShippingMethods().find((method) => method.code === "snapbox")?.isActive).toBe(true);
    expect(JSON.parse(readFileSync(path, "utf8")).schemaVersion).toBe(2);
    saveShippingMethod({ ...courier, isActive: true }, courier.id);
    expect(listShippingMethods().find((method) => method.code === "tehran_courier")?.isActive).toBe(
      true,
    );
  });
});
