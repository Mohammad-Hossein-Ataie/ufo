export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "customer" | "support";
  bodyFa: string;
  createdAt: string;
}

export interface ChatProvider {
  startConversation(phone: string): Promise<{ conversationId: string }>;
  sendMessage(conversationId: string, message: Omit<ChatMessage, "id" | "conversationId" | "createdAt">): Promise<ChatMessage>;
  listMessages(conversationId: string): Promise<ChatMessage[]>;
}

export class MockChatProvider implements ChatProvider {
  private readonly messages = new Map<string, ChatMessage[]>();

  async startConversation(phone: string): Promise<{ conversationId: string }> {
    const conversationId = `chat_${phone}_${Date.now()}`;
    this.messages.set(conversationId, []);
    return { conversationId };
  }

  async sendMessage(
    conversationId: string,
    message: Omit<ChatMessage, "id" | "conversationId" | "createdAt">,
  ): Promise<ChatMessage> {
    const entry: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      conversationId,
      createdAt: new Date().toISOString()
    };
    const messages = this.messages.get(conversationId) ?? [];
    messages.push(entry);
    this.messages.set(conversationId, messages);
    return entry;
  }

  async listMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.messages.get(conversationId) ?? [];
  }
}
