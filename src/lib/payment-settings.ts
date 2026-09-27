import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { getOrderStorePath } from "@ufo/orders";

export interface BankAccount {
  id: string;
  bankName: string;
  holderName: string;
  cardNumber: string;
  iban: string;
  enabled: boolean;
}
export const demoBankAccounts: BankAccount[] = [1, 2, 3].map((n) => ({
  id: `bank_${n}`,
  bankName: `بانک نمونه ${n}`,
  holderName: "امیرحسین محمودی",
  cardNumber: `000000000000000${n}`,
  iban: `IR00000000000000000000000${n}`,
  enabled: false,
}));
// Merchant-provided receiving accounts; admin settings remain authoritative.
export const defaultBankAccounts: BankAccount[] = [
  {
    id: "bank_1",
    bankName: "بلوبانک",
    holderName: "امیرحسین محمودی",
    cardNumber: "6219861911406022",
    iban: "IR590560611828005272406101",
    enabled: true,
  },
  {
    id: "bank_2",
    bankName: "بانک ملت",
    holderName: "امیرحسین محمودی",
    cardNumber: "6104331097847116",
    iban: "IR470120000000007534884851",
    enabled: true,
  },
  {
    id: "bank_3",
    bankName: "بانک سامان",
    holderName: "امیرحسین محمودی",
    cardNumber: "6219861072306516",
    iban: "IR870560213780004431989001",
    enabled: true,
  },
];
const path = () => join(dirname(getOrderStorePath()), "payment-accounts.json");
export function getBankAccounts(): BankAccount[] {
  if (!existsSync(path())) return defaultBankAccounts;
  const saved = JSON.parse(readFileSync(path(), "utf8")) as BankAccount[];
  // Upgrade only the original untouched placeholders, never an admin's real settings.
  const untouchedDemo =
    saved.length === 3 &&
    saved.every((account, index) =>
      Object.entries(demoBankAccounts[index]!).every(
        ([key, value]) => account[key as keyof BankAccount] === value,
      ),
    );
  return untouchedDemo ? defaultBankAccounts : saved;
}
function digits(value: string) {
  return value
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[\s-]/g, "");
}
export function validateBankAccounts(value: unknown): BankAccount[] {
  if (!Array.isArray(value) || value.length !== 3) throw new Error("سه حساب بانکی لازم است.");
  return value.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error("اطلاعات حساب معتبر نیست.");
    const text = (key: string) => (typeof raw[key] === "string" ? raw[key].trim() : "");
    const cardNumber = digits(text("cardNumber"));
    const rawIban = digits(text("iban")).toUpperCase();
    const iban = /^\d{24}$/.test(rawIban) ? `IR${rawIban}` : rawIban;
    const bankName = text("bankName"),
      holderName = text("holderName");
    const enabled = raw.enabled === true;
    if (
      !bankName ||
      bankName.length > 80 ||
      !holderName ||
      holderName.length > 100 ||
      cardNumber.length > 16 ||
      iban.length > 26
    )
      throw new Error("اطلاعات حساب بانکی کامل نیست.");
    if (enabled) {
      const checksum = [...cardNumber].reduce((sum, digit, i) => {
        const n = Number(digit) * (i % 2 === 0 ? 2 : 1);
        return sum + (n > 9 ? n - 9 : n);
      }, 0);
      if (!/^[1-9]\d{15}$/.test(cardNumber) || checksum % 10 !== 0)
        throw new Error("شماره کارت معتبر نیست.");
      if (
        !/^IR\d{24}$/.test(iban) ||
        BigInt(`${iban.slice(4)}1827${iban.slice(2, 4)}`) % 97n !== 1n
      )
        throw new Error("شماره شبا معتبر نیست.");
    }
    return { id: `bank_${index + 1}`, bankName, holderName, cardNumber, iban, enabled };
  });
}
export function saveBankAccounts(value: unknown) {
  const accounts = validateBankAccounts(value);
  mkdirSync(dirname(path()), { recursive: true });
  const temporary = `${path()}.${crypto.randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(accounts), { mode: 0o600 });
  renameSync(temporary, path());
  return accounts;
}
