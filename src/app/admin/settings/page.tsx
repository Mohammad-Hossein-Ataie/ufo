import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { Button, Input, Textarea } from "@ufo/ui";
import { storeSettings } from "@ufo/domain";

export default function SettingsPage() {
  return (
    <AdminPage className="max-w-5xl">
      <AdminPageHeader
        eyebrow="سیستم"
        title="تنظیمات فروشگاه"
        description="اطلاعات پایه نمایش فروشگاه را مرور کنید. ذخیره واقعی تنظیمات زمانی فعال می‌شود که backend مربوطه به فرم متصل شود."
      />
      <form className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          نام برند
          <Input defaultValue={storeSettings.brandName} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          مسئول
          <Input defaultValue={storeSettings.ownerName} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          تماس
          <Input defaultValue={storeSettings.phone} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          آدرس
          <Textarea defaultValue={storeSettings.address} />
        </label>
        <Button type="submit" disabled>
          ذخیره تنظیمات
        </Button>
      </form>
    </AdminPage>
  );
}
