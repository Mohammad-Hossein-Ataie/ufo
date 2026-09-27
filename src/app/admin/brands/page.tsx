import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { BrandImageManager } from "@/components/admin/brand-image-manager";

export const dynamic = "force-dynamic";

export default function AdminBrandsPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="کاتالوگ فروش"
        title="تصاویر برندها"
        description="برای هر برند، لوگویی که در بخش برندهای لندینگ نمایش داده می‌شود را آپلود یا جایگزین کنید."
      />
      <BrandImageManager />
    </AdminPage>
  );
}
