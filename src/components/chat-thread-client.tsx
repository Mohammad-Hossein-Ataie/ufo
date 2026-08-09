"use client";

import Image from "next/image";
import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  Edit3,
  ImagePlus,
  MessageSquare,
  Paperclip,
  Reply,
  Send,
  X,
} from "lucide-react";
import { Button, IconButton, Textarea } from "@ufo/ui";
import type { ChatMessageRecord, ChatSender } from "@ufo/orders";

interface ChatThreadClientProps {
  orderId: string;
  endpoint: "/api/chat" | "/api/b2b/chat" | "/api/admin/chat";
  currentSender: ChatSender;
  title: string;
  subtitle: string;
  placeholder: string;
  tone: "retail" | "b2b" | "admin";
}

type Attachment = NonNullable<ChatMessageRecord["attachments"]>[number];

const toneClass = {
  retail: {
    shell: "border-[#22303D] bg-[#0D1117] text-white",
    muted: "text-[#9BA7B4]",
    panel: "bg-white/5",
    mine: "border-cyan-300/40 bg-cyan-300/10",
    theirs: "border-emerald-300/40 bg-emerald-300/10",
    composer: "border-[#22303D] bg-[#141A22]",
  },
  b2b: {
    shell: "border-[#D5D9C9] bg-white text-[#102019]",
    muted: "text-[#596B61]",
    panel: "bg-[#F7F7F2]",
    mine: "border-[#1F8A5B]/30 bg-[#1F8A5B]/10",
    theirs: "border-[#E8C547]/50 bg-[#E8C547]/15",
    composer: "border-[#D5D9C9] bg-[#F7F7F2]",
  },
  admin: {
    shell: "border-[#D7DDE4] bg-white text-[#17202A]",
    muted: "text-[#5F6C79]",
    panel: "bg-[#F4F6F8]",
    mine: "border-[#168BFF]/30 bg-[#168BFF]/10",
    theirs: "border-[#1F8A5B]/30 bg-[#1F8A5B]/10",
    composer: "border-[#D7DDE4] bg-[#F8FAFC]",
  },
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function senderLabel(sender: ChatSender, currentSender: ChatSender) {
  if (sender === currentSender) return currentSender === "admin" ? "شما، پشتیبانی" : "شما";
  return sender === "admin" ? "پشتیبانی یوفوپاف" : "مشتری";
}

export function ChatThreadClient({
  orderId,
  endpoint,
  currentSender,
  title,
  subtitle,
  placeholder,
  tone,
}: ChatThreadClientProps) {
  const styles = toneClass[tone];
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("در حال خواندن گفتگو...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messageMap = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );
  const unreadCount = messages.filter((message) =>
    currentSender === "admin"
      ? message.sender === "customer" && !message.readByAdminAt
      : message.sender === "admin" && !message.readByCustomerAt,
  ).length;
  const replyMessage = replyToId ? messageMap.get(replyToId) : undefined;
  const editingMessage = editingId ? messageMap.get(editingId) : undefined;

  async function loadMessages() {
    const response = await fetch(`${endpoint}?orderId=${encodeURIComponent(orderId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { messages?: ChatMessageRecord[] };
    setMessages(payload.messages ?? []);
    setStatus("گفتگو به‌روز است.");
  }

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 3500);
    return () => window.clearInterval(timer);
  }, [orderId, endpoint]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setIsSending(true);
    const uploaded: Attachment[] = [];
    for (const file of Array.from(files).filter((item) => item.type.startsWith("image/"))) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/chat/upload", { method: "POST", body: formData });
      const payload = (await response.json().catch(() => ({}))) as {
        file?: Attachment;
        error?: string;
      };
      if (payload.file?.url) uploaded.push(payload.file);
      if (!response.ok) setStatus(payload.error ?? "آپلود تصویر ناموفق بود.");
    }
    if (uploaded.length > 0) {
      setAttachments((current) => [...current, ...uploaded]);
      setStatus(`${new Intl.NumberFormat("fa-IR").format(uploaded.length)} تصویر آماده ارسال است.`);
    }
    setIsSending(false);
  }

  function dropImages(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDragging(false);
    void uploadImages(event.dataTransfer.files);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed && attachments.length === 0) return;
    setIsSending(true);
    const response = await fetch(endpoint, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        body: trimmed,
        ...(editingId ? { messageId: editingId } : {}),
        ...(replyToId && !editingId ? { replyToId } : {}),
        ...(!editingId && attachments.length > 0 ? { attachments } : {}),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSending(false);
    if (!response.ok) {
      setStatus(payload.error ?? "ارسال پیام انجام نشد.");
      return;
    }
    setBody("");
    setAttachments([]);
    setReplyToId(undefined);
    setEditingId(undefined);
    await loadMessages();
  }

  function startEdit(message: ChatMessageRecord) {
    setEditingId(message.id);
    setReplyToId(undefined);
    setAttachments([]);
    setBody(message.body);
  }

  function cancelContext() {
    setReplyToId(undefined);
    setEditingId(undefined);
    setBody("");
  }

  return (
    <section className={`rounded-md border p-4 shadow-sm ${styles.shell}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <MessageSquare size={20} aria-hidden="true" />
            {title}
          </h2>
          <p className={`mt-1 text-sm leading-6 ${styles.muted}`}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <span className="inline-flex min-h-8 items-center rounded-md border border-amber-300 bg-amber-50 px-2 text-xs font-bold text-amber-900">
              {new Intl.NumberFormat("fa-IR").format(unreadCount)} خوانده‌نشده
            </span>
          ) : (
            <span
              className={`inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs ${styles.panel}`}
            >
              <CheckCheck size={14} aria-hidden="true" />
              خوانده شده
            </span>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`mt-4 grid max-h-[28rem] gap-3 overflow-y-auto rounded-md p-3 ${styles.panel}`}
      >
        {messages.length === 0 ? (
          <div
            className={`rounded-md border border-dashed p-5 text-center text-sm ${styles.muted}`}
          >
            هنوز پیامی ثبت نشده است. گفتگو را با یک پیام کوتاه و شفاف شروع کنید.
          </div>
        ) : null}
        {messages.map((message) => {
          const mine = message.sender === currentSender;
          const replied = message.replyToId ? messageMap.get(message.replyToId) : undefined;
          return (
            <article
              key={message.id}
              className={`grid max-w-[88%] gap-2 rounded-md border p-3 text-sm ${
                mine ? `justify-self-end ${styles.mine}` : `justify-self-start ${styles.theirs}`
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{senderLabel(message.sender, currentSender)}</p>
                <time className={`text-xs ${styles.muted}`}>{formatTime(message.createdAt)}</time>
              </div>
              {replied ? (
                <div
                  className={`rounded-md border-r-2 border-current/30 px-3 py-2 text-xs ${styles.panel}`}
                >
                  <p className="font-bold">{senderLabel(replied.sender, currentSender)}</p>
                  <p className="mt-1 line-clamp-2">{replied.body || "تصویر"}</p>
                </div>
              ) : null}
              {message.body ? (
                <p className="whitespace-pre-wrap leading-7">{message.body}</p>
              ) : null}
              {message.attachments?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {message.attachments.map((file) => (
                    <a
                      key={file.url}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="relative block aspect-[4/3] overflow-hidden rounded-md border border-current/15 bg-black/10"
                    >
                      <Image
                        src={file.url}
                        alt={file.name ?? "تصویر چت"}
                        fill
                        sizes="240px"
                        className="object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs ${styles.muted}`}>
                  {message.editedAt ? "ویرایش شده" : ""}
                  {mine && (message.readByAdminAt || message.readByCustomerAt) ? " · دیده شد" : ""}
                </span>
                <div className="flex gap-1">
                  <IconButton
                    label="ریپلای"
                    className="h-8 w-8 border-current/15 bg-white/10"
                    onClick={() => {
                      setReplyToId(message.id);
                      setEditingId(undefined);
                    }}
                  >
                    <Reply size={14} aria-hidden="true" />
                  </IconButton>
                  {mine ? (
                    <IconButton
                      label="ویرایش پیام"
                      className="h-8 w-8 border-current/15 bg-white/10"
                      onClick={() => startEdit(message)}
                    >
                      <Edit3 size={14} aria-hidden="true" />
                    </IconButton>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {(replyMessage || editingMessage || attachments.length > 0) && (
        <div className={`mt-3 rounded-md border p-3 text-sm ${styles.composer}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              {editingMessage ? <p className="font-bold">ویرایش پیام</p> : null}
              {replyMessage ? (
                <p className="font-bold">
                  پاسخ به {senderLabel(replyMessage.sender, currentSender)}
                </p>
              ) : null}
              {replyMessage ? (
                <p className={`mt-1 line-clamp-2 ${styles.muted}`}>
                  {replyMessage.body || "تصویر"}
                </p>
              ) : null}
              {attachments.length > 0 ? (
                <p className="font-bold">
                  {new Intl.NumberFormat("fa-IR").format(attachments.length)} تصویر آماده ارسال
                </p>
              ) : null}
            </div>
            <IconButton
              label="حذف انتخاب"
              className="h-9 w-9 border-current/15 bg-white/10"
              onClick={cancelContext}
            >
              <X size={15} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      )}

      <form
        onSubmit={submit}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={dropImages}
        className={`mt-3 grid gap-3 rounded-md border p-3 transition ${
          isDragging ? "ring-2 ring-cyan-300" : ""
        } ${styles.composer}`}
      >
        <Textarea
          className="min-h-24"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => void uploadImages(event.target.files)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={16} aria-hidden="true" />
              تصویر
            </Button>
            {attachments.length > 0 ? (
              <span
                className={`inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-xs ${styles.panel}`}
              >
                <Paperclip size={14} aria-hidden="true" />
                {new Intl.NumberFormat("fa-IR").format(attachments.length)}
              </span>
            ) : null}
          </div>
          <Button type="submit" disabled={isSending || (!body.trim() && attachments.length === 0)}>
            <Send size={18} aria-hidden="true" />
            {isSending ? "در حال ارسال..." : editingId ? "ذخیره ویرایش" : "ارسال پیام"}
          </Button>
        </div>
        <p className={`text-xs ${styles.muted}`} role="status">
          {isDragging ? "تصویر را همین‌جا رها کنید." : status}
        </p>
      </form>
    </section>
  );
}
