"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, StatusPill } from "@ufo/ui";

interface B2BSession {
  businessName: string;
  managerName: string;
  phone: string;
}

export function B2BAccountClient() {
  const [session, setSession] = useState<B2BSession | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("ufo-b2b-session");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as B2BSession;
      if (typeof parsed.phone === "string") setSession(parsed);
    } catch {
      setSession(null);
    }
  }, []);

  if (!session) {
    return (
      <div className="rounded-md border border-[#D5D9C9] bg-white p-5">
        <p className="leading-8 text-[#596B61]">برای سفارش عمده ابتدا با شماره همراه وارد شوید.</p>
        <Link href="/b2b/login" className="mt-4 inline-flex">
          <Button className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">
            ورود عمده
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <section className="rounded-md border border-[#D5D9C9] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{session.businessName}</h2>
          <p className="mt-1 text-sm text-[#596B61]">
            {session.managerName} · {session.phone}
          </p>
        </div>
        <StatusPill tone="success">حساب عمده فعال</StatusPill>
      </div>
    </section>
  );
}
