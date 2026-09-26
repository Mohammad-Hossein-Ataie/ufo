// @vitest-environment jsdom
import { act, createElement } from "react";
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ImageLightbox } from "@/components/image-lightbox";

vi.mock("@/components/protected-product-image", () => ({
  ProtectedProductImage: (props: { src: string; alt: string; "aria-hidden"?: boolean }) =>
    createElement("img", {
      src: props.src,
      alt: props.alt,
      "aria-hidden": props["aria-hidden"],
    }),
}));

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value(options: ScrollToOptions) {
      this.scrollTop = Number(options.top ?? 0);
      this.dispatchEvent(new Event("scroll"));
    },
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

it("renders every protected image and moves the active accessible slide", async () => {
  await act(async () =>
    root.render(
      createElement(ImageLightbox, {
        open: true,
        onClose: vi.fn(),
        src: "/a.webp",
        alt: "تصویر اول",
        images: [
          { src: "/a.webp", alt: "تصویر اول" },
          { src: "/b.webp", alt: "تصویر دوم" },
          { src: "/c.webp", alt: "تصویر سوم" },
        ],
      }),
    ),
  );

  const scroller = document.querySelector<HTMLElement>('[data-testid="image-lightbox-scroller"]')!;
  const slides = [...document.querySelectorAll<HTMLElement>("[data-lightbox-slide]")];
  expect(slides).toHaveLength(3);
  slides.forEach((slide, index) =>
    Object.defineProperty(slide, "offsetTop", { configurable: true, value: index * 600 }),
  );
  expect(document.querySelectorAll('img:not([aria-hidden="true"])')).toHaveLength(1);
  expect(document.querySelector('img:not([aria-hidden="true"])')?.getAttribute("src")).toBe("/a.webp");

  const next = document.querySelector<HTMLButtonElement>('button[aria-label="تصویر بعدی"]')!;
  await act(async () => next.click());

  expect(scroller.dataset.activeIndex).toBe("1");
  expect(document.querySelectorAll('img:not([aria-hidden="true"])')).toHaveLength(1);
  expect(document.querySelector('img:not([aria-hidden="true"])')?.getAttribute("src")).toBe("/b.webp");
  expect(document.body.textContent).toContain("۲ از ۳");
});
