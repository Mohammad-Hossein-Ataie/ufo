import { categories } from "@ufo/domain";
import {
  productCatalogImageUrl,
  protectedAssetUrl,
  productCardImageVersion,
  productDetailImageVersion,
  type ProductImagePreset,
} from "@/lib/product-image-protection";
import type { Product } from "@ufo/types";

const genericProductImages = new Set(["", "/images/ufo-hero.webp"]);

export const categoryImageBySlug: Record<string, string> = {
  pod: "/images/categories/pod.webp",
  vape: "/images/categories/vape.webp",
  disposable: "/images/categories/disposable.webp",
  "e-liquid": "/images/categories/e-liquid.webp",
  "salt-nicotine": "/images/categories/salt-nicotine.webp",
  coil: "/images/categories/coil.webp",
  cartridge: "/images/categories/cartridge.webp",
  lighter: "/images/categories/lighter.webp",
  accessories: "/images/categories/lighter.webp",
};

export function getCategoryImage(categoryId: string) {
  const category = categories.find((item) => item.id === categoryId);
  return category ? categoryImageBySlug[category.slug] : undefined;
}

function protectedProductSource(
  productId: string,
  source: string,
  slot: string,
  preset: ProductImagePreset,
) {
  return protectedAssetUrl(source, preset) ?? productCatalogImageUrl(productId, slot, preset);
}

export function getProductImage(product: Pick<Product, "id" | "categoryId" | "image">) {
  if (!genericProductImages.has(product.image)) {
    return `${protectedProductSource(product.id, product.image, "primary", "card")}?v=${productCardImageVersion}`;
  }
  return getCategoryImage(product.categoryId) ?? "/images/categories/lighter.webp";
}

export function getProductImages(product: Pick<Product, "id" | "categoryId" | "image" | "images">) {
  const images = product.images
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => !genericProductImages.has(image))
    .map(
      ({ image, index }) =>
        `${protectedProductSource(product.id, image, `gallery-${index}`, "detail")}?v=${productDetailImageVersion}`,
    );
  if (images.length > 0) return images;
  if (!genericProductImages.has(product.image)) {
    return [
      `${protectedProductSource(product.id, product.image, "primary", "detail")}?v=${productDetailImageVersion}`,
    ];
  }
  return [getProductImage(product)];
}

export function getProductColorImages(
  product: Pick<
    Product,
    "id" | "categoryId" | "image" | "images" | "variantImages" | "colorImages"
  >,
) {
  return getProductVariantImages(product);
}

export function getProductVariantImages(
  product: Pick<
    Product,
    "id" | "categoryId" | "image" | "images" | "variantImages" | "colorImages"
  >,
) {
  return Object.fromEntries(
    Object.entries(product.variantImages ?? product.colorImages ?? {})
      .map(([valueId, image], index) => [valueId, image.trim(), index] as const)
      .filter(([, image]) => !genericProductImages.has(image))
      .map(([valueId, image, index]) => [
        valueId,
        `${protectedProductSource(product.id, image, `variant-${index}`, "detail")}?v=${productDetailImageVersion}`,
      ]),
  );
}
