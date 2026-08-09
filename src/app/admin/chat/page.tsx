import { AdminChatInboxClient } from "@/components/admin/admin-chat-inbox-client";
import { listSubmittedOrders } from "@ufo/orders";

export const dynamic = "force-dynamic";

export default function AdminChatPage() {
  const orders = listSubmittedOrders();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <AdminChatInboxClient orders={orders} />
    </main>
  );
}
