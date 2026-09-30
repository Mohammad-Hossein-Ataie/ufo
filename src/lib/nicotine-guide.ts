export const NICOTINE_CIGARETTE_COUNT_MIN = 1;
export const NICOTINE_CIGARETTE_COUNT_MAX = 100;

export const nicotinePerCigaretteMg = {
  unknown: 0.7,
  light: 0.4,
  medium: 0.7,
  heavy: 1,
} as const;

export type CigaretteType = keyof typeof nicotinePerCigaretteMg;

export const nicotineRecommendationStrengths = [20, 25, 35, 50] as const;
export type NicotineRecommendationStrength = (typeof nicotineRecommendationStrengths)[number];

export type NicotineCalculationError =
  | "required"
  | "invalid-count"
  | "out-of-range"
  | "invalid-cigarette-type";

export interface NicotineRecommendationResult {
  cigCount: number;
  cigType: CigaretteType;
  nicPerCig: number;
  totalDailyNicotine: number;
  packs: number;
  recommendedStrength: NicotineRecommendationStrength;
}

export type NicotineCalculationOutcome =
  | { ok: true; result: NicotineRecommendationResult }
  | { ok: false; error: NicotineCalculationError };

export interface NicotineCalculationInput {
  cigCount: number | string | null | undefined;
  cigType: CigaretteType | string;
}

function recommendedStrengthFor(totalDailyNicotine: number): NicotineRecommendationStrength {
  if (totalDailyNicotine < 7) return 20;
  if (totalDailyNicotine < 12) return 25;
  if (totalDailyNicotine < 18) return 35;
  return 50;
}

export function calculateNicotineRecommendation({
  cigCount,
  cigType,
}: NicotineCalculationInput): NicotineCalculationOutcome {
  if (cigCount === null || cigCount === undefined || String(cigCount).trim() === "") {
    return { ok: false, error: "required" };
  }

  const normalizedCount = typeof cigCount === "number" ? cigCount : Number(cigCount);
  if (!Number.isFinite(normalizedCount) || !Number.isInteger(normalizedCount)) {
    return { ok: false, error: "invalid-count" };
  }
  if (
    normalizedCount < NICOTINE_CIGARETTE_COUNT_MIN ||
    normalizedCount > NICOTINE_CIGARETTE_COUNT_MAX
  ) {
    return { ok: false, error: "out-of-range" };
  }
  if (!Object.prototype.hasOwnProperty.call(nicotinePerCigaretteMg, cigType)) {
    return { ok: false, error: "invalid-cigarette-type" };
  }

  const normalizedType = cigType as CigaretteType;
  const nicPerCig = nicotinePerCigaretteMg[normalizedType];
  const totalDailyNicotine = Number((normalizedCount * nicPerCig).toFixed(10));

  return {
    ok: true,
    result: {
      cigCount: normalizedCount,
      cigType: normalizedType,
      nicPerCig,
      totalDailyNicotine,
      packs: normalizedCount / 20,
      recommendedStrength: recommendedStrengthFor(totalDailyNicotine),
    },
  };
}
