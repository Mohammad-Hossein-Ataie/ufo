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
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">{title}</h1>
        <StatusPill tone="info">MVP مدیریتی</StatusPill>
      </div>
      <section className="mt-6 rounded-md border border-[#D7DDE4] bg-white p-5">
        <p className="leading-8 text-[#5F6C79]">
          این ماژول به shell مدیریت، RBAC سمت سرور، audit log و repository layer متصل می‌شود. CRUD
          کامل هر entity از همین الگو توسعه می‌یابد.
        </p>
      </section>
    </main>
  );
}
