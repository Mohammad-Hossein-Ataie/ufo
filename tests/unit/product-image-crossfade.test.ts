// @vitest-environment jsdom
import { act, createElement } from "react";
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProductImageCrossfade } from "@/components/product-image-crossfade";
import { prepareCarouselImage, type PreparedCarouselImage } from "@/lib/product-carousel-image";

vi.mock("@/lib/product-carousel-image", () => ({ prepareCarouselImage: vi.fn() }));
vi.mock("@/components/protected-product-image", () => ({
  ProtectedProductImage: (props: { src: string; alt: string; "aria-hidden"?: boolean }) =>
    createElement("img", { src: props.src, alt: props.alt, "aria-hidden": props["aria-hidden"] }),
}));
let root: Root;
let host: HTMLDivElement;
let reduced = false;
let media: EventTarget;
const render = async (src: string) => {
  await act(async () => root.render(createElement(ProductImageCrossfade, { src, alt: src })));
};
const sources = () => [...host.querySelectorAll("img")].map((img) => img.getAttribute("src"));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  reduced = false;
  media = new EventTarget();
  Object.defineProperty(media, "matches", { get: () => reduced });
  vi.stubGlobal("matchMedia", () => media);
  vi.mocked(prepareCarouselImage).mockImplementation(async (image) => ({
    src: image.src,
    resolvedSrc: image.src,
  }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("keeps the old image until decode, then overlaps without duplicate accessible images", async () => {
  let resolve!: (value: PreparedCarouselImage) => void;
  vi.mocked(prepareCarouselImage).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await render("/a.webp");
  await render("/b.webp");
  expect(sources()).toEqual(["/a.webp"]);
  await act(async () => resolve({ src: "/b.webp", resolvedSrc: "/b.webp" }));
  expect(sources()).toEqual(["/a.webp", "/b.webp"]);
  expect(host.querySelectorAll('img:not([aria-hidden="true"])')).toHaveLength(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(680);
  });
  expect(sources()).toEqual(["/b.webp"]);
});

it("finishes the visible fade and coalesces rapid choices to the latest target", async () => {
  await render("/a.webp");
  await render("/b.webp");
  await render("/c.webp");
  await render("/d.webp");
  expect(sources()).toEqual(["/a.webp", "/b.webp"]);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(680);
  });
  expect(sources()).toEqual(["/b.webp", "/d.webp"]);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(680);
  });
  expect(sources()).toEqual(["/d.webp"]);
  expect(vi.mocked(prepareCarouselImage).mock.calls.map(([image]) => image.src)).not.toContain(
    "/c.webp",
  );
});

it("keeps the current image on failure and changes instantly with reduced motion", async () => {
  await render("/a.webp");
  vi.mocked(prepareCarouselImage).mockResolvedValueOnce(undefined);
  await render("/failed.webp");
  expect(sources()).toEqual(["/a.webp"]);
  reduced = true;
  await render("/b.webp");
  expect(sources()).toEqual(["/b.webp"]);
  expect(vi.getTimerCount()).toBe(0);
});

it("finishes an active fade when reduced motion is enabled", async () => {
  await render("/a.webp");
  await render("/b.webp");
  reduced = true;
  await act(async () => media.dispatchEvent(new Event("change")));
  expect(sources()).toEqual(["/b.webp"]);
  expect(vi.getTimerCount()).toBe(0);
});
