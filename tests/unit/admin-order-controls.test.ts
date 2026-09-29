// @vitest-environment jsdom
import * as React from "react";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { JalaliDateTimePicker } from "@/components/admin/jalali-date-time-picker";
import { AdminOrderFulfillment } from "@/components/admin/admin-order-fulfillment";
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

it("keeps the calendar in view after resizing, emits UTC from Tehran time and restores focus", async () => {
  const change = vi.fn();
  let resize: () => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
  await act(async () =>
    root.render(
      createElement(JalaliDateTimePicker, {
        value: "2026-09-29T08:30:00.000Z",
        onChange: change,
      }),
    ),
  );
  const trigger = host.querySelector<HTMLButtonElement>('[aria-label="زمان انتشار"]')!;
  vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
    top: 650,
    bottom: 698,
    left: 300,
    right: 550,
    width: 250,
    height: 48,
    x: 300,
    y: 650,
    toJSON: () => ({}),
  });
  await click(trigger);
  const calendar = document.querySelector<HTMLElement>(
    '[role="dialog"][aria-label="انتخاب تاریخ جلالی انتشار"]',
  )!;
  expect(calendar).not.toBeNull();
  expect(host.querySelector('input[type="datetime-local"]')).toBeNull();
  const initialTop = Number.parseFloat(calendar.style.top);
  vi.spyOn(calendar, "getBoundingClientRect").mockReturnValue({
    top: initialTop,
    bottom: initialTop + 650,
    left: 198,
    right: 550,
    width: 352,
    height: 650,
    x: 198,
    y: initialTop,
    toJSON: () => ({}),
  });
  await act(async () => resize());
  expect(Number.parseFloat(calendar.style.top)).toBeLessThan(initialTop);
  expect(Number.parseFloat(calendar.style.top) + 650).toBeLessThanOrEqual(window.innerHeight);
  await click(calendar.querySelector<HTMLButtonElement>('[aria-label="۱ مهر ۱۴۰۵"]')!);
  expect(change).toHaveBeenCalledWith("2026-09-23T08:30:00.000Z");
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(document.querySelector('[aria-label="انتخاب تاریخ جلالی انتشار"]')).toBeNull();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(trigger);
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
