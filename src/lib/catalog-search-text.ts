const commonAliases: Record<string, string[]> = {
  پاد: ["pod"],
  ویپ: ["vape"],
  کویل: ["coil"],
  کارتریج: ["cartridge"],
  جویس: ["juice", "liquid"],
  سالت: ["salt"],
  ویپو: ["voopoo"],
  آرگاس: ["argus"],
  ارگاس: ["argus"],
  جی: ["g"],
};

export function normalizeCatalogSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/(\p{L})(\p{N})/gu, "$1 $2")
    .replace(/(\p{N})(\p{L})/gu, "$1 $2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

export function catalogSearchTokenGroups(query: string): string[][] {
  const tokens = normalizeCatalogSearchText(query).split(/\s+/).filter(Boolean);
  return tokens.map((token) => [token, ...(commonAliases[token] ?? [])]);
}

export function expandCatalogSearchTokens(query: string): string[] {
  return [...new Set(catalogSearchTokenGroups(query).flat())];
}
