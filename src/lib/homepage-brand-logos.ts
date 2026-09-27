import { brands as bundledBrands } from "@ufo/domain";
import type { Brand } from "@ufo/types";
import { getBrandLogoUrl } from "./partner-brand-logos";

export function getHomepagePartnerBrands(
  savedBrands: Brand[],
): Array<{ brand: Brand; logo: string }> {
  const savedById = new Map(savedBrands.map((brand) => [brand.id, brand]));
  const bundledIds = new Set(bundledBrands.map((brand) => brand.id));
  const orderedBrands = [
    ...bundledBrands.map((brand) => savedById.get(brand.id) ?? brand),
    ...savedBrands.filter((brand) => !bundledIds.has(brand.id)),
  ];
  return orderedBrands.flatMap((brand) => {
    const logo = getBrandLogoUrl(brand);
    return logo ? [{ brand, logo }] : [];
  });
}
