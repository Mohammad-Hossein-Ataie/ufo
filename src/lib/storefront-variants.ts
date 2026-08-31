import {
  getProductColorOptions,
  getProductVariantType,
  productColorAttributeTechnicalValue,
  productFlavorAttributeTechnicalValue,
} from "@ufo/domain";
import type { Product, ProductFlavor, ProductVariantType } from "@ufo/types";

export interface StorefrontVariantOption {
  id: string;
  labelFa: string;
  type: Exclude<ProductVariantType, "none">;
  swatch?: string;
  iconKey?: string;
}

function uniqueIds(ids: string[] | undefined): string[] {
  return [...new Set((ids ?? []).map((item) => item.trim()).filter(Boolean))];
}

function attributeIds(product: Product, technicalValue: string) {
  return uniqueIds(
    product.attributes
      .find((attribute) => attribute.technicalValue === technicalValue)
      ?.valueFa.split(","),
  );
}

export function getStorefrontVariantOptions(
  product: Product,
  flavors: ProductFlavor[] = [],
): StorefrontVariantOption[] {
  const variantType = getProductVariantType(product);

  if (variantType === "color") {
    return getProductColorOptions(product).map((color) => ({
      id: color.id,
      labelFa: color.labelFa,
      type: "color",
      swatch: color.hex,
    }));
  }

  if (variantType === "flavor") {
    const flavorIds =
      uniqueIds(product.variantValueIds).length > 0
        ? uniqueIds(product.variantValueIds)
        : attributeIds(product, productFlavorAttributeTechnicalValue);
    return flavorIds.map((flavorId) => {
      const flavor = flavors.find((item) => item.id === flavorId || item.slug === flavorId);
      return {
        id: flavorId,
        labelFa: flavor?.nameFa ?? flavorId,
        type: "flavor",
        ...(flavor?.iconKey ? { iconKey: flavor.iconKey } : {}),
      };
    });
  }

  return [];
}

export function getStorefrontVariantValueIds(product: Product, variantType: ProductVariantType) {
  if (variantType === "none") return [];
  if (uniqueIds(product.variantValueIds).length > 0) return uniqueIds(product.variantValueIds);
  return attributeIds(
    product,
    variantType === "color"
      ? productColorAttributeTechnicalValue
      : productFlavorAttributeTechnicalValue,
  );
}

export function aggregateStorefrontVariantOptions(
  rows: Array<{ product: Product }>,
  flavors: ProductFlavor[] = [],
  variantType: Exclude<ProductVariantType, "none">,
) {
  const byId = new Map<string, StorefrontVariantOption>();
  for (const row of rows) {
    if (getProductVariantType(row.product) !== variantType) continue;
    for (const option of getStorefrontVariantOptions(row.product, flavors)) {
      byId.set(option.id, option);
    }
  }
  return Array.from(byId.values()).sort((left, right) =>
    left.labelFa.localeCompare(right.labelFa, "fa"),
  );
}
