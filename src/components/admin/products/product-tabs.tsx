"use client";
export const productTabs = [
  { id: "basic", label: "اطلاعات پایه" },
  { id: "pricing", label: "قیمت و موجودی" },
  { id: "variants", label: "تنوع‌ها" },
  { id: "images", label: "تصاویر" },
  { id: "seo", label: "سئو" },
  { id: "specs", label: "مشخصات فنی" },
] as const;
export type ProductTab = (typeof productTabs)[number]["id"];
export function ProductTabs({
  active,
  onChange,
}: {
  active: ProductTab;
  onChange: (tab: ProductTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="بخش‌های ویرایش محصول"
      className="flex shrink-0 overflow-x-auto border-b border-[#D7DDE4] bg-slate-50 px-4"
      dir="rtl"
    >
      {productTabs.map((tab, index) => (
        <button
          type="button"
          key={tab.id}
          id={`product-tab-${tab.id}`}
          role="tab"
          aria-selected={active === tab.id}
          aria-controls="product-tab-panel"
          tabIndex={active === tab.id ? 0 : -1}
          className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-bold ${active === tab.id ? "border-[#168BFF] bg-blue-50 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowLeft") next = (index + 1) % productTabs.length;
            else if (event.key === "ArrowRight")
              next = (index + productTabs.length - 1) % productTabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = productTabs.length - 1;
            else return;
            event.preventDefault();
            const target = productTabs[next]!;
            onChange(target.id);
            document.getElementById(`product-tab-${target.id}`)?.focus();
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
