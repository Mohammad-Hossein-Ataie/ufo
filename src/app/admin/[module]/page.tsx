import { AdminPage, AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";
import { StatusPill } from "@ufo/ui";

const moduleNames: Record<string, string> = {
  products: "محصولات",
  orders: "سفارش‌ها",
  chat: "چت",
  seo: "SEO",
  customers: "مشتریان",
  invoices: "فاکتورها",
  reports: "گزارش‌ها",
  roles: "نقش‌ها",
  "audit-logs": "Audit Log",
};

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const title = moduleNames[module] ?? module;
  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="ماژول مدیریتی"
        title={title}
        description="برای این بخش هنوز ابزار عملیاتی قابل استفاده در کد موجود نیست؛ بنابراین کنترل نمایشی یا قابلیت غیرواقعی اضافه نشده است."
        actions={<StatusPill tone="info">در انتظار پیاده‌سازی</StatusPill>}
      />
      <AdminPanel className="p-6">
        <p className="max-w-2xl text-sm leading-7 text-slate-600">
          وقتی backend و داده واقعی این بخش آماده شود، همین صفحه می‌تواند با الگوی جدول، فیلتر،
          وضعیت و عملیات امن پنل ادمین توسعه پیدا کند.
        </p>
      </AdminPanel>
    </AdminPage>
  );
}
