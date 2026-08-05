"use client";

import { useMemo, useState } from "react";
import { Button, Price } from "@ufo/ui";
import {
  calculateCartonQuantity,
  products,
  validateWholesaleCartonCount,
  variants,
} from "@ufo/domain";

type CartonState = Record<string, number>;

export function QuickOrderClient() {
  const [cartons, setCartons] = useState<CartonState>(() =>
    Object.fromEntries(
      variants
        .filter((variant) => variant.wholesaleEnabled !== false)
        .map((variant) => [variant.id, variant.minWholesaleCartonCount]),
    ),
  );

  const lines = useMemo(
    () =>
      variants
        .filter((variant) => variant.wholesaleEnabled !== false)
        .map((variant) => {
          const product = products.find((item) => item.id === variant.productId);
          if (product?.salesChannels && !product.salesChannels.includes("wholesale"))
            return undefined;
          const cartonCount = cartons[variant.id] ?? variant.minWholesaleCartonCount;
          const quantity = calculateCartonQuantity(variant, cartonCount);
          return {
            variant,
            product,
            cartonCount,
            quantity,
            totalRial: quantity * variant.wholesalePriceRial,
          };
        })
        .filter((line): line is NonNullable<typeof line> => Boolean(line)),
    [cartons],
  );

  const totalRial = lines.reduce((sum, line) => sum + line.totalRial, 0);

  function updateCarton(variantId: string, value: number) {
    setCartons((current) => ({ ...current, [variantId]: value }));
  }

  function saveWholesaleCart() {
    const payload = lines.map((line) => {
      validateWholesaleCartonCount(line.variant, line.cartonCount);
      return {
        variantId: line.variant.id,
        quantity: line.quantity,
        cartonCount: line.cartonCount,
        channel: "wholesale",
      };
    });
    window.localStorage.setItem("ufo-b2b-cart", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("ufo-b2b-cart-updated"));
    window.location.href = "/b2b/cart";
  }

  return (
    <div className="grid gap-5">
      <div className="overflow-x-auto rounded-md border border-[#D5D9C9] bg-white">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-[#EEF0E5] text-[#405148]">
            <tr>
              <th className="px-4 py-3 text-right">محصول</th>
              <th className="px-4 py-3 text-right">SKU</th>
              <th className="px-4 py-3 text-right">تعداد در کارتن</th>
              <th className="px-4 py-3 text-right">کارتن</th>
              <th className="px-4 py-3 text-right">قیمت همکاری</th>
              <th className="px-4 py-3 text-right">جمع</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.variant.id} className="border-t border-[#E2E4D8]">
                <td className="px-4 py-3 font-bold">{line.product?.nameFa ?? "محصول"}</td>
                <td className="px-4 py-3" dir="ltr">
                  {line.variant.sku}
                </td>
                <td className="px-4 py-3">
                  {new Intl.NumberFormat("fa-IR").format(line.variant.cartonSize)}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={line.variant.minWholesaleCartonCount}
                    value={line.cartonCount}
                    onChange={(event) => updateCarton(line.variant.id, Number(event.target.value))}
                    className="h-11 w-24 rounded-md border border-[#C8CDBD] px-3"
                  />
                </td>
                <td className="px-4 py-3">
                  <Price valueRial={line.variant.wholesalePriceRial} />
                </td>
                <td className="px-4 py-3 font-bold">
                  <Price valueRial={line.totalRial} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#D5D9C9] bg-[#14201B] p-4 text-white">
        <span className="text-lg font-bold">
          جمع سفارش: <Price valueRial={totalRial} />
        </span>
        <Button
          type="button"
          className="border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D]"
          onClick={saveWholesaleCart}
        >
          انتقال به سبد عمده
        </Button>
      </aside>
    </div>
  );
}
