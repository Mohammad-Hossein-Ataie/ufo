import { describe, expect, it } from "vitest";
import { getPublicObjectUrl, rewriteLiaraPublicUrl } from "@ufo/storage";

const env = {
  LIARA_BUCKET_NAME: "ufopuff",
  LIARA_PUBLIC_BASE_URL: "https://bucket.ufopuff.com",
};

describe("Liara public storage URLs", () => {
  it("builds public file URLs from the configured custom bucket domain", () => {
    expect(getPublicObjectUrl("uploads/product.webp", env)).toBe(
      "https://bucket.ufopuff.com/uploads/product.webp",
    );
  });

  it("rewrites old path-style Liara URLs to the custom bucket domain", () => {
    expect(
      rewriteLiaraPublicUrl("https://storage.c2.liara.space/ufopuff/uploads/product.webp", env),
    ).toBe("https://bucket.ufopuff.com/uploads/product.webp");
  });

  it("rewrites old virtual-host Liara URLs to the custom bucket domain", () => {
    expect(
      rewriteLiaraPublicUrl("https://ufopuff.storage.iran.liara.site/uploads/product.webp", env),
    ).toBe("https://bucket.ufopuff.com/uploads/product.webp");
  });
});
