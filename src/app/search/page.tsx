import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "جستجو",
  robots: { index: false, follow: true }
};

export default function SearchPage() {
  redirect("/products");
}
