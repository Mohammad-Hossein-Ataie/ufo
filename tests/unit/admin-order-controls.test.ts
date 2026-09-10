// @vitest-environment jsdom
import * as React from "react";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { JalaliDateTimePicker } from "@/components/admin/jalali-date-time-picker";
import { AdminOrderFulfillment } from "@/components/admin/admin-order-fulfillment";
import { shiftDay, tehranDayKey } from "@/lib/jalali-calendar";
import type { SubmittedOrder } from "@ufo/orders";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const button = (text: string) =>
  [...host.querySelectorAll("button")].find((b) => b.textContent?.includes(text))!;
const click = async (element: HTMLElement) => {
  await act(async () => element.click());
};

it("selects a Persian calendar day, emits the Tehran wall time and closes on Escape", async () => {
  const change = vi.fn();
  await act(async () =>
    root.render(createElement(JalaliDateTimePicker, { value: "", onChange: change })),
  );
  await click(button("انتخاب تاریخ شمسی"));
  expect(host.querySelector('[aria-label="تقویم شمسی"]')).not.toBeNull();
  expect(host.querySelector('input[type="datetime-local"]')).toBeNull();
  await click(button("فردا"));
  expect(change).toHaveBeenCalledWith(`${shiftDay(tehranDayKey(), 1)}T12:00`);
  expect(host.querySelector('[aria-label="تقویم شمسی"]')).toBeNull();
  await click(button("انتخاب تاریخ شمسی"));
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(host.querySelector('[aria-label="تقویم شمسی"]')).toBeNull();
  expect(document.activeElement).toBe(button("انتخاب تاریخ شمسی"));
});

it.each(["pickup", "tipax"])(
  "requires an explicit delivery check for %s",
  async (shippingMethod) => {
    const order = {
      id: "test",
      shippingMethod,
      status: shippingMethod === "pickup" ? "ready_for_pickup" : "shipped",
      paymentStatus: "approved",
      shippingAddress: { line1: "مغازه آزمایشی" },
    } as SubmittedOrder;
    const request = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          order: { ...order, status: "delivered", deliveredAt: new Date().toISOString() },
        }),
      });
    vi.stubGlobal("fetch", request);
    await act(async () =>
      root.render(createElement(AdminOrderFulfillment, { initialOrder: order })),
    );
    expect(button("ثبت نهایی تحویل").disabled).toBe(true);
    await click(button("ثبت نهایی تحویل"));
    expect(request).not.toHaveBeenCalled();
    await click(host.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    expect(button("ثبت نهایی تحویل").disabled).toBe(false);
    await click(button("ثبت نهایی تحویل"));
    expect(JSON.parse(request.mock.calls[0]![1].body)).toEqual({
      status: "delivered",
      deliveryConfirmed: true,
    });
    expect(host.textContent).toContain("سفارش به مشتری تحویل داده شد");
  },
);
