import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminShippingSettings } from "@/components/admin/admin-shipping-settings";
import { AdminPaymentSettings } from "@/components/admin/admin-payment-settings";

export default function SettingsPage() {
  return (
    <AdminPage className="max-w-5xl">
      <AdminPageHeader
        eyebrow="سیستم"
        title="تنظیمات فروشگاه"
        description="روش‌های ارسال، هزینه، محدوده سرویس و وضعیت نمایش در تسویه حساب را مدیریت کنید."
      />
      <AdminShippingSettings />
      <AdminPaymentSettings />
    </AdminPage>
  );
}
