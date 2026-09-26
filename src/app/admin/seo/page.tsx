import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Gauge,
  MousePointerClick,
  Search,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { AdminPage, AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/admin-ui";
import { getLocalAnalyticsReport } from "@/lib/analytics-store";
import { getSearchConsoleReport, type SearchConsoleRow } from "@/lib/google-search-console";
import { StatusPill } from "@ufo/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("fa-IR");
const decimal = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("fa-IR", { style: "percent", maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric", timeZone: "UTC" });

function change(current: number, previous: number, lowerIsBetter = false) {
  if (!previous) return "بدون دوره مقایسه";
  const delta = ((current - previous) / Math.abs(previous)) * 100 * (lowerIsBetter ? -1 : 1);
  return `${delta >= 0 ? "▲" : "▼"} ${decimal.format(Math.abs(delta))}٪ نسبت به دوره قبل`;
}

function displayPath(value: string) {
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}

function VitalValue({ name, value }: { name: string; value: number }) {
  if (name === "CLS") return <>{decimal.format(value)}</>;
  return <>{number.format(Math.round(value))} ms</>;
}

function RankingTable({ title, rows, kind }: { title: string; rows: SearchConsoleRow[]; kind: "query" | "page" }) {
  return (
    <AdminPanel className="min-w-0 overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">مرتب‌شده بر اساس کلیک در ۲۸ روز اخیر</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-bold">{kind === "query" ? "عبارت جست‌وجو" : "صفحه"}</th>
              <th className="px-3 py-3 text-left font-bold">کلیک</th>
              <th className="px-3 py-3 text-left font-bold">نمایش</th>
              <th className="px-3 py-3 text-left font-bold">CTR</th>
              <th className="px-5 py-3 text-left font-bold">رتبه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 10).map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/70">
                <td className="max-w-md px-5 py-3 font-bold text-slate-800">
                  <span className="block truncate" dir={kind === "page" ? "ltr" : "rtl"}>{kind === "page" ? displayPath(row.key) : row.key}</span>
                </td>
                <td className="px-3 py-3 text-left tabular-nums">{number.format(row.clicks)}</td>
                <td className="px-3 py-3 text-left tabular-nums">{number.format(row.impressions)}</td>
                <td className="px-3 py-3 text-left tabular-nums">{percent.format(row.ctr)}</td>
                <td className="px-5 py-3 text-left tabular-nums">{decimal.format(row.position)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">هنوز داده‌ای برای این گزارش وجود ندارد.</p> : null}
      </div>
    </AdminPanel>
  );
}

export default async function SeoDashboardPage() {
  const [searchConsole, local] = await Promise.all([
    getSearchConsoleReport(28),
    getLocalAnalyticsReport(28),
  ]);
  const maxDailyImpressions = Math.max(1, ...searchConsole.daily.map((item) => item.impressions));
  const addToCarts = local.eventCounts.add_to_cart ?? 0;
  const orders = local.eventCounts.order_created ?? 0;
  const clickRate = searchConsole.totals.impressions > 0 ? searchConsole.totals.clicks / searchConsole.totals.impressions : 0;
  const recommendations = [
    !searchConsole.configured
      ? { tone: "warning" as const, title: "اتصال Search Console را تکمیل کنید", text: "سه متغیر محیطی پایین صفحه را تنظیم کنید تا کلیک، نمایش، CTR و رتبه واقعی وارد داشبورد شود." }
      : null,
    searchConsole.error
      ? { tone: "danger" as const, title: "دسترسی Search Console نیاز به بررسی دارد", text: searchConsole.error }
      : null,
    local.storage === "memory"
      ? { tone: "warning" as const, title: "ذخیره‌سازی دائمی آمار فعال نیست", text: "برای نگه‌داری گزارش بین deployها، اتصال MongoDB محیط production را تنظیم کنید." }
      : null,
    searchConsole.opportunities.length > 0
      ? { tone: "info" as const, title: `${number.format(searchConsole.opportunities.length)} فرصت رشد سریع`, text: "این عبارت‌ها نمایش مناسب دارند اما CTR یا رتبه آن‌ها قابل بهبود است؛ عنوان، توضیحات و تطابق محتوای صفحه را بازبینی کنید." }
      : null,
    local.vitals.some((item) => item.rating === "poor")
      ? { tone: "danger" as const, title: "Core Web Vitals ضعیف مشاهده شد", text: "صفحه‌های پرترافیک را بر اساس LCP، INP و CLS واقعی کاربران اولویت‌بندی کنید." }
      : null,
  ].filter(Boolean) as Array<{ tone: "info" | "warning" | "danger"; title: string; text: string }>;

  return (
    <AdminPage className="max-w-[96rem]">
      <AdminPageHeader
        eyebrow="داده واقعی، بدون اسکریپت ثالث"
        title="مرکز تحلیل SEO"
        description="عملکرد جست‌وجوی گوگل، رفتار کاربران و Core Web Vitals را در یک گزارش سبک ببینید. بازه گزارش ۲۸ روز است و داده Search Console با سه روز تأخیر نهایی‌سازی می‌شود."
        actions={(
          <>
            <StatusPill tone={searchConsole.configured && !searchConsole.error ? "success" : "warning"}>
              {searchConsole.configured && !searchConsole.error ? "Search Console متصل" : "نیازمند اتصال گوگل"}
            </StatusPill>
            <StatusPill tone={local.storage === "mongodb" ? "success" : "info"}>
              {local.storage === "mongodb" ? "ردیابی first-party فعال" : "حالت توسعه"}
            </StatusPill>
          </>
        )}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="کلیک ارگانیک" value={number.format(searchConsole.totals.clicks)} meta={change(searchConsole.totals.clicks, searchConsole.previousTotals.clicks)} icon={<MousePointerClick size={22} />} />
        <AdminStatCard label="نمایش در گوگل" value={number.format(searchConsole.totals.impressions)} meta={change(searchConsole.totals.impressions, searchConsole.previousTotals.impressions)} icon={<Search size={22} />} />
        <AdminStatCard label="نرخ کلیک ارگانیک" value={percent.format(clickRate)} meta={change(searchConsole.totals.ctr, searchConsole.previousTotals.ctr)} icon={<Target size={22} />} />
        <AdminStatCard label="میانگین رتبه" value={searchConsole.totals.position ? decimal.format(searchConsole.totals.position) : "—"} meta={change(searchConsole.totals.position, searchConsole.previousTotals.position, true)} icon={<TrendingUp size={22} />} />
      </section>

      {recommendations.length > 0 ? (
        <AdminPanel className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-700" />
            <h2 className="text-lg font-black">اولویت‌های پیشنهادی</h2>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {recommendations.map((item) => (
              <article key={item.title} className={`rounded-md border p-4 ${item.tone === "danger" ? "border-rose-200 bg-rose-50" : item.tone === "warning" ? "border-amber-200 bg-amber-50" : "border-cyan-200 bg-cyan-50"}`}>
                <h3 className="font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </AdminPanel>
      ) : null}

      {searchConsole.configured && !searchConsole.error ? (
        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <AdminPanel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-black">روند دیده‌شدن در گوگل</h2><p className="mt-1 text-xs text-slate-500">نمایش روزانه؛ عدد کنار هر ردیف تعداد کلیک است</p></div>
              {searchConsole.fetchedAt ? <time className="text-xs text-slate-500" dateTime={searchConsole.fetchedAt}>به‌روزرسانی: {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(searchConsole.fetchedAt))}</time> : null}
            </div>
            <div className="mt-5 grid gap-2">
              {searchConsole.daily.slice(-14).map((item) => (
                <div key={item.key} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3 text-xs">
                  <span className="text-slate-500">{date.format(new Date(`${item.key}T00:00:00Z`))}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.max(2, item.impressions / maxDailyImpressions * 100)}%` }} /></div>
                  <span className="text-left font-bold tabular-nums">{number.format(item.clicks)}</span>
                </div>
              ))}
            </div>
          </AdminPanel>
          <AdminPanel className="p-5">
            <h2 className="text-lg font-black">فرصت‌های CTR و رتبه</h2>
            <p className="mt-1 text-xs leading-6 text-slate-500">عبارت‌هایی با نمایش مناسب، رتبه ۴ تا ۲۰ و CTR کمتر از ۳٪</p>
            <div className="mt-4 grid gap-3">
              {searchConsole.opportunities.slice(0, 6).map((row) => (
                <article key={row.key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-bold text-slate-900">{row.key}</p>
                  <p className="mt-2 text-xs text-slate-500">{number.format(row.impressions)} نمایش · CTR {percent.format(row.ctr)} · رتبه {decimal.format(row.position)}</p>
                </article>
              ))}
              {searchConsole.opportunities.length === 0 ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">در این بازه فرصت فوری با معیارهای فعلی پیدا نشد.</p> : null}
            </div>
          </AdminPanel>
        </section>
      ) : (
        <AdminPanel className="p-5 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2"><AlertTriangle size={21} className="text-amber-600" /><h2 className="text-xl font-black">اتصال امن Google Search Console</h2></div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">در Google Cloud یک Service Account با دسترسی فقط‌خواندنی بسازید و ایمیل آن را در Search Console به‌عنوان کاربر property اضافه کنید. کلید فقط روی سرور می‌ماند و وارد مرورگر نمی‌شود.</p>
              <ol className="mt-4 grid gap-3 text-sm text-slate-700">
                <li className="flex gap-3"><span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 font-black text-cyan-700">۱</span><span>Search Console API را در Google Cloud فعال کنید.</span></li>
                <li className="flex gap-3"><span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 font-black text-cyan-700">۲</span><span>ایمیل Service Account را با دسترسی Restricted یا Full به property اضافه کنید.</span></li>
                <li className="flex gap-3"><span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 font-black text-cyan-700">۳</span><span>متغیرهای سمت سرور را تنظیم و برنامه را deploy کنید.</span></li>
              </ol>
            </div>
            <div className="rounded-md bg-slate-950 p-4 text-left text-xs leading-7 text-slate-200" dir="ltr">
              <code className="break-all">GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:ufopuff.com<br />GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=...<br />GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...&quot;</code>
            </div>
          </div>
        </AdminPanel>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="بازدید صفحات" value={number.format(local.pageViews)} meta="داده مستقیم و بدون کوکی" icon={<BarChart3 size={22} />} />
        <AdminStatCard label="افزودن به سبد" value={number.format(addToCarts)} meta={local.pageViews ? `${percent.format(addToCarts / local.pageViews)} نسبت به بازدید` : "در انتظار داده"} icon={<ShoppingCart size={22} />} />
        <AdminStatCard label="سفارش ثبت‌شده" value={number.format(orders)} meta={addToCarts ? `${percent.format(orders / addToCarts)} نسبت به سبد` : "در انتظار داده"} icon={<CheckCircle2 size={22} />} />
        <AdminStatCard label="نمونه Web Vitals" value={number.format(local.vitals.reduce((sum, item) => sum + item.samples, 0))} meta="اندازه‌گیری واقعی مرورگر کاربران" icon={<Gauge size={22} />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminPanel className="p-5">
          <div className="flex items-center gap-2"><Activity size={20} className="text-cyan-700" /><h2 className="text-lg font-black">Core Web Vitals واقعی</h2></div>
          <p className="mt-1 text-xs leading-6 text-slate-500">صدک ۷۵ تجربه کاربران؛ معیار اصلی ارزیابی میدانی گوگل</p>
          <div className="mt-4 grid gap-3">
            {local.vitals.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                <div><p className="font-black" dir="ltr">{item.name}</p><p className="mt-1 text-xs text-slate-500">{number.format(item.samples)} نمونه</p></div>
                <div className="text-left"><p className="font-black tabular-nums"><VitalValue name={item.name} value={item.p75} /></p><StatusPill tone={item.rating === "good" ? "success" : item.rating === "poor" ? "danger" : "warning"}>{item.rating === "good" ? "خوب" : item.rating === "poor" ? "ضعیف" : "نیازمند بهبود"}</StatusPill></div>
              </div>
            ))}
            {local.vitals.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-5 text-center text-sm leading-7 text-slate-500">پس از ورود کاربران واقعی، LCP، INP و CLS اینجا نمایش داده می‌شود.</p> : null}
          </div>
        </AdminPanel>

        <AdminPanel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-black">صفحه‌های پربازدید سایت</h2><p className="mt-1 text-xs text-slate-500">داده first-party در ۲۸ روز اخیر</p></div><Link href="/admin/content" className="text-sm font-bold text-cyan-700">مدیریت محتوا</Link></div>
          <div className="divide-y divide-slate-100">
            {local.topPages.map((item, index) => (
              <div key={item.path} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-3"><span className="text-xs font-bold text-slate-400">{number.format(index + 1)}</span><span className="truncate text-sm font-bold" dir="ltr">{item.path}</span><span className="text-sm tabular-nums text-slate-600">{number.format(item.views)}</span></div>
            ))}
            {local.topPages.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">هنوز بازدیدی ثبت نشده است.</p> : null}
          </div>
        </AdminPanel>
      </section>

      {searchConsole.configured && !searchConsole.error ? <section className="grid min-w-0 gap-4 xl:grid-cols-2"><RankingTable title="عبارت‌های برتر" rows={searchConsole.queries} kind="query" /><RankingTable title="صفحه‌های برتر گوگل" rows={searchConsole.pages} kind="page" /></section> : null}

      <AdminPanel className="p-5">
        <h2 className="text-lg font-black">حریم خصوصی و اثر روی عملکرد</h2>
        <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-600 md:grid-cols-3">
          <p className="rounded-md bg-slate-50 p-4"><strong className="block text-slate-900">بدون اسکریپت ثالث</strong>ارسال رویداد با Beacon مرورگر انجام می‌شود و رندر یا تعامل کاربر را مسدود نمی‌کند.</p>
          <p className="rounded-md bg-slate-50 p-4"><strong className="block text-slate-900">بدون اطلاعات هویتی</strong>نام، موبایل، ایمیل، IP و محتوای جست‌وجوی کاربر در این گزارش ذخیره نمی‌شود.</p>
          <p className="rounded-md bg-slate-50 p-4"><strong className="block text-slate-900">احترام به Privacy Control</strong>در صورت فعال بودن Do Not Track یا Global Privacy Control هیچ رویدادی ارسال نمی‌شود.</p>
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
