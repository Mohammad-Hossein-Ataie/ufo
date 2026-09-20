import { prepareCarouselImage, type PreparedCarouselImage } from "@/lib/product-carousel-image";

/** Page-local decoded images; no originals, persistent storage or catalog state. */
export function createGalleryImageCache() {
  let controller = new AbortController();
  const images = new Map<string, Promise<PreparedCarouselImage | undefined>>();

  function load(src: string, priority: "high" | "low" = "high") {
    // React StrictMode may clean up and set up the same component again.
    if (controller.signal.aborted) controller = new AbortController();
    const existing = images.get(src);
    if (existing) return existing;
    const request = prepareCarouselImage(
      { src, fallbackSrc: "" },
      controller.signal,
      30_000,
      priority,
    ).then((image) => {
      if (!image && images.get(src) === request) images.delete(src);
      return image;
    });
    images.set(src, request);
    // Bound retained decoded entries when a gallery contains many images.
    if (images.size > 24) images.delete(images.keys().next().value!);
    return request;
  }

  async function warm(sources: string[]) {
    if (controller.signal.aborted) controller = new AbortController();
    const signal = controller.signal;
    const queue = [...new Set(sources)]
      .filter((src) => /^\/api\/product-images\/.+\/detail(?:\?|$)/.test(src))
      .slice(0, 12);
    let index = 0;
    const worker = async () => {
      while (!signal.aborted && index < queue.length) {
        await load(queue[index++]!, "low");
      }
    };
    await Promise.all([worker(), worker()]);
  }

  return {
    load,
    warm,
    dispose() {
      controller.abort();
      images.clear();
    },
  };
}
