import {
  getProductVariantType,
  productColorAttributeTechnicalValue,
  productCapacityAttributeTechnicalValue,
  productColorPalette,
  productFlavorAttributeTechnicalValue,
  productResistanceAttributeTechnicalValue,
  type ProductColorOption,
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
  colors: ProductColorOption[] = productColorPalette,
): StorefrontVariantOption[] {
  const variantType = getProductVariantType(product);

  if (variantType === "color") {
    const colorIds =
      uniqueIds(product.variantValueIds).length > 0
        ? uniqueIds(product.variantValueIds)
        : attributeIds(product, productColorAttributeTechnicalValue);
    return colorIds.map((colorId) => {
      const color = colors.find((item) => item.id === colorId);
      return {
        id: colorId,
        labelFa: color?.labelFa ?? colorId,
        type: "color",
        ...(color?.hex ? { swatch: color.hex } : {}),
      };
    });
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

  if (variantType === "resistance" || variantType === "capacity") {
    const technicalValue =
      variantType === "resistance"
        ? productResistanceAttributeTechnicalValue
        : productCapacityAttributeTechnicalValue;
    const valueIds =
      uniqueIds(product.variantValueIds).length > 0
        ? uniqueIds(product.variantValueIds)
        : attributeIds(product, technicalValue);
    return valueIds.map((valueId) => ({
      id: valueId,
      labelFa: valueId,
      type: variantType,
    }));
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
      : variantType === "flavor"
        ? productFlavorAttributeTechnicalValue
        : variantType === "resistance"
          ? productResistanceAttributeTechnicalValue
          : productCapacityAttributeTechnicalValue,
  );
}

export function aggregateStorefrontVariantOptions(
  rows: Array<{ product: Product }>,
  flavors: ProductFlavor[] = [],
  variantType: Exclude<ProductVariantType, "none">,
  colors: ProductColorOption[] = productColorPalette,
) {
  const byId = new Map<string, StorefrontVariantOption>();
  for (const row of rows) {
    if (getProductVariantType(row.product) !== variantType) continue;
    for (const option of getStorefrontVariantOptions(row.product, flavors, colors)) {
      byId.set(option.id, option);
    }
  }
  return Array.from(byId.values()).sort((left, right) =>
    left.labelFa.localeCompare(right.labelFa, "fa"),
  );
}
