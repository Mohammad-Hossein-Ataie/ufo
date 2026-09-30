import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { products, variants } from "@ufo/domain";
import {
  addCartItem,
  checkoutCustomerCart,
  registerOrderCatalog,
  upsertCustomerAccount,
} from "@ufo/orders";
import { listAdminBrands, saveAdminBrand } from "@/lib/admin-brands";
import { getAdminProduct, saveAdminProduct } from "@/lib/admin-products";
import { findCatalogRowBySlug } from "@/lib/catalog-data";

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
    await expect(
      saveAdminBrand({ nameFa: "برند نمونه تست", slug: "test-new-brand" }),
    ).rejects.toThrow("قبلاً ثبت شده");
  });

  it("adds an admin-created product to the customer cart", () => {
    const product = { ...products[0]!, id: "product-created-in-admin", isActive: true };
    const variant = {
      ...variants[0]!,
      id: "variant-created-in-admin",
      productId: product.id,
      retailPriceRial: 2_350_000,
      isActive: true,
    };
    registerOrderCatalog([{ product, variant }]);
    const customer = upsertCustomerAccount({ mobileNumber: "09123456789", customerType: "retail" });
    const cart = addCartItem(customer.id, "retail", { variantId: variant.id, quantity: 1 });
    expect(cart.items).toEqual([
      expect.objectContaining({ productName: product.nameFa, unitPriceSnapshot: 2_350_000 }),
    ]);
  });

  it("rejects unavailable option values and accepts them after re-enabling", () => {
    const product = {
      ...products[0]!,
      id: "product-with-option-stock",
      isActive: true,
      salesChannels: ["retail", "wholesale"] as const,
      variantType: "color" as const,
      variantValueIds: ["black", "silver"],
      variantValueStates: {
        black: { isActive: true, isAvailable: false, stockQuantity: 4 },
        silver: { isActive: true, isAvailable: true, stockQuantity: 1 },
      },
    };
    const variant = {
      ...variants[0]!,
      id: "variant-with-option-stock",
      productId: product.id,
      isActive: true,
      wholesaleEnabled: true,
    };
    registerOrderCatalog([{ product, variant }]);
    const customer = upsertCustomerAccount({ mobileNumber: "09123456788", customerType: "retail" });

    expect(() =>
      addCartItem(customer.id, "retail", {
        variantId: variant.id,
        quantity: 1,
        selectedVariant: { type: "color", valueId: "black" },
      }),
    ).toThrow("قابل سفارش نیست");
    expect(() =>
      addCartItem(customer.id, "retail", {
        variantId: variant.id,
        quantity: 2,
        selectedVariant: { type: "color", valueId: "silver" },
      }),
    ).toThrow("قابل سفارش نیست");

    registerOrderCatalog([
      {
        product: {
          ...product,
          variantValueStates: {
            ...product.variantValueStates,
            black: { isActive: true, isAvailable: true, stockQuantity: 4 },
          },
        },
        variant,
      },
    ]);
    const cart = addCartItem(customer.id, "retail", {
      variantId: variant.id,
      quantity: 1,
      selectedVariant: { type: "color", valueId: "black" },
    });
    expect(cart.items[0]?.selectedVariant?.valueId).toBe("black");

    const wholesaleCustomer = upsertCustomerAccount({
      mobileNumber: "09123456787",
      customerType: "wholesale",
    });
    const wholesaleCart = addCartItem(wholesaleCustomer.id, "wholesale", {
      variantId: variant.id,
      quantity: variant.cartonSize * variant.minWholesaleCartonCount,
      cartonCount: variant.minWholesaleCartonCount,
    });
    expect(wholesaleCart.items[0]?.variantId).toBe(variant.id);
  });

  it("rejects an unavailable parent even when its options are available", () => {
    const product = {
      ...products[0]!,
      id: "parent-unavailable-product",
      isActive: true,
      isAvailable: false,
      variantValueStates: {
        black: { isActive: true, isAvailable: true, stockQuantity: 10 },
        silver: { isActive: true, isAvailable: true, stockQuantity: 10 },
        green: { isActive: true, isAvailable: true, stockQuantity: 10 },
      },
    };
    const variant = {
      ...variants[0]!,
      id: "parent-unavailable-variant",
      productId: product.id,
      isActive: true,
    };
    registerOrderCatalog([{ product, variant }]);
    const customer = upsertCustomerAccount({
      mobileNumber: "09123456786",
      customerType: "retail",
    });

    expect(() =>
      addCartItem(customer.id, "retail", {
        variantId: variant.id,
        quantity: 1,
        selectedVariant: { type: "color", valueId: "black" },
      }),
    ).toThrow("این محصول در حال حاضر قابل سفارش نیست");

    registerOrderCatalog([
      { product: { ...product, isActive: false, isAvailable: true }, variant },
    ]);
    expect(() =>
      addCartItem(customer.id, "retail", {
        variantId: variant.id,
        quantity: 1,
        selectedVariant: { type: "color", valueId: "black" },
      }),
    ).toThrow("محصول پیدا نشد");
  });

  it("revalidates parent availability when a previously added cart is checked out", () => {
    const product = {
      ...products[0]!,
      id: "availability-changed-after-cart",
      isActive: true,
      isAvailable: true,
    };
    const variant = {
      ...variants[0]!,
      id: "availability-changed-after-cart-variant",
      productId: product.id,
      isActive: true,
    };
    registerOrderCatalog([{ product, variant }]);
    const customer = upsertCustomerAccount({
      mobileNumber: "09123456785",
      customerType: "retail",
      fullName: "کاربر تست",
    });
    addCartItem(customer.id, "retail", { variantId: variant.id, quantity: 1 });

    registerOrderCatalog([{ product: { ...product, isAvailable: false }, variant }]);
    expect(() =>
      checkoutCustomerCart({
        channel: "retail",
        customerId: customer.id,
        customerName: "کاربر تست",
        phone: "09123456785",
        address: {
          province: "تهران",
          city: "تهران",
          line1: "تحویل حضوری",
          receiverName: "کاربر تست",
          receiverPhone: "09123456785",
        },
        shippingMethod: "pickup",
        paymentMethod: "card_to_card",
      }),
    ).toThrow("این محصول در حال حاضر قابل سفارش نیست");
  });

  it("persists option status, stock, SKU, default, and images across an admin reopen", async () => {
    const saved = await saveAdminProduct({
      variantId: "admin-variant-persistence-sku",
      inventoryId: "admin-variant-persistence-inventory",
      nameFa: "محصول تنوع تست",
      nameEn: "Variant persistence test",
      slug: "variant-persistence-test",
      brandId: "brand-ufo",
      categoryId: "cat-vape",
      productKind: "vape-device",
      salesChannels: ["retail"],
      image: "/images/ufo-hero.webp",
      images: ["/images/ufo-hero.webp", "/images/categories/vape.webp"],
      variantType: "color",
      variantValueIds: ["black", "silver"],
      variantImages: {
        black: "/images/ufo-hero.webp",
        silver: "/images/categories/vape.webp",
      },
      variantValueStates: {
        black: { isActive: true, isAvailable: false, stockQuantity: 0, sku: "BLACK-01" },
        silver: { isActive: true, isAvailable: true, stockQuantity: 7, sku: "SILVER-07" },
      },
      defaultVariantValueId: "silver",
      retailPriceRial: 1_000_000,
      onHand: 10,
      restockThreshold: 2,
      isActive: true,
      isAvailable: false,
    });

    expect(saved.product.variantValueStates?.black).toEqual({
      isActive: true,
      isAvailable: false,
      stockQuantity: 0,
      sku: "BLACK-01",
    });
    const reopened = await getAdminProduct(saved.product.id);
    expect(saved.product.isAvailable).toBe(false);
    expect(reopened?.product.isAvailable).toBe(false);
    expect(reopened?.product.defaultVariantValueId).toBe("silver");
    expect(reopened?.product.variantImages).toEqual(saved.product.variantImages);
    expect(reopened?.product.variantValueStates).toEqual(saved.product.variantValueStates);
    expect((await findCatalogRowBySlug(saved.product.slug))?.product.isAvailable).toBe(false);

    await saveAdminProduct({
      id: saved.product.id,
      variantId: saved.variant.id,
      inventoryId: saved.inventory.id,
      nameFa: saved.product.nameFa,
      nameEn: saved.product.nameEn ?? "",
      slug: saved.product.slug,
      brandId: saved.product.brandId,
      categoryId: saved.product.categoryId,
      productKind: saved.product.productKind!,
      salesChannels: saved.product.salesChannels ?? ["retail"],
      image: saved.product.image,
      images: saved.product.images,
      retailPriceRial: saved.variant.retailPriceRial,
      wholesalePriceRial: saved.variant.wholesalePriceRial,
      onHand: saved.inventory.onHand,
      restockThreshold: saved.inventory.restockThreshold,
      isActive: false,
      isAvailable: false,
    });
    expect(await findCatalogRowBySlug(saved.product.slug)).toBeUndefined();
  });

  it("persists independent multi-strength nicotine metadata without replacing flavor variants", async () => {
    const saved = await saveAdminProduct({
      variantId: "admin-nicotine-strength-variant",
      inventoryId: "admin-nicotine-strength-inventory",
      nameFa: "سالت تست متادیتای نیکوتین",
      nameEn: "Nicotine metadata test salt",
      slug: "nicotine-metadata-persistence-test",
      brandId: "brand-ufo",
      categoryId: "cat-salt-nicotine",
      productKind: "salt-nicotine",
      nicotineStrengthsMg: [50, 20, 50],
      salesChannels: ["retail"],
      image: "/images/categories/salt.webp",
      images: ["/images/categories/salt.webp"],
      variantType: "flavor",
      variantValueIds: ["mint"],
      retailPriceRial: 1_000_000,
      onHand: 10,
      restockThreshold: 2,
      isActive: true,
      isAvailable: true,
    });

    expect(saved.product.nicotineStrengthsMg).toEqual([20, 50]);
    expect(saved.product.variantType).toBe("flavor");
    expect(saved.product.variantValueIds).toEqual(["mint"]);

    const reopened = await getAdminProduct(saved.product.id);
    expect(reopened?.product.nicotineStrengthsMg).toEqual([20, 50]);
    expect(reopened?.product.variantValueIds).toEqual(["mint"]);
  });
});
