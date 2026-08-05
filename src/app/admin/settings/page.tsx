import { Button, Input, Textarea } from "@ufo/ui";
import { storeSettings } from "@ufo/domain";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">تنظیمات فروشگاه</h1>
      <form className="mt-6 grid gap-4 rounded-md border border-[#D7DDE4] bg-white p-5">
        <label className="grid gap-2">
          نام برند
          <Input defaultValue={storeSettings.brandName} />
        </label>
        <label className="grid gap-2">
          مسئول
          <Input defaultValue={storeSettings.ownerName} />
        </label>
        <label className="grid gap-2">
          تماس
          <Input defaultValue={storeSettings.phone} />
        </label>
        <label className="grid gap-2">
          آدرس
          <Textarea defaultValue={storeSettings.address} />
        </label>
        <Button type="submit">ذخیره تنظیمات</Button>
      </form>
    </main>
  );
}
