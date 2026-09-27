import { chatHandlers } from "@/lib/chat-route";
export const runtime = "nodejs";
export const { GET, POST, PATCH } = chatHandlers("admin");
