"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Search } from "lucide-react";
import type { Brand } from "@ufo/types";
import { getBrandLogoUrl } from "@/lib/partner-brand-logos";

export function BrandImageManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/admin/brands", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as { brands?: Brand[]; error?: string };
        if (!response.ok || !data.brands)
          throw new Error(data.error || "دریافت برندها ناموفق بود.");
        setBrands(data.brands);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "دریافت برندها ناموفق بود.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const visibleBrands = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fa");
    return brands
      .filter(
        (brand) =>
          !needle || `${brand.nameFa} ${brand.slug}`.toLocaleLowerCase("fa").includes(needle),
      )
      .sort((left, right) => left.nameFa.localeCompare(right.nameFa, "fa"));
  }, [brands, query]);

  async function upload(brand: Brand, file: File) {
    setError("");
    setMessage("");
    if (file.size > 4 * 1024 * 1024) {
      setError("حداکثر حجم تصویر ۴ مگابایت است.");
      return;
    }
    setUploadingId(brand.id);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(`/api/admin/brands/${encodeURIComponent(brand.id)}/image`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { brand?: Brand; error?: string };
      if (!response.ok || !data.brand)
        throw new Error(data.error || "آپلود تصویر برند ناموفق بود.");
      setBrands((current) => current.map((item) => (item.id === brand.id ? data.brand! : item)));
      setMessage(`تصویر ${brand.nameFa} ذخیره شد و در لندینگ نمایش داده می‌شود.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "آپلود تصویر برند ناموفق بود.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <section
      className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby="brand-images-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="brand-images-heading" className="text-lg font-black text-slate-950">
            لوگوهای برندها
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            ترجیحاً لوگوی بدون پس‌زمینه (PNG یا WebP شفاف) آپلود کنید تا روی کارت‌های تیرهٔ سایت
            تمیز دیده شود. تصویر به WebP سبک تبدیل می‌شود؛ پس‌زمینهٔ شفاف حفظ می‌شود و تصویر برش
            نمی‌خورد.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            فرمت‌های مجاز: PNG، WebP، JPEG و AVIF · حداکثر ۴ مگابایت · پیشنهاد: عرض دست‌کم ۶۴۰ پیکسل
          </p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">
          {new Intl.NumberFormat("fa-IR").format(brands.length)} برند
        </span>
      </div>

      <label className="mt-5 flex max-w-sm items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100">
        <Search size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
        <span className="sr-only">جست‌وجوی برند</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی برند"
          className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none"
        />
      </label>

      {error ? (
        <p role="alert" className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="mt-6 text-sm text-slate-500">
          در حال دریافت برندها…
        </p>
      ) : null}
      {!loading && visibleBrands.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">برندی پیدا نشد.</p>
      ) : null}

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleBrands.map((brand) => {
          const logo = getBrandLogoUrl(brand);
          const isUploading = uploadingId === brand.id;
          return (
            <li
              key={brand.id}
              className="flex min-w-0 flex-col rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-slate-950">{brand.nameFa}</h3>
                  <p dir="ltr" className="truncate text-left text-xs text-slate-500">
                    {brand.slug}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${brand.logoUrl ? "bg-emerald-100 text-emerald-800" : logo ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"}`}
                >
                  {brand.logoUrl ? "آپلود شده" : logo ? "تصویر پیش‌فرض" : "بدون تصویر"}
                </span>
              </div>
              <div className="relative mt-4 flex h-28 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-[#101820] p-3">
                {logo ? (
                  <Image
                    src={logo}
                    alt={`پیش‌نمایش لوگوی ${brand.nameFa}`}
                    width={240}
                    height={96}
                    unoptimized
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-300">
                    <ImagePlus size={24} className="mx-auto mb-2" aria-hidden="true" />
                    هنوز تصویری ثبت نشده است
                  </div>
                )}
              </div>
              <label
                className={`mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-cyan-700 bg-white px-4 text-sm font-bold text-cyan-800 transition hover:bg-cyan-50 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-600 ${isUploading ? "pointer-events-none opacity-60" : ""}`}
              >
                <ImagePlus size={17} aria-hidden="true" />
                {isUploading ? "در حال آپلود…" : logo ? "تغییر تصویر" : "آپلود تصویر"}
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg,image/avif"
                  className="sr-only"
                  disabled={Boolean(uploadingId)}
                  aria-label={`آپلود تصویر برند ${brand.nameFa}`}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) void upload(brand, file);
                  }}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
