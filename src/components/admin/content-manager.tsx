"use client";

import {
  ChangeEvent,
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Eye,
  FilePenLine,
  Globe2,
  ImagePlus,
  LoaderCircle,
  Newspaper,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  ContentAudience,
  ContentPost,
  ContentPostSummary,
  ContentPostStatus,
  ContentPostType,
} from "@/lib/content-posts";
import { contentBodyToDocument, richTextPlainText } from "@/lib/content-rich-text";
import { AdminPage, AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/admin-ui";
import { JalaliDateTimePicker } from "@/components/admin/jalali-date-time-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

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

function toForm(post: ContentPost): EditorForm {
  return {
    ...emptyForm,
    ...post,
    tags: post.tags.join("، "),
    sources: post.sources.join("\n"),
    scheduledAt: post.scheduledAt ?? "",
  };
}

const contentDateFormatter = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(value?: string) {
  return value ? contentDateFormatter.format(new Date(value)) : "بدون تاریخ";
}

function slugFromTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

const fieldClass =
  "mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

function Counter({
  value,
  recommended,
  max,
}: {
  value: string;
  recommended: [number, number];
  max: number;
}) {
  const good = value.length >= recommended[0] && value.length <= recommended[1];
  return (
    <span
      className={
        good ? "text-emerald-700" : value.length > max ? "text-rose-700" : "text-amber-700"
      }
    >
      {value.length.toLocaleString("fa-IR")} / {max.toLocaleString("fa-IR")}
    </span>
  );
}

function StatusBadge({ status }: { status: ContentPostStatus }) {
  const config =
    status === "published"
      ? { label: "منتشرشده", className: "bg-emerald-50 text-emerald-700" }
      : status === "scheduled"
        ? { label: "زمان‌بندی‌شده", className: "bg-amber-50 text-amber-700" }
        : { label: "پیش‌نویس", className: "bg-slate-100 text-slate-600" };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${config.className}`}>
      {config.label}
    </span>
  );
}

const ContentPostList = memo(function ContentPostList({
  posts,
  selectedId,
  busy,
  onEdit,
}: {
  posts: ContentPostSummary[];
  selectedId: string;
  busy: boolean;
  onEdit: (post: ContentPostSummary) => Promise<void>;
}) {
  return posts.map((post) => (
    <button
      key={post.id}
      type="button"
      onClick={() => void onEdit(post)}
      disabled={busy}
      className={`mb-2 w-full rounded-xl border p-3.5 text-right transition ${selectedId === post.id ? "border-cyan-500 bg-cyan-50 shadow-sm ring-1 ring-cyan-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-black text-cyan-800">
          <span>{post.type === "news" ? "خبر" : "مقاله"}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">
            {post.audience === "wholesale" ? "عمده" : "خرده"}
          </span>
        </span>
        <StatusBadge status={post.status} />
      </span>
      <strong className="mt-2.5 line-clamp-2 block text-sm leading-6 text-slate-900">
        {post.title}
      </strong>
      <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>{post.category}</span>
        <span>{formatDate(post.updatedAt)}</span>
      </span>
    </button>
  ));
});

export function ContentManager() {
  const [posts, setPosts] = useState<ContentPostSummary[]>([]);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [editorKey, setEditorKey] = useState(0);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContentPostType>("all");
  const [audienceFilter, setAudienceFilter] = useState<"all" | ContentAudience>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ContentPostStatus>("all");
  const [loading, setLoading] = useState(true);
  const [loadingPost, setLoadingPost] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(signal: AbortSignal) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store", signal });
      const payload = (await response.json()) as { posts?: ContentPostSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "دریافت مطالب انجام نشد.");
      setPosts(payload.posts ?? []);
    } catch (cause) {
      if (!signal.aborted)
        setError(cause instanceof Error ? cause.message : "دریافت مطالب انجام نشد.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => {
      controller.abort();
      detailRequest.current?.abort();
    };
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

  const bodySummary = useMemo(() => {
    const document = contentBodyToDocument(form.body);
    return {
      length: richTextPlainText(document).length,
      hasHeading: document.blocks.some(
        (block) => block.type === "heading2" || block.type === "heading3",
      ),
      imageCount: document.blocks.filter((block) => block.type === "image").length,
    };
  }, [form.body]);

  const seoChecks = useMemo(() => {
    return [
      {
        label: "عنوان شفاف (۴۰ تا ۶۵ کاراکتر)",
        passed: form.title.length >= 40 && form.title.length <= 65,
      },
      {
        label: "خلاصه مناسب کارت و مقدمه",
        passed: form.excerpt.length >= 90 && form.excerpt.length <= 180,
      },
      { label: "متن کامل‌تر از ۳۰۰ کاراکتر", passed: bodySummary.length >= 300 },
      { label: "حداقل یک تیتر ساختاریافته", passed: bodySummary.hasHeading },
      {
        label: "تصویر شاخص و متن جایگزین",
        passed: Boolean(form.coverImage && form.coverAlt.length >= 5),
      },
      {
        label: "عنوان SEO در محدوده پیشنهادی",
        passed: form.seoTitle.length >= 45 && form.seoTitle.length <= 60,
      },
      {
        label: "توضیحات SEO در محدوده پیشنهادی",
        passed: form.seoDescription.length >= 120 && form.seoDescription.length <= 160,
      },
      { label: "نشانی خوانا و یکتا", passed: form.slug.length >= 3 },
    ];
  }, [
    bodySummary,
    form.coverAlt,
    form.coverImage,
    form.excerpt,
    form.seoDescription,
    form.seoTitle,
    form.slug,
    form.title,
  ]);
  const seoPassed = seoChecks.filter((item) => item.passed).length;
  const seoScore = Math.round((seoPassed / seoChecks.length) * 100);
  const busy = saving || coverUploading || inlineUploading || loadingPost;

  function update<K extends keyof EditorForm>(key: K, value: EditorForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetFeedback() {
    setMessage("");
    setError("");
  }

  function createNew() {
    if (busy) return;
    setForm({ ...emptyForm });
    setEditorKey((current) => current + 1);
    resetFeedback();
    document
      .getElementById("content-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const editPost = useCallback(
    async (post: ContentPostSummary) => {
      if (busy) return;
      detailRequest.current?.abort();
      const controller = new AbortController();
      detailRequest.current = controller;
      setLoadingPost(true);
      resetFeedback();
      try {
        const response = await fetch(`/api/admin/content/${encodeURIComponent(post.id)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as { post?: ContentPost; error?: string };
        if (!response.ok || !payload.post)
          throw new Error(payload.error ?? "دریافت متن مطلب انجام نشد.");
        if (controller.signal.aborted) return;
        setForm(toForm(payload.post));
        setEditorKey((current) => current + 1);
        if (window.innerWidth < 1280)
          document
            .getElementById("content-editor")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "دریافت مطلب انجام نشد.");
      } finally {
        if (!controller.signal.aborted) setLoadingPost(false);
      }
    },
    [busy],
  );

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (form.status === "scheduled" && !form.scheduledAt) {
      setError("برای انتشار زمان‌بندی‌شده، تاریخ و ساعت جلالی را انتخاب کنید.");
      return;
    }
    setSaving(true);
    resetFeedback();
    try {
      const response = await fetch(
        form.id ? `/api/admin/content/${form.id}` : "/api/admin/content",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            tags: form.tags
              .split(/[،,\n]/)
              .map((value) => value.trim())
              .filter(Boolean),
            sources: form.sources
              .split(/\n/)
              .map((value) => value.trim())
              .filter(Boolean),
            scheduledAt: form.status === "scheduled" ? form.scheduledAt : "",
          }),
        },
      );
      const payload = (await response.json()) as {
        post?: ContentPost;
        message?: string;
        error?: string;
      };
      if (!response.ok || !payload.post) throw new Error(payload.error ?? "ذخیره مطلب انجام نشد.");
      setForm(toForm(payload.post));
      setPosts((current) => [
        payload.post!,
        ...current.filter((post) => post.id !== payload.post!.id),
      ]);
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
    resetFeedback();
    try {
      const response = await fetch(`/api/admin/content/${form.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "حذف مطلب انجام نشد.");
      setPosts((current) => current.filter((post) => post.id !== form.id));
      setForm({ ...emptyForm });
      setEditorKey((current) => current + 1);
      setMessage(payload.message ?? "مطلب حذف شد.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حذف مطلب انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("حداکثر حجم تصویر ۸ مگابایت است.");
      return;
    }
    setCoverUploading(true);
    resetFeedback();
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("purpose", "cover");
      const response = await fetch("/api/admin/content/upload", { method: "POST", body });
      const payload = (await response.json()) as { url?: string; message?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "آپلود تصویر انجام نشد.");
      update("coverImage", payload.url);
      setMessage(payload.message ?? "تصویر شاخص آماده شد.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "آپلود تصویر انجام نشد.");
    } finally {
      setCoverUploading(false);
    }
  }

  return (
    <AdminPage className="max-w-[100rem]">
      <AdminPageHeader
        eyebrow="مرکز محتوا"
        title="اخبار و مقالات"
        description="محتوا را با ویرایشگر حرفه‌ای بنویسید، تصاویر را مستقیم در فضای ابری قرار دهید و پیش از انتشار، آمادگی SEO را بررسی کنید."
        actions={
          <button
            type="button"
            onClick={createNew}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-cyan-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-cyan-800"
          >
            <Plus size={18} /> مطلب جدید
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="منتشرشده"
          value={stats.published.toLocaleString("fa-IR")}
          icon={<CheckCircle2 size={20} />}
          tone="success"
        />
        <AdminStatCard
          label="پیش‌نویس"
          value={stats.draft.toLocaleString("fa-IR")}
          icon={<FilePenLine size={20} />}
          tone="neutral"
        />
        <AdminStatCard
          label="زمان‌بندی‌شده"
          value={stats.scheduled.toLocaleString("fa-IR")}
          icon={<CalendarClock size={20} />}
          tone="warning"
        />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <AdminPanel className="overflow-hidden xl:sticky xl:top-20">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-950">کتابخانه محتوا</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filtered.length.toLocaleString("fa-IR")} نتیجه
                </p>
              </div>
              <Newspaper size={20} className="text-cyan-700" />
            </div>
            <label className="relative mt-4 block">
              <Search className="absolute right-3 top-3 text-slate-400" size={17} />
              <span className="sr-only">جست‌وجوی محتوا</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="عنوان، دسته یا نویسنده"
                className="min-h-11 w-full rounded-lg border border-slate-300 pr-10 pl-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                aria-label="نوع محتوا"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-xs"
              >
                <option value="all">همه انواع</option>
                <option value="article">مقاله</option>
                <option value="news">خبر</option>
              </select>
              <select
                aria-label="وضعیت محتوا"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-xs"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="published">منتشرشده</option>
                <option value="draft">پیش‌نویس</option>
                <option value="scheduled">زمان‌بندی</option>
              </select>
              <select
                aria-label="ویترین محتوا"
                value={audienceFilter}
                onChange={(event) => setAudienceFilter(event.target.value as typeof audienceFilter)}
                className="col-span-2 min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-xs"
              >
                <option value="all">همه ویترین‌ها</option>
                <option value="retail">خرده‌فروشی</option>
                <option value="wholesale">عمده‌فروشی</option>
              </select>
            </div>
          </div>
          <div className="max-h-[26rem] overflow-y-auto p-2 xl:max-h-[calc(100vh-22rem)] xl:min-h-72">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">در حال دریافت مطالب...</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm leading-7 text-slate-500">مطلبی با این فیلتر پیدا نشد.</p>
            ) : (
              <ContentPostList
                posts={filtered}
                selectedId={form.id}
                busy={busy}
                onEdit={editPost}
              />
            )}
          </div>
        </AdminPanel>

        <form
          id="content-editor"
          aria-busy={busy}
          onSubmit={save}
          className="grid min-w-0 gap-4 scroll-mt-24"
        >
          {loadingPost ? (
            <p role="status" className="rounded-xl bg-cyan-50 p-4 text-sm font-bold text-cyan-800">
              در حال بازکردن مطلب...
            </p>
          ) : null}
          <fieldset disabled={loadingPost || saving} className="contents">
            {message ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-sm"
              >
                {message}
              </div>
            ) : null}
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 shadow-sm"
              >
                {error}
              </div>
            ) : null}

            <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    <FilePenLine size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-slate-950">
                      {form.id ? form.title || "ویرایش مطلب" : "مطلب جدید"}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {form.id
                        ? "تغییرات پس از ذخیره اعمال می‌شوند"
                        : "کار را با پیش‌نویس شروع کنید"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.id && form.status === "published" ? (
                  <Link
                    href={`${form.audience === "wholesale" ? "/b2b/blog" : "/blog"}/${form.slug}`}
                    target="_blank"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye size={16} /> مشاهده
                  </Link>
                ) : null}
                {form.id ? (
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 size={16} /> حذف
                  </button>
                ) : null}
                <button type="submit" disabled={busy} className={primaryButton}>
                  {saving ? (
                    <LoaderCircle className="animate-spin" size={17} />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "در حال ذخیره..." : "ذخیره مطلب"}
                </button>
              </div>
            </div>

            <div className="grid min-w-0 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="grid min-w-0 gap-4">
                <AdminPanel className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-black text-cyan-700">۱. نگارش محتوا</p>
                      <h2 className="mt-1 text-lg font-black text-slate-950">
                        عنوان، خلاصه و متن اصلی
                      </h2>
                    </div>
                    <Sparkles size={20} className="text-cyan-700" />
                  </div>
                  <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                      عنوان مطلب{" "}
                      <span className="float-left text-xs font-normal">
                        <Counter value={form.title} recommended={[40, 65]} max={140} />
                      </span>
                      <input
                        required
                        minLength={10}
                        maxLength={140}
                        value={form.title}
                        onChange={(event) => update("title", event.target.value)}
                        className={fieldClass}
                        placeholder="عنوان روشن، دقیق و مفید برای مخاطب"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                      اسلاگ URL
                      <span className="mt-2 flex gap-2">
                        <input
                          dir="ltr"
                          maxLength={120}
                          value={form.slug}
                          onChange={(event) => update("slug", event.target.value)}
                          className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                          placeholder="product-buying-guide"
                        />
                        <button
                          type="button"
                          onClick={() => update("slug", slugFromTitle(form.title))}
                          disabled={!form.title.trim()}
                          className="shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          ساخت از عنوان
                        </button>
                      </span>
                      <span className="mt-1.5 block text-xs font-normal text-slate-500">
                        کوتاه، خوانا و بدون تاریخ یا واژه‌های غیرضروری بنویسید.
                      </span>
                    </label>
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                      خلاصه{" "}
                      <span className="float-left text-xs font-normal">
                        <Counter value={form.excerpt} recommended={[90, 180]} max={320} />
                      </span>
                      <textarea
                        required
                        minLength={30}
                        maxLength={320}
                        rows={3}
                        value={form.excerpt}
                        onChange={(event) => update("excerpt", event.target.value)}
                        className={`${fieldClass} py-3 leading-7`}
                        placeholder="خلاصه‌ای مستقل که در کارت محتوا و ابتدای مطلب معنا داشته باشد."
                      />
                    </label>
                    <div className="min-w-0 sm:col-span-2">
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <label className="text-sm font-bold text-slate-700">متن اصلی</label>
                          <p className="mt-1 text-xs leading-6 text-slate-500">
                            از تیترها برای ساختار معنایی استفاده کنید و تصویر را دقیقاً در جای مناسب
                            متن قرار دهید.
                          </p>
                        </div>
                        {bodySummary.imageCount > 0 ? (
                          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800">
                            {bodySummary.imageCount.toLocaleString("fa-IR")} تصویر در متن
                          </span>
                        ) : null}
                      </div>
                      <RichTextEditor
                        disabled={busy}
                        key={editorKey}
                        value={form.body}
                        onChange={(value) => update("body", value)}
                        onUploadingChange={setInlineUploading}
                        onError={setError}
                        onMessage={setMessage}
                      />
                    </div>
                  </div>
                </AdminPanel>

                <AdminPanel className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-cyan-700">۲. تصویر بنر</p>
                      <h2 className="mt-1 text-lg font-black text-slate-950">تصویر اصلی مقاله</h2>
                    </div>
                    <ImagePlus size={22} className="text-cyan-700" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    این تصویر بالای مقاله و روی کارت آن نمایش داده می‌شود. برای تصویرهای داخل مقاله،
                    از «تصویر میان متن» در ویرایشگر استفاده کنید.
                  </p>
                  <div className="mt-4 grid items-start gap-5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {form.coverImage ? (
                        <Image
                          src={form.coverImage}
                          alt={form.coverAlt || "پیش‌نمایش بنر مقاله"}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="(min-width: 640px) 256px, 90vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
                          <ImagePlus size={22} />
                          بدون تصویر بنر
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-cyan-500">
                        {coverUploading ? (
                          <LoaderCircle className="animate-spin" size={17} />
                        ) : (
                          <ImagePlus size={17} />
                        )}
                        {coverUploading
                          ? "در حال آماده‌سازی..."
                          : form.coverImage
                            ? "تغییر تصویر بنر"
                            : "انتخاب تصویر بنر"}
                        <input
                          aria-label="فایل تصویر بنر مقاله"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="sr-only"
                          onChange={(event) => void uploadCover(event)}
                          disabled={busy}
                        />
                      </label>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        تصویر افقی با نسبت ۱۶:۹ انتخاب کنید؛ حداکثر ۸ مگابایت.
                      </p>
                      <label className="mt-3 block text-xs font-bold text-slate-600">
                        متن جایگزین بنر مقاله
                        <input
                          maxLength={180}
                          value={form.coverAlt}
                          onChange={(event) => update("coverAlt", event.target.value)}
                          className={fieldClass}
                          placeholder="توصیف محتوای بنر"
                        />
                      </label>
                    </div>
                  </div>
                </AdminPanel>

                <AdminPanel className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-black text-cyan-700">۳. بهینه‌سازی جست‌وجو</p>
                      <h2 className="mt-1 text-lg font-black text-slate-950">
                        SEO و اطلاعات تکمیلی
                      </h2>
                    </div>
                    <Search size={20} className="text-cyan-700" />
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                      عنوان SEO{" "}
                      <span className="float-left text-xs font-normal">
                        <Counter value={form.seoTitle} recommended={[45, 60]} max={70} />
                      </span>
                      <input
                        required
                        minLength={20}
                        maxLength={70}
                        value={form.seoTitle}
                        onChange={(event) => update("seoTitle", event.target.value)}
                        className={fieldClass}
                        placeholder="عنوان دقیق نتیجه جست‌وجو"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                      توضیحات SEO{" "}
                      <span className="float-left text-xs font-normal">
                        <Counter value={form.seoDescription} recommended={[120, 160]} max={180} />
                      </span>
                      <textarea
                        required
                        minLength={70}
                        maxLength={180}
                        rows={3}
                        value={form.seoDescription}
                        onChange={(event) => update("seoDescription", event.target.value)}
                        className={`${fieldClass} py-3 leading-7`}
                        placeholder="توضیح دقیق و ترغیب‌کننده برای نتیجه گوگل"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                      نویسنده
                      <input
                        maxLength={100}
                        value={form.author}
                        onChange={(event) => update("author", event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                      برچسب‌ها
                      <input
                        value={form.tags}
                        onChange={(event) => update("tags", event.target.value)}
                        className={fieldClass}
                        placeholder="پاد، راهنمای خرید، کارتریج"
                      />
                      <span className="mt-1.5 block text-xs font-normal text-slate-500">
                        حداکثر ۱۲ برچسب؛ با ویرگول جدا کنید.
                      </span>
                    </label>
                    <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                      منابع معتبر
                      <textarea
                        dir="ltr"
                        rows={3}
                        value={form.sources}
                        onChange={(event) => update("sources", event.target.value)}
                        className={`${fieldClass} py-3 text-left`}
                        placeholder={
                          "https://example.com/source\nhttps://example.com/another-source"
                        }
                      />
                      <span className="mt-1.5 block text-xs font-normal text-slate-500">
                        هر نشانی HTTPS در یک خط؛ برای خبرها منبع اصلی را ثبت کنید.
                      </span>
                    </label>
                  </div>
                  <div
                    className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    dir="rtl"
                  >
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-500">
                      پیش‌نمایش نتیجه جست‌وجو
                    </div>
                    <div className="p-4">
                      <p className="truncate text-xs text-emerald-700" dir="ltr">
                        ufopuff.com/{form.audience === "wholesale" ? "b2b/blog" : "blog"}/
                        {form.slug || "your-slug"}
                      </p>
                      <p className="mt-1.5 text-lg font-medium text-blue-800">
                        {form.seoTitle || form.title || "عنوان نتیجه جست‌وجو"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                        {form.seoDescription ||
                          form.excerpt ||
                          "توضیحات نتیجه جست‌وجو اینجا نمایش داده می‌شود."}
                      </p>
                    </div>
                  </div>
                </AdminPanel>
              </div>

              <aside className="grid gap-4 2xl:sticky 2xl:top-36">
                <AdminPanel className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-cyan-700">انتشار</p>
                      <h2 className="mt-1 font-black text-slate-950">تنظیمات مطلب</h2>
                    </div>
                    <Globe2 size={20} className="text-cyan-700" />
                  </div>
                  <fieldset className="mt-5">
                    <legend className="text-xs font-bold text-slate-600">ویترین انتشار</legend>
                    <div className="mt-2 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                      {(
                        [
                          { value: "retail", label: "خرده‌فروشی" },
                          { value: "wholesale", label: "عمده‌فروشی" },
                        ] as const
                      ).map((item) => (
                        <label
                          key={item.value}
                          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-2 text-center text-xs font-black transition ${form.audience === item.value ? "bg-white text-cyan-800 shadow-sm" : "text-slate-500"}`}
                        >
                          <input
                            type="radio"
                            name="content-audience"
                            value={item.value}
                            checked={form.audience === item.value}
                            onChange={() => update("audience", item.value)}
                            className="size-3.5 shrink-0 accent-cyan-700"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-4 grid gap-4">
                    <label className="text-xs font-bold text-slate-600">
                      نوع محتوا
                      <select
                        value={form.type}
                        onChange={(event) => {
                          const type = event.target.value as ContentPostType;
                          setForm((current) => ({
                            ...current,
                            type,
                            category: current.id
                              ? current.category
                              : type === "news"
                                ? "اخبار فروشگاه"
                                : "راهنمای خرید",
                          }));
                        }}
                        className={fieldClass}
                      >
                        <option value="article">مقاله آموزشی</option>
                        <option value="news">خبر</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-slate-600">
                      دسته‌بندی
                      <input
                        required
                        maxLength={80}
                        value={form.category}
                        onChange={(event) => update("category", event.target.value)}
                        className={fieldClass}
                        placeholder="راهنمای خرید"
                      />
                    </label>
                    <label className="text-xs font-bold text-slate-600">
                      وضعیت انتشار
                      <select
                        value={form.status}
                        onChange={(event) =>
                          update("status", event.target.value as ContentPostStatus)
                        }
                        className={fieldClass}
                      >
                        <option value="draft">پیش‌نویس</option>
                        <option value="published">انتشار فوری</option>
                        <option value="scheduled">انتشار زمان‌بندی‌شده</option>
                      </select>
                    </label>
                    {form.status === "scheduled" ? (
                      <div>
                        <span className="text-xs font-bold text-slate-600">زمان انتشار</span>
                        <JalaliDateTimePicker
                          required
                          value={form.scheduledAt}
                          onChange={(value) => update("scheduledAt", value)}
                        />
                      </div>
                    ) : null}
                  </div>
                </AdminPanel>

                <AdminPanel className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-cyan-700">کنترل کیفیت</p>
                      <h2 className="mt-1 font-black text-slate-950">آمادگی انتشار</h2>
                    </div>
                    <span
                      className={`inline-flex size-12 items-center justify-center rounded-full text-sm font-black ${seoScore >= 80 ? "bg-emerald-50 text-emerald-700" : seoScore >= 50 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {seoScore.toLocaleString("fa-IR")}٪
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${seoScore >= 80 ? "bg-emerald-500" : "bg-cyan-600"}`}
                      style={{ width: `${seoScore}%` }}
                    />
                  </div>
                  <ul className="mt-4 grid gap-2.5">
                    {seoChecks.map((item) => (
                      <li
                        key={item.label}
                        className={`flex items-start gap-2 text-[11px] leading-5 ${item.passed ? "text-emerald-700" : "text-slate-500"}`}
                      >
                        {item.passed ? (
                          <Check size={15} className="mt-0.5 shrink-0" />
                        ) : (
                          <Circle size={13} className="mt-1 shrink-0" />
                        )}
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </AdminPanel>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("content-editor")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="hidden items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-cyan-700 2xl:flex"
                >
                  بازگشت به بالای ویرایشگر <ChevronLeft size={14} className="rotate-90" />
                </button>
              </aside>
            </div>
          </fieldset>
        </form>
      </div>
    </AdminPage>
  );
}
