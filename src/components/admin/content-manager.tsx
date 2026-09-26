"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  FilePenLine,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import type {
  ContentAudience,
  ContentPost,
  ContentPostStatus,
  ContentPostType,
} from "@/lib/content-posts";
import { AdminPage, AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/admin-ui";

type EditorForm = {
  id: string;
  type: ContentPostType;
  audience: ContentAudience;
  status: ContentPostStatus;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  coverAlt: string;
  category: string;
  tags: string;
  author: string;
  sources: string;
  seoTitle: string;
  seoDescription: string;
  scheduledAt: string;
};

const emptyForm: EditorForm = {
  id: "",
  type: "article",
  audience: "retail",
  status: "draft",
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: "",
  coverAlt: "",
  category: "راهنمای خرید",
  tags: "",
  author: "تحریریه یوفوپاف",
  sources: "",
  seoTitle: "",
  seoDescription: "",
  scheduledAt: "",
};

function localDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toForm(post: ContentPost): EditorForm {
  return {
    ...emptyForm,
    ...post,
    tags: post.tags.join("، "),
    sources: post.sources.join("\n"),
    scheduledAt: localDateTime(post.scheduledAt),
  };
}

function formatDate(value?: string) {
  return value
    ? new Date(value).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    : "بدون تاریخ";
}

const fieldClass =
  "mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

function Counter({ value, recommended, max }: { value: string; recommended: [number, number]; max: number }) {
  const good = value.length >= recommended[0] && value.length <= recommended[1];
  return (
    <span className={good ? "text-emerald-700" : value.length > max ? "text-rose-700" : "text-amber-700"}>
      {value.length.toLocaleString("fa-IR")} / {max.toLocaleString("fa-IR")}
    </span>
  );
}

export function ContentManager() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContentPostType>("all");
  const [audienceFilter, setAudienceFilter] = useState<"all" | ContentAudience>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ContentPostStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store" });
      const payload = (await response.json()) as { posts?: ContentPost[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "دریافت مطالب انجام نشد.");
      setPosts(payload.posts ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "دریافت مطالب انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter(
      (post) =>
        (typeFilter === "all" || post.type === typeFilter) &&
        (audienceFilter === "all" || post.audience === audienceFilter) &&
        (statusFilter === "all" || post.status === statusFilter) &&
        (!normalized ||
          [post.title, post.slug, post.category, post.author, ...post.tags]
            .join(" ")
            .toLowerCase()
            .includes(normalized)),
    );
  }, [audienceFilter, posts, query, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      published: posts.filter((post) => post.status === "published").length,
      draft: posts.filter((post) => post.status === "draft").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
    }),
    [posts],
  );

  function update<K extends keyof EditorForm>(key: K, value: EditorForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function createNew() {
    setForm(emptyForm);
    setMessage("");
    setError("");
    document.getElementById("content-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(form.id ? `/api/admin/content/${form.id}` : "/api/admin/content", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(/[،,\n]/).map((value) => value.trim()).filter(Boolean),
          sources: form.sources.split(/\n/).map((value) => value.trim()).filter(Boolean),
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
        }),
      });
      const payload = (await response.json()) as { post?: ContentPost; message?: string; error?: string };
      if (!response.ok || !payload.post) throw new Error(payload.error ?? "ذخیره مطلب انجام نشد.");
      setForm(toForm(payload.post));
      setPosts((current) => {
        const rest = current.filter((post) => post.id !== payload.post!.id);
        return [payload.post!, ...rest];
      });
      setMessage(payload.message ?? "مطلب ذخیره شد.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ذخیره مطلب انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!form.id || !window.confirm("این مطلب برای همیشه حذف شود؟")) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/content/${form.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "حذف مطلب انجام نشد.");
      setPosts((current) => current.filter((post) => post.id !== form.id));
      setForm(emptyForm);
      setMessage(payload.message ?? "مطلب حذف شد.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حذف مطلب انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/content/upload", { method: "POST", body });
      const payload = (await response.json()) as { url?: string; message?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "آپلود تصویر انجام نشد.");
      update("coverImage", payload.url);
      setMessage(payload.message ?? "تصویر آماده شد.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "آپلود تصویر انجام نشد.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="مرکز محتوا"
        title="اخبار و مقالات"
        description="از پیش‌نویس تا انتشار و زمان‌بندی، همراه با تصویر شاخص، پیش‌نمایش نتیجه گوگل و کنترل‌های ضروری SEO."
        actions={
          <button
            type="button"
            onClick={createNew}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-black text-white hover:bg-cyan-800"
          >
            <Plus size={18} /> مطلب جدید
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="منتشرشده" value={stats.published.toLocaleString("fa-IR")} icon={<CheckCircle2 size={20} />} tone="success" />
        <AdminStatCard label="پیش‌نویس" value={stats.draft.toLocaleString("fa-IR")} icon={<FilePenLine size={20} />} tone="neutral" />
        <AdminStatCard label="زمان‌بندی‌شده" value={stats.scheduled.toLocaleString("fa-IR")} icon={<CalendarClock size={20} />} tone="warning" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <AdminPanel className="overflow-hidden xl:sticky xl:top-20">
          <div className="border-b border-slate-200 p-4">
            <label className="relative block">
              <Search className="absolute right-3 top-3 text-slate-400" size={17} />
              <span className="sr-only">جست‌وجوی محتوا</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="عنوان، دسته یا نویسنده" className="min-h-11 w-full rounded-md border border-slate-300 pr-10 pl-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select aria-label="نوع محتوا" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="min-h-10 rounded-md border border-slate-300 bg-white px-2 text-sm">
                <option value="all">همه انواع</option><option value="article">مقاله</option><option value="news">خبر</option>
              </select>
              <select aria-label="وضعیت محتوا" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="min-h-10 rounded-md border border-slate-300 bg-white px-2 text-sm">
                <option value="all">همه وضعیت‌ها</option><option value="published">منتشرشده</option><option value="draft">پیش‌نویس</option><option value="scheduled">زمان‌بندی</option>
              </select>
              <select aria-label="ویترین محتوا" value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value as typeof audienceFilter)} className="col-span-2 min-h-10 rounded-md border border-slate-300 bg-white px-2 text-sm">
                <option value="all">همه ویترین‌ها</option><option value="retail">خرده‌فروشی</option><option value="wholesale">عمده‌فروشی</option>
              </select>
            </div>
          </div>
          <div className="max-h-[65vh] overflow-y-auto p-2">
            {loading ? <p className="p-4 text-sm text-slate-500">در حال دریافت مطالب...</p> : filtered.length === 0 ? <p className="p-4 text-sm text-slate-500">مطلبی با این فیلتر پیدا نشد.</p> : filtered.map((post) => (
              <button key={post.id} type="button" onClick={() => { setForm(toForm(post)); setError(""); setMessage(""); }} className={`mb-2 w-full rounded-md border p-3 text-right transition ${form.id === post.id ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <span className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-cyan-800"><span>{post.type === "news" ? "خبر" : "مقاله"}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{post.audience === "wholesale" ? "عمده" : "خرده"}</span></span>
                  <span className="text-slate-500">{post.status === "published" ? "منتشرشده" : post.status === "scheduled" ? "زمان‌بندی" : "پیش‌نویس"}</span>
                </span>
                <strong className="mt-2 line-clamp-2 block text-sm leading-6 text-slate-900">{post.title}</strong>
                <span className="mt-2 block text-xs text-slate-500">{formatDate(post.updatedAt)}</span>
              </button>
            ))}
          </div>
        </AdminPanel>

        <form id="content-editor" onSubmit={save} className="grid gap-5 scroll-mt-24">
          {message ? <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{message}</div> : null}
          {error ? <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div> : null}

          <AdminPanel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div><h2 className="text-lg font-black">{form.id ? "ویرایش مطلب" : "مطلب جدید"}</h2><p className="mt-1 text-xs text-slate-500">ابتدا محتوا را به‌صورت پیش‌نویس ذخیره و سپس منتشر کنید.</p></div>
              <div className="flex flex-wrap gap-2">
                {form.id && form.status === "published" ? <Link href={`${form.audience === "wholesale" ? "/b2b/blog" : "/blog"}/${form.slug}`} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-700"><Eye size={16} /> مشاهده</Link> : null}
                {form.id ? <button type="button" onClick={() => void remove()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-rose-200 px-3 text-sm font-bold text-rose-700 disabled:opacity-50"><Trash2 size={16} /> حذف</button> : null}
                <button type="submit" disabled={saving || uploading} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{saving ? "در حال ذخیره..." : "ذخیره مطلب"}</button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <fieldset className="sm:col-span-2">
                <legend className="text-sm font-bold text-slate-700">ویترین انتشار</legend>
                <p className="mt-1 text-xs leading-6 text-slate-500">مطلب فقط در مجله و لندینگ همان ویترین نمایش داده می‌شود و URL اختصاصی خودش را می‌گیرد.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {([
                    { value: "retail", title: "خرده‌فروشی", description: "برای مشتری نهایی و مسیر خرید تکی" },
                    { value: "wholesale", title: "عمده‌فروشی", description: "برای همکار فروشگاهی و سفارش کارتنی" },
                  ] as const).map((item) => (
                    <label key={item.value} className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-md border p-4 transition ${form.audience === item.value ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <input type="radio" name="content-audience" value={item.value} checked={form.audience === item.value} onChange={() => update("audience", item.value)} className="size-4 accent-cyan-700" />
                      <span><strong className="block text-sm text-slate-900">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="text-sm font-bold text-slate-700">نوع محتوا<select value={form.type} onChange={(event) => { const type = event.target.value as ContentPostType; setForm((current) => ({ ...current, type, category: current.id ? current.category : type === "news" ? "اخبار فروشگاه" : "راهنمای خرید" })); }} className={fieldClass}><option value="article">مقاله آموزشی</option><option value="news">خبر</option></select></label>
              <label className="text-sm font-bold text-slate-700">وضعیت انتشار<select value={form.status} onChange={(event) => update("status", event.target.value as ContentPostStatus)} className={fieldClass}><option value="draft">پیش‌نویس</option><option value="published">انتشار فوری</option><option value="scheduled">انتشار زمان‌بندی‌شده</option></select></label>
              {form.status === "scheduled" ? <label className="text-sm font-bold text-slate-700 sm:col-span-2">زمان انتشار<input type="datetime-local" required value={form.scheduledAt} onChange={(event) => update("scheduledAt", event.target.value)} className={fieldClass} /></label> : null}
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">عنوان مطلب <span className="float-left text-xs font-normal"><Counter value={form.title} recommended={[40, 65]} max={140} /></span><input required minLength={10} maxLength={140} value={form.title} onChange={(event) => update("title", event.target.value)} className={fieldClass} placeholder="عنوان روشن و مشخص برای مخاطب" /></label>
              <label className="text-sm font-bold text-slate-700">اسلاگ URL<input dir="ltr" maxLength={120} value={form.slug} onChange={(event) => update("slug", event.target.value)} className={fieldClass} placeholder="product-buying-guide" /><span className="mt-1 block text-xs font-normal text-slate-500">اگر خالی باشد از عنوان ساخته می‌شود.</span></label>
              <label className="text-sm font-bold text-slate-700">دسته‌بندی<input required maxLength={80} value={form.category} onChange={(event) => update("category", event.target.value)} className={fieldClass} placeholder="راهنمای خرید" /></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">خلاصه <span className="float-left text-xs font-normal"><Counter value={form.excerpt} recommended={[90, 180]} max={320} /></span><textarea required minLength={30} maxLength={320} rows={3} value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} className={`${fieldClass} py-3`} placeholder="خلاصه‌ای مستقل که در کارت و ابتدای مطلب معنا داشته باشد." /></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">متن اصلی<textarea required minLength={80} rows={16} value={form.body} onChange={(event) => update("body", event.target.value)} className={`${fieldClass} py-3 leading-7`} placeholder={"مقدمه مطلب...\n\n## تیتر بخش\nمتن بخش...\n\n- مورد اول\n- مورد دوم"} /><span className="mt-1 block text-xs font-normal text-slate-500">برای تیتر از ## و برای فهرست از - استفاده کنید. HTML خام پذیرفته نمی‌شود.</span></label>
            </div>
          </AdminPanel>

          <AdminPanel className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><ImagePlus size={20} className="text-cyan-700" /> تصویر شاخص</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[14rem_1fr]">
              <div className="relative aspect-video overflow-hidden rounded-md border border-slate-200 bg-slate-100">{form.coverImage ? <Image src={form.coverImage} alt={form.coverAlt || "پیش‌نمایش تصویر شاخص"} fill unoptimized className="object-cover" sizes="224px" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">بدون تصویر</div>}</div>
              <div className="grid content-start gap-3">
                <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">{uploading ? <LoaderCircle className="animate-spin" size={17} /> : <ImagePlus size={17} />}{uploading ? "در حال آماده‌سازی..." : "انتخاب و آپلود تصویر"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => void upload(event)} disabled={uploading} /></label>
                <p className="text-xs leading-6 text-slate-500">تصویر به WebP با ابعاد ۱۶۰۰×۹۰۰ تبدیل می‌شود. حداکثر حجم ورودی ۸ مگابایت است.</p>
                <label className="text-sm font-bold text-slate-700">متن جایگزین تصویر<input maxLength={180} value={form.coverAlt} onChange={(event) => update("coverAlt", event.target.value)} className={fieldClass} placeholder="توصیف دقیق محتوای تصویر" /></label>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><Search size={20} className="text-cyan-700" /> تنظیمات SEO و اطلاعات تکمیلی</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">عنوان SEO <span className="float-left text-xs font-normal"><Counter value={form.seoTitle} recommended={[45, 60]} max={70} /></span><input required minLength={20} maxLength={70} value={form.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} className={fieldClass} placeholder="عنوان نتیجه جست‌وجو" /></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">توضیحات SEO <span className="float-left text-xs font-normal"><Counter value={form.seoDescription} recommended={[120, 160]} max={180} /></span><textarea required minLength={70} maxLength={180} rows={3} value={form.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} className={`${fieldClass} py-3`} placeholder="توضیح دقیق و ترغیب‌کننده برای نتیجه گوگل" /></label>
              <label className="text-sm font-bold text-slate-700">نویسنده<input maxLength={100} value={form.author} onChange={(event) => update("author", event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-bold text-slate-700">برچسب‌ها<input value={form.tags} onChange={(event) => update("tags", event.target.value)} className={fieldClass} placeholder="پاد، راهنمای خرید، کارتریج" /><span className="mt-1 block text-xs font-normal text-slate-500">با ویرگول جدا کنید؛ حداکثر ۱۲ برچسب.</span></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">منابع معتبر<textarea dir="ltr" rows={3} value={form.sources} onChange={(event) => update("sources", event.target.value)} className={`${fieldClass} py-3`} placeholder={"https://example.com/source\nhttps://example.com/another-source"} /><span className="mt-1 block text-xs font-normal text-slate-500">هر نشانی HTTPS در یک خط.</span></label>
            </div>
            <div className="mt-6 rounded-md border border-slate-200 bg-white p-4" dir="rtl">
              <p className="text-xs text-emerald-700" dir="ltr">ufopuff.com/{form.audience === "wholesale" ? "b2b/blog" : "blog"}/{form.slug || "your-slug"}</p>
              <p className="mt-1 text-lg text-blue-800">{form.seoTitle || form.title || "عنوان نتیجه جست‌وجو"}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{form.seoDescription || form.excerpt || "توضیحات نتیجه جست‌وجو اینجا نمایش داده می‌شود."}</p>
            </div>
          </AdminPanel>
        </form>
      </div>
    </AdminPage>
  );
}
