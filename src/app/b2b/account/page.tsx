import { B2BAccountClient } from "@/components/b2b/b2b-account-client";

export default function B2BAccountPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">حساب همکاری</h1>
      <div className="mt-6">
        <B2BAccountClient />
      </div>
    </main>
  );
}
