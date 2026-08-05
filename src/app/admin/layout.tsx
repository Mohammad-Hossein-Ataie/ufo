import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "UFO Puff Admin",
    template: "%s | Admin"
  },
  description: "پنل مدیریت UFO Puff",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
