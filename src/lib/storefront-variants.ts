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
import {
  getPublicAvailabilityState,
  type PublicAvailabilityState,
} from "@/lib/public-availability";

export interface StorefrontVariantOption {
  id: string;
  labelFa: string;
  type: Exclude<ProductVariantType, "none">;
  swatch?: string;
  iconKey?: string;
  availability: PublicAvailabilityState;
  disabled: boolean;
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
  fallbackAvailability: PublicAvailabilityState = "available",
): StorefrontVariantOption[] {
  const variantType = getProductVariantType(product);

  const publicState = (valueId: string) => {
    const state = product.variantValueStates?.[valueId];
    if (state?.isActive === false) return undefined;
    const availability =
      product.isAvailable === false || state?.isAvailable === false
        ? "unavailable"
        : state?.stockQuantity !== undefined
          ? getPublicAvailabilityState(state.stockQuantity)
          : fallbackAvailability;
    return { availability, disabled: availability === "unavailable" } as const;
  };

  if (variantType === "color") {
    const colorIds =
      uniqueIds(product.variantValueIds).length > 0
        ? uniqueIds(product.variantValueIds)
        : attributeIds(product, productColorAttributeTechnicalValue);
    return colorIds.flatMap((colorId) => {
      const state = publicState(colorId);
      if (!state) return [];
      const color = colors.find((item) => item.id === colorId);
      return {
        id: colorId,
        labelFa: color?.labelFa ?? colorId,
        type: "color",
        ...(color?.hex ? { swatch: color.hex } : {}),
        ...state,
      };
    });
  }

  if (variantType === "flavor") {
    const flavorIds =
      uniqueIds(product.variantValueIds).length > 0
        ? uniqueIds(product.variantValueIds)
        : attributeIds(product, productFlavorAttributeTechnicalValue);
    return flavorIds.flatMap((flavorId) => {
      const state = publicState(flavorId);
      if (!state) return [];
      const flavor = flavors.find((item) => item.id === flavorId || item.slug === flavorId);
      return {
        id: flavorId,
        labelFa: flavor?.nameFa ?? flavorId,
        type: "flavor",
        ...(flavor?.iconKey ? { iconKey: flavor.iconKey } : {}),
        ...state,
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
    return valueIds.flatMap((valueId) => {
      const state = publicState(valueId);
      return state ? [{ id: valueId, labelFa: valueId, type: variantType, ...state }] : [];
    });
  }

  return [];
}

export function resolveStorefrontVariantValueId(
  options: StorefrontVariantOption[],
  requestedValueId?: string | null,
  configuredDefaultValueId?: string | null,
): string | null {
  const selectableIds = new Set(
    options.filter((option) => !option.disabled).map((option) => option.id),
  );
  if (requestedValueId && selectableIds.has(requestedValueId)) return requestedValueId;
  if (configuredDefaultValueId && selectableIds.has(configuredDefaultValueId)) {
    return configuredDefaultValueId;
  }
  return options.find((option) => !option.disabled)?.id ?? null;
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
