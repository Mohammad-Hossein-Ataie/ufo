import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { ProductVariantSummary } from "@/components/product-variant-visuals";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

it("labels resistance chips with their actual value and unit instead of colors", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProductVariantSummary, {
      options: [
        { id: "0.2", labelFa: "0.2", type: "resistance" },
        { id: "0.8", labelFa: "0.8 Ω", type: "resistance" },
      ],
    }),
  );
  expect(html).toContain("0.2 Ω");
  expect(html).toContain("0.8 Ω");
  expect(html).not.toContain("Ω Ω");
  expect(html).not.toContain("رنگ");
  expect(html).not.toContain("<button");
});
