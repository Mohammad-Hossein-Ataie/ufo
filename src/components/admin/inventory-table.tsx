"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { Badge, Price } from "@ufo/ui";
import { getAvailableStock, inventoryItems, products, variants } from "@ufo/domain";

interface InventoryRow {
  productName: string;
  variantName: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  wholesalePriceRial: number;
}

const rows: InventoryRow[] = inventoryItems.map((item) => {
  const variant = variants.find((entry) => entry.id === item.variantId);
  const product = variant ? products.find((entry) => entry.id === variant.productId) : undefined;
  return {
    productName: product?.nameFa ?? "نامشخص",
    variantName: variant?.nameFa ?? "نامشخص",
    sku: variant?.sku ?? "-",
    onHand: item.onHand,
    reserved: item.reserved,
    available: getAvailableStock(item),
    wholesalePriceRial: variant?.wholesalePriceRial ?? 0
  };
});

const columns: ColumnDef<InventoryRow>[] = [
  { accessorKey: "productName", header: "محصول" },
  { accessorKey: "variantName", header: "واریانت" },
  { accessorKey: "sku", header: "SKU" },
  {
    accessorKey: "available",
    header: "قابل فروش",
    cell: ({ row }) => {
      const value = row.original.available;
      return <Badge tone={value <= 0 ? "warning" : value < 10 ? "warning" : "success"}>{new Intl.NumberFormat("fa-IR").format(value)}</Badge>;
    }
  },
  { accessorKey: "reserved", header: "رزرو" },
  {
    accessorKey: "wholesalePriceRial",
    header: "قیمت همکاری",
    cell: ({ row }) => <Price valueRial={row.original.wholesalePriceRial} />
  }
];

export function InventoryTable() {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="overflow-x-auto rounded-md border border-[#D7DDE4] bg-white">
      <table className="min-w-[760px] w-full text-sm">
        <thead className="bg-[#EEF3F8] text-[#4C5A67]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 text-right font-bold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-[#E2E7ED]">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
