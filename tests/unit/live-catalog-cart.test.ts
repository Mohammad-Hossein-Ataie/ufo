import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { products, variants } from "@ufo/domain";
import { addCartItem, registerOrderCatalog, upsertCustomerAccount } from "@ufo/orders";
import { listAdminBrands, saveAdminBrand } from "@/lib/admin-brands";

describe("admin-created catalog entries", () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "ufo-live-cart-"));
    vi.stubEnv("UFO_MOCK_DATA_DIR", directory);
    vi.stubEnv("MONGODB_URI", "");
  });

  afterEach(() => {
    registerOrderCatalog([]);
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
  });

  it("adds a newly saved brand to the selectable catalog and rejects duplicates", async () => {
    const saved = await saveAdminBrand({ nameFa: "برند نمونه تست", slug: "test-new-brand" });
    expect((await listAdminBrands()).find((brand) => brand.id === saved.id)).toEqual(saved);
    await expect(saveAdminBrand({ nameFa: "برند نمونه تست", slug: "test-new-brand" })).rejects.toThrow("قبلاً ثبت شده");
  });

  it("adds an admin-created product to the customer cart", () => {
    const product = { ...products[0]!, id: "product-created-in-admin", isActive: true };
    const variant = {
      ...variants[0]!, id: "variant-created-in-admin", productId: product.id,
      retailPriceRial: 2_350_000, isActive: true,
    };
    registerOrderCatalog([{ product, variant }]);
    const customer = upsertCustomerAccount({ mobileNumber: "09123456789", customerType: "retail" });
    const cart = addCartItem(customer.id, "retail", { variantId: variant.id, quantity: 1 });
    expect(cart.items).toEqual([expect.objectContaining({ productName: product.nameFa, unitPriceSnapshot: 2_350_000 })]);
  });

});
