export type FirstCigaretteTiming = "within-30" | "within-60" | "after-60" | "unknown";
export type VapingDevice = "pod-mtl" | "mod-dtl" | "unknown";

export type DependenceBand = "light" | "moderate" | "regular" | "high";
export type NicotineLiquidKind = "salt" | "freebase";

export interface NicotineRecommendationTarget {
  kind: NicotineLiquidKind;
  minMg: number;
  maxMg: number;
}

export interface NicotineGuideResult {
  band: DependenceBand;
  bandLabel: string;
  productType: string;
  nicotineStrength: string;
  alternative: string;
  explanation: string;
  catalogHref: string;
  recommendationKey: `${VapingDevice}:${DependenceBand}`;
}

const bands: DependenceBand[] = ["light", "moderate", "regular", "high"];

function baseBand(cigarettesPerDay: number): DependenceBand {
  if (cigarettesPerDay <= 5) return "light";
  if (cigarettesPerDay <= 10) return "moderate";
  if (cigarettesPerDay <= 20) return "regular";
  return "high";
}

function adjustedBand(
  cigarettesPerDay: number,
  firstCigarette: FirstCigaretteTiming,
): DependenceBand {
  const initial = baseBand(cigarettesPerDay);
  if (firstCigarette !== "within-30") return initial;

  return bands[Math.min(bands.indexOf(initial) + 1, bands.length - 1)]!;
}

const bandLabels: Record<DependenceBand, string> = {
  light: "مصرف کم",
  moderate: "مصرف کم تا متوسط",
  regular: "مصرف متوسط",
  high: "مصرف بالا یا وابستگی بیشتر",
};

const podStrengths: Record<DependenceBand, string> = {
  light: "5–10 mg/ml",
  moderate: "10–12 mg/ml",
  regular: "12–18 mg/ml",
  high: "18–20 mg/ml",
};

const freebaseStrengths: Record<DependenceBand, string> = {
  light: "3 mg/ml",
  moderate: "3–6 mg/ml",
  regular: "6 mg/ml",
  high: "6 mg/ml",
};

const podStrengthRanges: Record<DependenceBand, [number, number]> = {
  light: [5, 10],
  moderate: [10, 12],
  regular: [12, 18],
  high: [18, 20],
};

const freebaseStrengthRanges: Record<DependenceBand, [number, number]> = {
  light: [3, 3],
  moderate: [3, 6],
  regular: [6, 6],
  high: [6, 6],
};

export const nicotineDependenceBands = [...bands];
export const nicotineGuideDevices: VapingDevice[] = ["pod-mtl", "mod-dtl", "unknown"];

export function getNicotineRecommendationTargets(
  device: VapingDevice,
  band: DependenceBand,
): NicotineRecommendationTarget[] {
  const [saltMin, saltMax] = podStrengthRanges[band];
  const [freebaseMin, freebaseMax] = freebaseStrengthRanges[band];
  if (device === "pod-mtl") return [{ kind: "salt", minMg: saltMin, maxMg: saltMax }];
  if (device === "mod-dtl") {
    return [{ kind: "freebase", minMg: freebaseMin, maxMg: freebaseMax }];
  }
  return [
    { kind: "salt", minMg: saltMin, maxMg: saltMax },
    { kind: "freebase", minMg: freebaseMin, maxMg: freebaseMax },
  ];
}

export function getNicotineGuide(
  cigarettesPerDay: number,
  firstCigarette: FirstCigaretteTiming,
  device: VapingDevice,
): NicotineGuideResult {
  const band = adjustedBand(cigarettesPerDay, firstCigarette);
  const dependenceNote =
    firstCigarette === "within-30"
      ? "زمان کوتاه تا اولین سیگار می‌تواند نشانه وابستگی بیشتر باشد؛ به همین دلیل بازه یک پله بالاتر در نظر گرفته شده است."
      : "این بازه از تعداد سیگار روزانه به‌عنوان نقطه شروع استفاده می‌کند و ممکن است با الگوی مصرف واقعی شما فرق داشته باشد.";

  if (device === "mod-dtl") {
    return {
      band,
      bandLabel: bandLabels[band],
      productType: "جویس معمولی (فری‌بیس)",
      nicotineStrength: freebaseStrengths[band],
      alternative: `اگر از پاد کم‌وات و کام‌دهی دهان‌به‌ریه استفاده می‌کنید، سالت ${podStrengths[band]} را بررسی کنید.`,
      explanation: `${dependenceNote} دستگاه‌های پرقدرت بخار بیشتری تولید می‌کنند و معمولاً با غلظت پایین‌تر استفاده می‌شوند.`,
      catalogHref: "/products/category/e-liquid",
      recommendationKey: `${device}:${band}`,
    };
  }

  if (device === "pod-mtl") {
    return {
      band,
      bandLabel: bandLabels[band],
      productType: "سالت نیکوتین برای پاد کم‌وات",
      nicotineStrength: podStrengths[band],
      alternative: `برای ویپ یا مود پرقدرت، جویس فری‌بیس ${freebaseStrengths[band]} مناسب‌تر است.`,
      explanation: `${dependenceNote} سالت نیکوتین را در دستگاه پرقدرت یا با کویل کم‌اهم استفاده نکنید.`,
      catalogHref: "/products/category/salt-nicotine",
      recommendationKey: `${device}:${band}`,
    };
  }

  return {
    band,
    bandLabel: bandLabels[band],
    productType: "ابتدا نوع دستگاه را مشخص کنید",
    nicotineStrength: `پاد کم‌وات: سالت ${podStrengths[band]}`,
    alternative: `ویپ/مود پرقدرت: جویس فری‌بیس ${freebaseStrengths[band]}`,
    explanation: `${dependenceNote} غلظت مناسب به توان، مقاومت کویل و شیوه کام‌دهی وابسته است؛ قبل از خرید مشخصات دستگاه را بررسی کنید.`,
    catalogHref: "/products",
    recommendationKey: `${device}:${band}`,
  };
}
