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
  const number = account.cardNumber.replace(/(.{4})/g, "$1 ").trim();
  const iban = account.iban.replace(/(.{4})/g, "$1 ").trim();
  return (
    <div
      aria-hidden="true"
      data-bank-artwork={kind}
      className={`relative isolate w-full overflow-hidden rounded-2xl shadow-[0_16px_36px_-12px_rgba(0,0,0,.65)] ring-1 ring-white/15 ${vertical ? "aspect-[214/340] max-w-[214px] bg-[#c31c32]" : "aspect-[340/214] max-w-[340px] bg-slate-800"}`}
    >
      {vertical ? (
        <>
          <div className="absolute -top-4 bottom-0 left-[40%] w-[19%] rotate-[9deg] bg-[#11131a]" />
          <svg viewBox="0 0 214 340" className="absolute inset-0 h-full w-full" fill="none">
            <rect x="27" y="32" width="27" height="35" rx="6" fill="#d8c78d" />
            <path d="M27 44h27M27 55h27M40 32v35" stroke="#8e804f" strokeWidth="1" />
            <g fill="white" fontFamily="monospace" fontSize="23" direction="ltr" textAnchor="start">
              {account.cardNumber.match(/.{1,4}/g)?.map((part, i) => (
                <text key={i} x="127" y={143 + i * 30}>
                  {part}
                </text>
              ))}
            </g>
            <text data-bank-iban x="20" y="252" fill="white" fontFamily="monospace" fontSize="8.5" direction="ltr" textAnchor="start">{iban}</text>
            <text x="25" y="271" fill="white" fontFamily="sans-serif" fontSize="11" direction="ltr">
              bank. but lovely
            </text>
          </svg>
          <p className="absolute right-5 top-9 text-[11px] font-bold leading-6 text-white">
            {account.holderName}
          </p>
          <BankLogo
            name={account.bankName}
            className="absolute bottom-3 left-4 h-11 w-14 !bg-transparent !p-0 [&_img]:brightness-0 [&_img]:invert"
          />
        </>
      ) : (
        <>
          <svg viewBox="0 0 340 214" className="absolute inset-0 h-full w-full" fill="none">
            <defs>
              <linearGradient id={`card-${account.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor={kind === "saman" ? "#fff" : "#ea101d"} />
                <stop offset="1" stopColor={kind === "saman" ? "#dcebf0" : "#a4081e"} />
              </linearGradient>
            </defs>
            <rect width="340" height="214" fill={`url(#card-${account.id})`} />
            {kind === "mellat" ? (
              <>
                <path d="M0 0h340v57Q170 32 0 64Z" fill="#faf9f5" />
                <g stroke="#ffc5ac" strokeWidth=".5" opacity=".55">
                  {Array.from({ length: 30 }, (_, i) => (
                    <path key={i} d={`M-20 ${56 + i * 4} Q135 ${235 - i * 3} 360 ${56 + i * 5}`} />
                  ))}
                </g>
                <text x="22" y="29" fill="#333" fontSize="12" direction="ltr">
                  Mellat Card
                </text>
              </>
            ) : (
              <>
                <g fill="#079eca" opacity=".32">
                  {[-55, -28, 0, 28, 55].map((angle) => (
                    <path
                      key={angle}
                      transform={`rotate(${angle} 72 201)`}
                      d="M72 201Q-5 116 55 42Q119 95 72 201Z"
                    />
                  ))}
                </g>
                <path
                  d="M72 206L30 193L57 194L50 172L68 191L72 163L80 191L97 174L90 195L115 193Z"
                  fill="white"
                />
              </>
            )}
            <text data-bank-iban x="22" y="103" fill={kind === "saman" ? "#17415a" : "white"} fontFamily="monospace" fontSize="12" direction="ltr" textAnchor="start">{iban}</text>
            <text
              x="22"
              y="140"
              fill={kind === "saman" ? "#17415a" : "white"}
              fontFamily="monospace"
              fontSize="23"
              fontWeight="600"
              direction="ltr"
              textAnchor="start"
            >
              {number}
            </text>
          </svg>
          <BankLogo
            name={account.bankName}
            className="absolute right-4 top-3 h-9 w-14 !bg-transparent !p-0"
          />
          <p
            className={`absolute bottom-5 right-5 text-xs font-bold ${kind === "saman" ? "text-[#17415a]" : "text-white"}`}
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
        className="mt-3 grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-[#0c141f] p-3 sm:p-5"
      >
        <div className="flex items-center justify-center py-3">
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
        <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 py-1.5">
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
        <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 py-1.5">
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
