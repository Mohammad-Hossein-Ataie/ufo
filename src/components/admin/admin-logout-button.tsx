"use client";

import { LogOut } from "lucide-react";
import { Button } from "@ufo/ui";

export function AdminLogoutButton() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={logout}>
      <LogOut size={16} />
      خروج
    </Button>
  );
}
