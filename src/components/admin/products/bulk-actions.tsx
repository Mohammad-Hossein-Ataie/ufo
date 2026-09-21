"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@ufo/ui";
import type { Brand, Category } from "@ufo/types";
import type { BulkProductInput } from "@/lib/admin-product-bulk";
import { SearchableSelect } from "./searchable-select";
import { PriceInput } from "./price-input";
export function ConfirmationDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/50" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[100] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 text-slate-900 shadow-xl"
        >
          <Dialog.Title className="text-lg font-black">{title}</Dialog.Title>
          <Dialog.Description className="my-4 whitespace-pre-line text-sm leading-7 text-slate-600">
            {description}
          </Dialog.Description>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={busy} onClick={onCancel}>
              انصراف
            </Button>
            <Button disabled={busy} onClick={onConfirm}>
              {busy ? "در حال انجام…" : "تأیید"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
const labels = {
  activate: "فعال‌سازی",
  deactivate: "غیرفعال‌سازی",
  category: "تغییر دسته",
  brand: "تغییر برند",
  prices: "تغییر قیمت‌ها",
  delete: "حذف محصولات",
};
export function BulkActions({
  ids,
  brands,
  categories,
  disabled,
  onApply,
  onClear,
}: {
  ids: string[];
  brands: Brand[];
  categories: Category[];
  disabled: boolean;
  onApply: (input: BulkProductInput) => Promise<void>;
  onClear: () => void;
}) {
  const [action, setAction] = useState<keyof typeof labels>("activate");
  const [value, setValue] = useState("");
  const [retail, setRetail] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [confirm, setConfirm] = useState(false);
  if (!ids.length) return null;
  const priceValid = [retail, wholesale].every(
    (v) => v === "" || (Number.isSafeInteger(Number(v) * 10) && Number(v) >= 0),
  );
  const valid =
    action === "category" || action === "brand"
      ? Boolean(value)
      : action === "prices"
        ? Boolean(retail || wholesale) && priceValid
        : true;
  const detail =
    action === "prices"
      ? `قیمت هر عدد برای همهٔ مدل‌های این محصولات جایگزین می‌شود.\n${retail !== "" ? `تکی: ${Number(retail).toLocaleString("fa-IR")} تومان` : "تکی: بدون تغییر"}\n${wholesale !== "" ? `عمده: ${Number(wholesale).toLocaleString("fa-IR")} تومان` : "عمده: بدون تغییر"}`
      : action === "delete"
        ? "محصولات از کاتالوگ حذف می‌شوند. سوابق سفارش‌ها و فایل تصاویر حفظ می‌شوند."
        : action === "category"
          ? (categories.find((c) => c.id === value)?.nameFa ?? "")
          : action === "brand"
            ? (brands.find((b) => b.id === value)?.nameFa ?? "")
            : "وضعیت انتشار محصولات و مدل‌های آن‌ها تغییر می‌کند.";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
      <strong>{ids.length.toLocaleString("fa-IR")} محصول انتخاب شده</strong>
      <SearchableSelect
        label="عملیات گروهی"
        disabled={disabled}
        className="min-w-36"
        value={action}
        options={Object.entries(labels).map(([value, label]) => ({ value, label }))}
        onChange={(next) => {
          setAction(next as keyof typeof labels);
          setValue("");
        }}
      />
      {(action === "category" || action === "brand") && (
        <SearchableSelect
          label="مقدار جدید گروهی"
          disabled={disabled}
          className="min-w-44"
          value={value}
          options={(action === "category" ? categories : brands).map((item) => ({
            value: item.id,
            label: item.nameFa,
          }))}
          onChange={setValue}
        />
      )}
      {action === "prices" && (
        <>
          <PriceInput
            className="w-48"
            aria-label="قیمت تکی جدید به تومان"
            placeholder="تکی (تومان)، خالی: حفظ"
            disabled={disabled}
            value={retail}
            onValueChange={setRetail}
          />
          <PriceInput
            className="w-48"
            aria-label="قیمت عمده جدید به تومان"
            placeholder="عمده (تومان)، خالی: حفظ"
            disabled={disabled}
            value={wholesale}
            onValueChange={setWholesale}
          />
        </>
      )}
      <Button disabled={disabled || !valid} onClick={() => setConfirm(true)}>
        اعمال تغییرات
      </Button>
      <Button variant="secondary" disabled={disabled} onClick={onClear}>
        لغو انتخاب
      </Button>
      <ConfirmationDialog
        open={confirm}
        busy={disabled}
        title={`${labels[action]} برای ${ids.length.toLocaleString("fa-IR")} محصول؟`}
        description={detail}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          const input: BulkProductInput =
            action === "category" || action === "brand"
              ? { ids, action, value }
              : action === "prices"
                ? {
                    ids,
                    action,
                    ...(retail !== "" ? { retailPriceRial: Number(retail) * 10 } : {}),
                    ...(wholesale !== "" ? { wholesalePriceRial: Number(wholesale) * 10 } : {}),
                  }
                : { ids, action };
          await onApply(input);
          setConfirm(false);
        }}
      />
    </div>
  );
}
