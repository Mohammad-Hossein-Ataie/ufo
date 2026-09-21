"use client";

import { Input } from "@ufo/ui";
import { toEnglishDigits } from "@ufo/validation";
import type { ComponentProps } from "react";

export function formatPriceInput(value: number | string): string {
  const digits = toEnglishDigits(String(value)).replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

export function PriceInput({
  value,
  onValueChange,
  className = "",
  ...props
}: Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number | string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      dir="ltr"
      className={`text-right tabular-nums ${className}`}
      value={formatPriceInput(value)}
      onChange={(event) => onValueChange(toEnglishDigits(event.target.value).replace(/\D/g, ""))}
    />
  );
}
