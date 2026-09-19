// @vitest-environment jsdom
import * as React from "react";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MotionReveal } from "@/components/motion-reveal";

let host: HTMLDivElement;
let root: Root;
let callback: IntersectionObserverCallback;
const disconnect = vi.fn();
const observe = vi.fn();
let reduced = false;
let preference: EventTarget;
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  reduced = false;
  preference = new EventTarget();
  Object.defineProperty(preference, "matches", { get: () => reduced });
  vi.stubGlobal("matchMedia", () => preference);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
const render = () =>
  act(async () => root.render(createElement(MotionReveal, {}, "Visible content")));

it("starts visible and disconnects observation on the first entry", async () => {
  await render();
  expect(host.textContent).toBe("Visible content");
  expect(host.firstElementChild?.hasAttribute("data-revealed")).toBe(false);
  callback([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver);
  expect(disconnect).not.toHaveBeenCalled();
  callback([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver);
  expect(host.firstElementChild?.getAttribute("data-revealed")).toBe("true");
  expect(disconnect).toHaveBeenCalledOnce();
});

it("does not observe when reduced motion is requested", async () => {
  reduced = true;
  await render();
  expect(observe).not.toHaveBeenCalled();
  expect(host.textContent).toBe("Visible content");
});

it("stops observing when the motion preference changes", async () => {
  await render();
  reduced = true;
  preference.dispatchEvent(new Event("change"));
  expect(disconnect).toHaveBeenCalledOnce();
  expect(host.firstElementChild?.hasAttribute("data-revealed")).toBe(false);
});

it("keeps content accessible when IntersectionObserver is unavailable", async () => {
  Reflect.deleteProperty(window, "IntersectionObserver");
  await render();
  expect(host.textContent).toBe("Visible content");
  expect(observe).not.toHaveBeenCalled();
});
