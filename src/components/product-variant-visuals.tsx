import { Check, Citrus, Droplets, Grape, Leaf, Snowflake, Sparkles } from "lucide-react";
import type { StorefrontVariantOption } from "@/lib/storefront-variants";

const flavorThemes: Record<string, { bg: string; fg: string; ring: string; label: string }> = {
  watermelon: { bg: "#ECFDF5", fg: "#E11D48", ring: "#22C55E", label: "W" },
  berry: { bg: "#EFF6FF", fg: "#2563EB", ring: "#7C3AED", label: "B" },
  blueberry: { bg: "#EFF6FF", fg: "#2563EB", ring: "#7C3AED", label: "B" },
  mint: { bg: "#ECFDF5", fg: "#059669", ring: "#34D399", label: "M" },
  grape: { bg: "#F5F3FF", fg: "#7C3AED", ring: "#A855F7", label: "G" },
  mango: { bg: "#FFF7ED", fg: "#EA580C", ring: "#F59E0B", label: "M" },
  cola: { bg: "#FEF3C7", fg: "#78350F", ring: "#F59E0B", label: "C" },
  leaf: { bg: "#F0FDF4", fg: "#166534", ring: "#16A34A", label: "L" },
  tobacco: { bg: "#FEF3C7", fg: "#92400E", ring: "#D97706", label: "T" },
  strawberry: { bg: "#FFF1F2", fg: "#E11D48", ring: "#FB7185", label: "S" },
  kiwi: { bg: "#F0FDF4", fg: "#65A30D", ring: "#84CC16", label: "K" },
  fallback: { bg: "#ECFEFF", fg: "#0891B2", ring: "#22D3EE", label: "F" },
};

function swatchStyle(swatch: string) {
  return swatch.startsWith("linear-gradient")
    ? { backgroundImage: swatch }
    : { backgroundColor: swatch };
}

function flavorKey(option: StorefrontVariantOption) {
  const raw = `${option.iconKey ?? ""} ${option.id} ${option.labelFa}`.toLowerCase();
  if (raw.includes("watermelon")) return "watermelon";
  if (raw.includes("blueberry")) return "blueberry";
  if (raw.includes("berry") || raw.includes("strawberry")) return "berry";
  if (raw.includes("mint")) return "mint";
  if (raw.includes("grape")) return "grape";
  if (raw.includes("mango")) return "mango";
  if (raw.includes("cola")) return "cola";
  if (raw.includes("tobacco") || raw.includes("leaf")) return "tobacco";
  if (raw.includes("kiwi")) return "kiwi";
  return "fallback";
}

function FlavorGlyph({ option }: { option: StorefrontVariantOption }) {
  const customGlyph = option.iconKey?.trim();
  if (customGlyph && !/^[a-z0-9-_\s]+$/i.test(customGlyph)) {
    return <span className="text-base leading-none">{customGlyph.slice(0, 2)}</span>;
  }

  const key = flavorKey(option);
  if (key === "mint" || key === "tobacco" || key === "kiwi") return <Leaf size={15} />;
  if (key === "grape") return <Grape size={15} />;
  if (key === "mango" || key === "cola") return <Citrus size={15} />;
  if (key === "watermelon" || key === "berry" || key === "blueberry") return <Droplets size={15} />;
  return <Sparkles size={15} />;
}

export function FlavorVisual({
  option,
  className = "",
}: {
  option: StorefrontVariantOption;
  className?: string;
}) {
  const theme = flavorThemes[flavorKey(option)] ?? flavorThemes.fallback!;
  const icy =
    option.id.toLowerCase().includes("ice") ||
    option.labelFa.includes("یخ") ||
    option.labelFa.toLowerCase().includes("ice");

  return (
    <span
      className={`relative inline-flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border text-sm font-black shadow-sm ${className}`}
      style={{ backgroundColor: theme.bg, borderColor: theme.ring, color: theme.fg }}
      aria-hidden="true"
    >
      <FlavorGlyph option={option} />
      {icy ? (
        <span className="absolute -left-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-cyan-100 text-cyan-700">
          <Snowflake size={10} />
        </span>
      ) : null}
    </span>
  );
}

export function VariantOptionVisual({
  option,
  size = "md",
}: {
  option: StorefrontVariantOption;
  size?: "sm" | "md";
}) {
  if (option.type === "color" && option.swatch) {
    return (
      <span
        className={
          size === "sm"
            ? "h-4 w-4 rounded-full border border-current/25"
            : "h-6 w-6 rounded-full border border-current/25"
        }
        style={swatchStyle(option.swatch)}
        aria-hidden="true"
      />
    );
  }

  return <FlavorVisual option={option} className={size === "sm" ? "h-6 w-6" : ""} />;
}

export function ProductVariantSummary({
  options,
  tone = "dark",
  max = 4,
}: {
  options: StorefrontVariantOption[];
  tone?: "dark" | "light";
  max?: number;
}) {
  if (options.length === 0) return null;
  const variantType = options[0]?.type;
  const isDark = tone === "dark";
  const visible = options.slice(0, max);
  const hidden = Math.max(0, options.length - visible.length);

  return (
    <div className="grid gap-2 text-xs">
      <div className="flex min-h-7 flex-wrap items-center gap-1.5">
        {visible.map((option) => (
          <span
            key={option.id}
            className={`inline-flex select-none items-center gap-1 rounded-full border px-2 py-1 font-bold ${
              isDark
                ? "border-white/10 bg-white/5 text-retail-secondary"
                : "border-[#D5D9C9] bg-white text-[#596B61]"
            }`}
          >
            <VariantOptionVisual option={option} size="sm" />
            {variantType === "color" ? option.labelFa : null}
          </span>
        ))}
        {hidden > 0 ? (
          <span
            className={`inline-flex select-none rounded-full px-2 py-1 font-black ${
              isDark ? "bg-white/10 text-white" : "bg-[#F7F7F2] text-[#14201B]"
            }`}
          >
            +{new Intl.NumberFormat("fa-IR").format(hidden)}
          </span>
        ) : null}
      </div>
      <p className={isDark ? "text-retail-secondary" : "text-[#596B61]"}>
        {new Intl.NumberFormat("fa-IR").format(options.length)}{" "}
        {variantType === "flavor" ? "طعم موجود" : "رنگ موجود"}
      </p>
    </div>
  );
}

export function SelectedCheck() {
  return <Check size={15} aria-hidden="true" />;
}
