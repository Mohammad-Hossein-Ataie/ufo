import type { Metadata } from "next";
import { ContentManager } from "@/components/admin/content-manager";

export const metadata: Metadata = { title: "اخبار و مقالات" };
export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  return <ContentManager />;
}
