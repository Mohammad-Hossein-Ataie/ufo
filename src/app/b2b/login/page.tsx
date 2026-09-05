import { Suspense } from "react";
import { B2BLoginClient } from "@/components/b2b/b2b-login-client";

export default function B2BLoginPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-3xl font-black">ورود همکار عمده</h1>
      <Suspense fallback={null}>
        <B2BLoginClient />
      </Suspense>
    </main>
  );
}
