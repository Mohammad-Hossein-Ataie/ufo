import { beforeEach, expect, it, vi } from "vitest";
import { createGalleryImageCache } from "@/lib/gallery-image-cache";
import { prepareCarouselImage, type PreparedCarouselImage } from "@/lib/product-carousel-image";

vi.mock("@/lib/product-carousel-image", () => ({ prepareCarouselImage: vi.fn() }));
const url = (i: number) => `/api/product-images/catalog/demo/gallery-${i}/detail?v=5`;
beforeEach(() => {
  vi.mocked(prepareCarouselImage).mockReset();
  vi.mocked(prepareCarouselImage).mockImplementation(async ({ src }) => ({
    src,
    resolvedSrc: src,
  }));
});

it("shares a warm request with an on-demand load and reuses the prepared result", async () => {
  const cache = createGalleryImageCache();
  const warming = cache.warm([url(1), url(1)]);
  const selected = cache.load(url(1));
  await warming;
  await selected;
  await cache.load(url(1));
  expect(prepareCarouselImage).toHaveBeenCalledTimes(1);
  expect(vi.mocked(prepareCarouselImage).mock.calls[0]?.[3]).toBe("low");
  cache.dispose();
});

it("warms at most two protected derivatives concurrently and caps the queue at twelve", async () => {
  let active = 0;
  let peak = 0;
  vi.mocked(prepareCarouselImage).mockImplementation(async ({ src }) => {
    active++;
    peak = Math.max(active, peak);
    await Promise.resolve();
    active--;
    return { src, resolvedSrc: src };
  });
  const cache = createGalleryImageCache();
  await cache.warm([
    "https://images.example.test/original.jpg",
    "/images/source.png",
    ...Array.from({ length: 20 }, (_, i) => url(i)),
  ]);
  expect(peak).toBe(2);
  expect(prepareCarouselImage).toHaveBeenCalledTimes(12);
  expect(
    vi
      .mocked(prepareCarouselImage)
      .mock.calls.every(([image]) => image.src.startsWith("/api/product-images/")),
  ).toBe(true);
  cache.dispose();
});

it("does not retain failures, and can restart after StrictMode cleanup", async () => {
  const cache = createGalleryImageCache();
  vi.mocked(prepareCarouselImage).mockResolvedValueOnce(undefined);
  expect(await cache.load(url(0))).toBeUndefined();
  expect(await cache.load(url(0))).toBeDefined();
  const oldSignal = vi.mocked(prepareCarouselImage).mock.calls[1]![1];
  cache.dispose();
  expect(oldSignal.aborted).toBe(true);
  await cache.warm([url(0)]);
  expect(vi.mocked(prepareCarouselImage).mock.calls[2]![1].aborted).toBe(false);
  cache.dispose();
});

it("stops queued work after unmount", async () => {
  const resolvers: Array<(value: PreparedCarouselImage | undefined) => void> = [];
  vi.mocked(prepareCarouselImage).mockImplementation(
    () => new Promise((resolve) => resolvers.push(resolve)),
  );
  const cache = createGalleryImageCache();
  const warming = cache.warm([url(0), url(1), url(2)]);
  cache.dispose();
  resolvers.forEach((resolve) => resolve(undefined));
  await warming;
  expect(prepareCarouselImage).toHaveBeenCalledTimes(2);
});
