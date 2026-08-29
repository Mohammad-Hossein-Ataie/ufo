import { StorageManager } from "@/components/admin/storage-manager";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default function StoragePage() {
  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="رسانه و فایل"
        title="مدیریت فایل‌های فروشگاه"
        description="تصاویر محصول و فایل‌های عملیاتی را آپلود، پیدا، کپی، دانلود یا با تایید حذف کنید. provider واقعی با envهای Liara فعال می‌شود."
      />
      <StorageManager />
    </AdminPage>
  );
}
