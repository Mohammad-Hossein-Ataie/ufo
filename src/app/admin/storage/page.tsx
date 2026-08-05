import { StorageManager } from "@/components/admin/storage-manager";

export default function StoragePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">مدیریت فایل Liara Object Storage</h1>
      <p className="mt-2 text-[#5F6C79]">
        Adapter واقعی S3 با envهای Liara فعال می‌شود؛ در نبود env، mock provider استفاده می‌شود.
      </p>
      <div className="mt-6">
        <StorageManager />
      </div>
    </main>
  );
}
