import { categories } from "@ufo/domain";
import type { Product } from "@ufo/types";

const genericProductImages = new Set(["", "/images/ufo-hero.png"]);

export const categoryImageBySlug: Record<string, string> = {
  pod: "/images/categories/pod.png",
  vape: "/images/categories/vape.png",
  disposable: "/images/categories/disposable.png",
  "e-liquid": "/images/categories/e-liquid.png",
  "salt-nicotine": "/images/categories/salt-nicotine.png",
  coil: "/images/categories/coil.png",
  cartridge: "/images/categories/cartridge.png",
  lighter: "/images/categories/lighter.png",
  accessories: "/images/categories/lighter.png",
};

export function getCategoryImage(categoryId: string) {
  const category = categories.find((item) => item.id === categoryId);
  return category ? categoryImageBySlug[category.slug] : undefined;
}

export function getProductImage(product: Pick<Product, "categoryId" | "image">) {
  if (!genericProductImages.has(product.image)) return product.image;
  return getCategoryImage(product.categoryId) ?? "/images/categories/lighter.png";
}

export function getProductImages(product: Pick<Product, "categoryId" | "image" | "images">) {
  const images = product.images.filter((image) => !genericProductImages.has(image));
  return images.length > 0 ? images : [getProductImage(product)];
}
