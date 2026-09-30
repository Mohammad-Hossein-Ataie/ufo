import { describe, expect, it } from "vitest";
import {
  calculateNicotineRecommendation,
  nicotineRecommendationStrengths,
  type CigaretteType,
  type NicotineRecommendationResult,
} from "@/lib/nicotine-guide";

function calculate(cigCount: number | string | null | undefined, cigType: CigaretteType) {
  const outcome = calculateNicotineRecommendation({ cigCount, cigType });
  expect(outcome.ok).toBe(true);
  if (!outcome.ok) throw new Error(`Unexpected calculation error: ${outcome.error}`);
  return outcome.result;
}

function expectRecommendation(
  cigCount: number,
  cigType: CigaretteType,
  expected: Partial<NicotineRecommendationResult>,
) {
  expect(calculate(cigCount, cigType)).toMatchObject(expected);
}

describe("client nicotine calculator", () => {
  it.each([
    { cigCount: 10, cigType: "light" as const, total: 4, strength: 20 },
    { cigCount: 10, cigType: "medium" as const, total: 7, strength: 25 },
    { cigCount: 20, cigType: "medium" as const, total: 14, strength: 35 },
    { cigCount: 20, cigType: "heavy" as const, total: 20, strength: 50 },
  ])(
    "$cigCount cigarettes of type $cigType returns $strength mg",
    ({ cigCount, cigType, total, strength }) => {
      expectRecommendation(cigCount, cigType, {
        totalDailyNicotine: total,
        recommendedStrength: strength,
      });
    },
  );

  it.each([
    { label: "just below 7", cigCount: 17, cigType: "light" as const, total: 6.8, strength: 20 },
    { label: "at 7", cigCount: 10, cigType: "medium" as const, total: 7, strength: 25 },
    {
      label: "just below 12",
      cigCount: 17,
      cigType: "medium" as const,
      total: 11.9,
      strength: 25,
    },
    { label: "at 12", cigCount: 12, cigType: "heavy" as const, total: 12, strength: 35 },
    {
      label: "just below 18",
      cigCount: 25,
      cigType: "medium" as const,
      total: 17.5,
      strength: 35,
    },
    { label: "at 18", cigCount: 18, cigType: "heavy" as const, total: 18, strength: 50 },
  ])("uses the original threshold $label", ({ cigCount, cigType, total, strength }) => {
    expectRecommendation(cigCount, cigType, {
      totalDailyNicotine: total,
      recommendedStrength: strength,
    });
  });

  it("uses the original coefficient for every cigarette type", () => {
    expect(calculate(10, "unknown").nicPerCig).toBe(0.7);
    expect(calculate(10, "light").nicPerCig).toBe(0.4);
    expect(calculate(10, "medium").nicPerCig).toBe(0.7);
    expect(calculate(10, "heavy").nicPerCig).toBe(1);
  });

  it("calculates packs using a 20-cigarette pack", () => {
    expect(calculate(35, "medium").packs).toBe(1.75);
  });

  it("accepts the minimum and maximum supported counts", () => {
    expect(calculate(1, "light").recommendedStrength).toBe(20);
    expect(calculate(100, "heavy").recommendedStrength).toBe(50);
  });

  it("does not collapse a high valid input into the lowest result", () => {
    const low = calculate(1, "light");
    const high = calculate(80, "heavy");

    expect(low.recommendedStrength).toBe(20);
    expect(high.totalDailyNicotine).toBe(80);
    expect(high.recommendedStrength).toBe(50);
    expect(high.recommendedStrength).not.toBe(low.recommendedStrength);
  });

  it("only returns the four client-defined strengths", () => {
    const results = (["unknown", "light", "medium", "heavy"] as const).flatMap((cigType) =>
      [1, 5, 10, 18, 30, 60, 100].map(
        (cigCount) => calculate(cigCount, cigType).recommendedStrength,
      ),
    );

    expect(results.every((strength) => nicotineRecommendationStrengths.includes(strength))).toBe(
      true,
    );
  });

  it.each([
    { label: "empty", cigCount: "", error: "required" },
    { label: "zero", cigCount: 0, error: "out-of-range" },
    { label: "negative", cigCount: -1, error: "out-of-range" },
    { label: "non-number", cigCount: "not-a-number", error: "invalid-count" },
    { label: "decimal", cigCount: 1.5, error: "invalid-count" },
    { label: "above maximum", cigCount: 101, error: "out-of-range" },
  ])("rejects $label cigarette counts", ({ cigCount, error }) => {
    expect(calculateNicotineRecommendation({ cigCount, cigType: "medium" })).toEqual({
      ok: false,
      error,
    });
  });

  it("rejects an unknown cigarette type defensively", () => {
    expect(calculateNicotineRecommendation({ cigCount: 10, cigType: "invalid" })).toEqual({
      ok: false,
      error: "invalid-cigarette-type",
    });
  });
});
