import { AdminChatInboxClient } from "@/components/admin/admin-chat-inbox-client";
import { AdminPage } from "@/components/admin/admin-ui";
import { listSubmittedOrders } from "@ufo/orders";

export const dynamic = "force-dynamic";

export default function AdminChatPage() {
  const orders = listSubmittedOrders();

  return (
    <AdminPage>
      <AdminChatInboxClient orders={orders} />
    </AdminPage>
  );
}
