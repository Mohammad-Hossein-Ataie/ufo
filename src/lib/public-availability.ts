export type PublicAvailabilityState =
  | "available"
  | "low_stock"
  | "almost_unavailable"
  | "unavailable";

export const publicAvailabilityThresholds = {
  lowStockAt: 9,
  almostUnavailableAt: 2,
} as const;

export function getPublicAvailabilityState(
  availableQuantity: number,
  options: { lowStockAt?: number; almostUnavailableAt?: number } = {},
): PublicAvailabilityState {
  const available = Math.max(0, Math.floor(availableQuantity));
  if (available === 0) return "unavailable";
  const lowStockAt = Math.max(
    1,
    Math.floor(options.lowStockAt ?? publicAvailabilityThresholds.lowStockAt),
  );
  const almostUnavailableAt = Math.min(
    lowStockAt,
    Math.max(
      1,
      Math.floor(
        options.almostUnavailableAt ?? publicAvailabilityThresholds.almostUnavailableAt,
      ),
    ),
  );
  if (available <= almostUnavailableAt) return "almost_unavailable";
  if (available <= lowStockAt) return "low_stock";
  return "available";
}

export function publicAvailabilityLabelFa(
  state: PublicAvailabilityState,
  unavailableLabel = "ناموجود",
) {
  if (state === "available") return "موجود";
  if (state === "low_stock") return "موجودی محدود";
  if (state === "almost_unavailable") return "رو به اتمام";
  return unavailableLabel;
}
