import { ProductManager } from "@/components/admin/product-manager";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="کاتالوگ فروش"
        title="مدیریت محصولات"
        description="محصول، قیمت، کانال فروش، تصویر و وضعیت انتشار را در یک فضای فشرده و قابل جست‌وجو مدیریت کنید."
      />
      <ProductManager />
    </AdminPage>
  );
}
