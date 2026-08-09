"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Clock3,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge, Button, EmptyState, Input, Price, StatusPill, cn } from "@ufo/ui";
import type { ChatMessageRecord, SubmittedOrder } from "@ufo/orders";
import type { OrderStatus } from "@ufo/types";

type InboxFilter = "all" | "unread" | "wholesale" | "retail";

interface ThreadSummary {
  order: SubmittedOrder;
  lastMessage: ChatMessageRecord | undefined;
  unreadCount: number;
}

const filterLabels: Record<InboxFilter, string> = {
  all: "همه گفتگوها",
  unread: "خوانده‌نشده",
  wholesale: "عمده",
  retail: "تکی",
};

const orderStatusLabelsFa: Record<OrderStatus, string> = {
  draft: "پیش‌نویس",
  awaiting_payment: "در انتظار پرداخت",
  awaiting_receipt: "در انتظار رسید",
  payment_under_review: "در انتظار تایید پرداخت",
  confirmed: "تایید شده",
  processing: "در حال آماده‌سازی",
  ready_for_pickup: "آماده تحویل حضوری",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
};

function formatRelative(value?: string) {
  if (!value) return "بدون پیام";
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 60) return `${new Intl.NumberFormat("fa-IR").format(diffMinutes)} دقیقه پیش`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${new Intl.NumberFormat("fa-IR").format(diffHours)} ساعت پیش`;
  const diffDays = Math.round(diffHours / 24);
  return `${new Intl.NumberFormat("fa-IR").format(diffDays)} روز پیش`;
}

function getPreview(message?: ChatMessageRecord) {
  if (!message) return "هنوز گفت‌وگویی برای این سفارش شروع نشده است.";
  if (message.body.trim()) return message.body;
  return `${new Intl.NumberFormat("fa-IR").format(message.attachments?.length ?? 0)} تصویر ارسال شده`;
}

function sortThreads(left: ThreadSummary, right: ThreadSummary) {
  if (left.unreadCount !== right.unreadCount) return right.unreadCount - left.unreadCount;
  const leftTime = new Date(left.lastMessage?.createdAt ?? left.order.updatedAt).getTime();
  const rightTime = new Date(right.lastMessage?.createdAt ?? right.order.updatedAt).getTime();
  return rightTime - leftTime;
}

export function AdminChatInboxClient({ orders }: { orders: SubmittedOrder[] }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");

  const threads = useMemo<ThreadSummary[]>(() => {
    return orders
      .map((order) => ({
        order,
        lastMessage: order.chat.at(-1),
        unreadCount: order.chat.filter(
          (message) => message.sender === "customer" && !message.readByAdminAt,
        ).length,
      }))
      .sort(sortThreads);
  }, [orders]);

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return threads.filter(({ order, lastMessage, unreadCount }) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && unreadCount > 0) ||
        activeFilter === order.channel;
      const searchBlob = [
        order.orderNumber,
        order.customer.fullName,
        order.customer.businessName,
        order.customer.phone,
        lastMessage?.body,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesFilter && (!normalizedQuery || searchBlob.includes(normalizedQuery));
    });
  }, [activeFilter, query, threads]);

  const summary = useMemo(() => {
    const unread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
    const active = threads.filter((thread) => thread.order.chat.length > 0).length;
    const wholesale = threads.filter((thread) => thread.order.channel === "wholesale").length;
    const waitingCustomers = threads.filter(
      (thread) => thread.unreadCount > 0 && thread.lastMessage?.sender === "customer",
    ).length;
    return { unread, active, wholesale, waitingCustomers };
  }, [threads]);

  return (
    <div className="grid gap-6">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cyan-700">مرکز گفت‌وگوی یوفوپاف</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">پشتیبانی سفارش‌ها</h1>
            <p className="mt-2 max-w-3xl leading-8 text-slate-600">
              همه پیام‌های مشتریان عمده و خرده را بر اساس فوریت، کانال فروش و وضعیت خوانده‌شدن
              پیگیری کنید.
            </p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
            اعلان‌ها فعال: {new Intl.NumberFormat("fa-IR").format(summary.unread)} پیام جدید
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "پیام خوانده‌نشده",
            value: summary.unread,
            icon: Bell,
            tone: "text-amber-700 bg-amber-50",
          },
          {
            label: "گفت‌وگوی فعال",
            value: summary.active,
            icon: MessageCircle,
            tone: "text-cyan-700 bg-cyan-50",
          },
          {
            label: "پرونده عمده",
            value: summary.wholesale,
            icon: Building2,
            tone: "text-emerald-700 bg-emerald-50",
          },
          {
            label: "نیازمند پاسخ",
            value: summary.waitingCustomers,
            icon: Clock3,
            tone: "text-rose-700 bg-rose-50",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {new Intl.NumberFormat("fa-IR").format(item.value)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-md",
                  item.tone,
                )}
              >
                <item.icon size={21} aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pr-11"
              placeholder="جستجو بر اساس شماره سفارش، نام مشتری یا شماره تماس"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(filterLabels) as InboxFilter[]).map((filter) => (
              <Button
                key={filter}
                type="button"
                variant={activeFilter === filter ? "primary" : "secondary"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
              >
                {filterLabels[filter]}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {filteredThreads.length === 0 ? (
          <EmptyState title="گفت‌وگویی پیدا نشد">
            فیلتر یا عبارت جستجو را تغییر دهید تا سفارش‌های مرتبط با پشتیبانی نمایش داده شوند.
          </EmptyState>
        ) : (
          filteredThreads.map(({ order, lastMessage, unreadCount }) => (
            <article
              key={order.id}
              className={cn(
                "rounded-md border bg-white p-4 shadow-sm transition hover:border-cyan-300 hover:shadow-md",
                unreadCount > 0 ? "border-amber-300" : "border-slate-200",
              )}
            >
              <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-slate-950" dir="ltr">
                      {order.orderNumber}
                    </h2>
                    <Badge tone={order.channel === "wholesale" ? "success" : "info"}>
                      {order.channel === "wholesale" ? "عمده" : "تکی"}
                    </Badge>
                    {unreadCount > 0 ? (
                      <span className="inline-flex min-h-7 items-center rounded-md border border-amber-300 bg-amber-50 px-2 text-xs font-black text-amber-900">
                        {new Intl.NumberFormat("fa-IR").format(unreadCount)} جدید
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <UserRound size={15} aria-hidden="true" />
                      {order.customer.businessName ?? order.customer.fullName}
                    </span>
                    <span dir="ltr">{order.customer.phone}</span>
                    <StatusPill tone="neutral">{orderStatusLabelsFa[order.status]}</StatusPill>
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-500">
                      {lastMessage?.sender === "admin" ? "آخرین پاسخ پشتیبانی" : "آخرین پیام مشتری"}
                    </p>
                    <time className="text-xs text-slate-500">
                      {formatRelative(lastMessage?.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-800">
                    {getPreview(lastMessage)}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-48 lg:grid-cols-1">
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <p className="text-slate-500">مبلغ سفارش</p>
                    <Price
                      valueRial={order.totalRial}
                      className="mt-1 block font-black text-slate-950"
                    />
                  </div>
                  <Link href={`/admin/orders/${order.id}`} className="block">
                    <Button className="w-full">
                      <Send size={16} aria-hidden="true" />
                      باز کردن چت
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <ShieldCheck size={18} className="text-emerald-600" aria-hidden="true" />
          پیام‌های باز شده به صورت خودکار خوانده‌شده علامت می‌خورند؛ پاسخ‌ها، ریپلای و تصاویر در
          تاریخچه همان سفارش باقی می‌مانند.
        </div>
      </section>
    </div>
  );
}
