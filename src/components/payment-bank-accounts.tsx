"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Check, CreditCard } from "lucide-react";
import type { BankAccount } from "@/lib/payment-settings";
import { CopyValue } from "@/components/copy-value";

function bankStyle(name: string) {
  const normalized = name.replace(/\s|‌/g, "").toLowerCase();
  if (/بلو|blu/.test(normalized)) return { kind: "blu", logo: "/images/bank-logos/blu-bank.webp" };
  if (/ملت|mell?at/.test(normalized))
    return { kind: "mellat", logo: "/images/bank-logos/melat-bank.png" };
  if (/سامان|saman/.test(normalized))
    return { kind: "saman", logo: "/images/bank-logos/saman-bank.png" };
  return { kind: "generic", logo: "" };
}

function BankLogo({ name, className = "" }: { name: string; className?: string }) {
  const { logo } = bankStyle(name);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5 ${className}`}
    >
      {logo ? (
        <Image
          src={logo}
          alt={`لوگوی ${name}`}
          width={48}
          height={48}
          className="h-full w-full object-contain"
        />
      ) : (
        <CreditCard size={21} className="text-slate-600" />
      )}
    </span>
  );
}

function CardArtwork({ account }: { account: BankAccount }) {
  const { kind } = bankStyle(account.bankName);
  const vertical = kind === "blu";
  return (
    <div
      aria-hidden="true"
      data-bank-artwork={kind}
      className={`relative isolate shrink-0 overflow-hidden rounded-xl shadow-[0_12px_24px_-12px_rgba(0,0,0,.65)] ring-1 ring-black/10 ${vertical ? "h-[140px] w-[88px] bg-gradient-to-br from-[#18b5ff] via-[#0086ef] to-[#0664d5] sm:h-[164px] sm:w-[103px]" : "h-[64px] w-[100px] sm:h-[116px] sm:w-[184px]"} ${kind === "mellat" ? "bg-gradient-to-br from-[#db3c3f] to-[#9a1024]" : kind === "saman" ? "bg-gradient-to-br from-white via-[#eaf5f9] to-[#c1dbe8]" : kind === "generic" ? "bg-gradient-to-br from-slate-600 to-slate-800" : ""}`}
    >
      {kind === "mellat" && (
        <>
          <div className="absolute inset-x-0 top-0 flex h-[30%] items-center justify-between bg-[#f6f3ef] px-2 sm:px-3">
            <span className="text-[5px] font-bold text-slate-700 sm:text-[9px]">ملت کارت</span>
            <BankLogo
              name={account.bankName}
              className="h-5 w-7 !bg-transparent !p-0 sm:h-8 sm:w-10"
            />
          </div>
          <svg
            viewBox="0 0 240 150"
            fill="none"
            className="absolute inset-0 h-full w-full text-amber-100/40"
          >
            <g stroke="currentColor" strokeWidth=".6">
              {Array.from({ length: 13 }, (_, i) => (
                <path key={i} d={`M-20 ${60 + i * 5} Q110 ${180 - i * 4} 270 ${38 + i * 8}`} />
              ))}
            </g>
          </svg>
        </>
      )}
      {kind === "saman" && (
        <>
          <Image
            src="/images/bank-logos/saman-bank.png"
            alt=""
            width={180}
            height={180}
            className="absolute -bottom-7 -left-7 h-28 w-28 object-contain opacity-65 mix-blend-multiply sm:-bottom-12 sm:-left-12 sm:h-48 sm:w-48"
          />
          <BankLogo
            name={account.bankName}
            className="absolute right-2 top-1 h-6 w-7 !bg-transparent !p-0 mix-blend-multiply sm:right-3 sm:top-2 sm:h-9 sm:w-10"
          />
        </>
      )}
      {vertical ? (
        <>
          <div className="absolute left-4 top-5 h-5 w-4 rounded bg-gradient-to-br from-[#f1db91] to-[#b89d56] ring-1 ring-yellow-200/60">
            <span className="absolute inset-x-0 top-1/2 border-t border-yellow-900/30" />
            <span className="absolute inset-y-0 left-1/2 border-l border-yellow-900/30" />
          </div>
          <p
            dir="ltr"
            className="absolute left-3 top-[43%] text-[7px] tracking-tight text-white/95 sm:text-[8px]"
          >
            bank. but lovely
          </p>
          <BankLogo
            name={account.bankName}
            className="absolute bottom-1 left-2 h-16 w-16 !bg-transparent !p-0 [&_img]:brightness-0 [&_img]:invert sm:h-20 sm:w-20"
          />
        </>
      ) : (
        <>
          <p
            dir="ltr"
            className={`absolute inset-x-2 bottom-[24%] select-none whitespace-nowrap font-mono text-[6px] font-bold tracking-[.05em] sm:inset-x-3 sm:text-[11px] ${kind === "saman" ? "text-[#123b52]" : "text-white"}`}
          >
            {account.cardNumber.replace(/(.{4})/g, "$1 ").trim()}
          </p>
          <p
            className={`absolute bottom-2 right-2 text-[4px] sm:bottom-3 sm:right-3 sm:text-[7px] ${kind === "saman" ? "text-[#123b52]" : "text-white/90"}`}
          >
            {account.holderName}
          </p>
        </>
      )}
    </div>
  );
}

export function PaymentBankAccounts({ accounts }: { accounts: BankAccount[] }) {
  const [selectedId, setSelectedId] = useState("");
  const id = useId();
  const selected = accounts.find((account) => account.id === selectedId) ?? accounts[0];
  if (!selected)
    return (
      <p role="status" className="text-sm text-slate-400">
        در حال دریافت حساب‌های فروشگاه...
      </p>
    );
  return (
    <div className="min-w-0" data-testid="payment-bank-accounts">
      <p className="mb-3 text-xs text-slate-400">یکی از حساب‌ها را برای واریز انتخاب کنید</p>
      <div role="group" aria-label="انتخاب حساب بانکی" className="grid grid-cols-3 gap-2">
        {accounts.map((account) => {
          const active = selected.id === account.id;
          return (
            <button
              key={account.id}
              type="button"
              aria-pressed={active}
              aria-controls={`${id}-account`}
              onClick={() => setSelectedId(account.id)}
              className={`relative flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:flex-row sm:gap-2 sm:px-3 ${active ? "border-cyan-300/60 bg-cyan-300/10 text-white" : "border-white/10 bg-black/10 text-slate-400 hover:border-white/30 hover:text-white"}`}
            >
              <BankLogo name={account.bankName} className="h-7 w-7 sm:h-9 sm:w-9" />
              <span className="min-w-0 text-center sm:text-right">
                <span className="block truncate text-[11px] font-bold sm:text-xs">
                  {account.bankName}
                </span>
                <span dir="ltr" className="mt-0.5 hidden font-mono text-[10px] opacity-60 sm:block">
                  •• {account.cardNumber.slice(-4)}
                </span>
              </span>
              {active && <Check size={12} className="absolute left-1.5 top-1.5 text-cyan-300" />}
            </button>
          );
        })}
      </div>
      <article
        id={`${id}-account`}
        aria-label={`اطلاعات حساب ${selected.bankName}`}
        className="mt-3 grid min-w-0 grid-cols-[100px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-[#0c141f] p-3 sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-x-5 sm:p-4"
      >
        <div className="flex items-center justify-center sm:row-span-3">
          <CardArtwork account={selected} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white">{selected.bankName}</h3>
          <p className="mt-2 text-[10px] text-slate-400">به نام</p>
          <p className="mt-1 text-xs leading-6 text-slate-200">{selected.holderName}</p>
          {!selected.enabled && (
            <p className="mt-1 text-[10px] text-amber-200">آزمایشی · غیرقابل واریز</p>
          )}
        </div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 py-1.5 sm:col-span-1">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] text-slate-400">شماره کارت</p>
            <p
              dir="ltr"
              className="select-all whitespace-nowrap font-mono text-[11px] font-bold text-white min-[375px]:text-[13px] sm:text-sm"
            >
              {selected.cardNumber.replace(/(.{4})/g, "$1 ").trim()}
            </p>
          </div>
          <CopyValue
            key={`${selected.id}-card`}
            value={selected.cardNumber}
            label="شماره کارت"
            disabled={!selected.enabled}
            compact
          />
        </div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 py-1.5 sm:col-span-1">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] text-slate-400">شماره شبا</p>
            <p
              dir="ltr"
              className="select-all break-all font-mono text-[11px] leading-5 text-slate-200 sm:text-xs"
            >
              {selected.iban}
            </p>
          </div>
          <CopyValue
            key={`${selected.id}-iban`}
            value={selected.iban}
            label="شبا"
            disabled={!selected.enabled}
            compact
          />
        </div>
      </article>
    </div>
  );
}
