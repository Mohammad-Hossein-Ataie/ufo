// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareCarouselImage } from "@/lib/product-carousel-image";
let instances: FakeImage[];
class FakeImage {
  src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decode = vi.fn(async () => {});
  removeAttribute = vi.fn();
  constructor() {
    instances.push(this);
  }
}
const input = {
  src: "/api/product-images/catalog/p1/primary/card?v=2",
  fallbackSrc: "/images/categories/pod.webp",
};
beforeEach(() => {
  instances = [];
  vi.useFakeTimers();
  vi.stubGlobal("Image", FakeImage);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("carousel protected-image preparation", () => {
  it("decodes the protected derivative before reporting readiness", async () => {
    const promise = prepareCarouselImage(input, new AbortController().signal);
    expect(instances[0]!.src).toBe(input.src);
    instances[0]!.onload!();
    expect(await promise).toEqual({ src: input.src, resolvedSrc: input.src });
    expect(instances[0]!.decode).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("prepares the real fallback when a derivative errors", async () => {
    const promise = prepareCarouselImage(input, new AbortController().signal);
    instances[0]!.onerror!();
    await Promise.resolve();
    expect(instances[1]!.src).toBe(input.fallbackSrc);
    instances[1]!.onload!();
    expect(await promise).toEqual({ src: input.src, resolvedSrc: input.fallbackSrc });
  });
  it("bounds slow loads and returns failure if neither image is usable", async () => {
    const promise = prepareCarouselImage(input, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(16000);
    expect(await promise).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("allows a slow detail image to decode within its explicit time budget", async () => {
    const promise = prepareCarouselImage(input, new AbortController().signal, 30000);
    await vi.advanceTimersByTimeAsync(9000);
    expect(instances).toHaveLength(1);
    instances[0]!.onload!();
    expect(await promise).toEqual({ src: input.src, resolvedSrc: input.src });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("aborts without starting a fallback or leaking timers/listeners", async () => {
    const abort = new AbortController();
    const promise = prepareCarouselImage(input, abort.signal);
    abort.abort();
    expect(await promise).toBeUndefined();
    expect(instances).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(instances[0]!.onload).toBeNull();
  });
});
