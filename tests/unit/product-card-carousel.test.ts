// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProductCardCarousel } from "@/hooks/use-product-card-carousel";
import { prepareCarouselImage, type PreparedCarouselImage } from "@/lib/product-carousel-image";

vi.mock("@/lib/product-carousel-image", () => ({ prepareCarouselImage: vi.fn() }));
let api: ReturnType<typeof useProductCardCarousel>;
let root: Root;
let host: HTMLDivElement;
let intersect: IntersectionObserverCallback;
let hidden = false;
let motion = false;
let media: EventTarget & { matches: boolean };
const images = Array.from({ length: 3 }, (_, i) => ({
  src: `/api/product-images/catalog/p${i}/primary/card?v=2`,
  fallbackSrc: "/images/categories/pod.png",
}));
function Harness({ count, index }: { count: number; index: number }) {
  api = useProductCardCarousel(images.slice(0, count), index);
  return createElement("div", { ref: api.containerRef, dir: "rtl" }, api.activeIndex);
}
async function mount(count = 3, index = 0) {
  await act(async () => root.render(createElement(Harness, { count, index })));
  await inView(true);
}
async function inView(visible: boolean) {
  await act(async () =>
    intersect(
      [{ isIntersecting: visible } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
}
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
async function visibility(value: boolean) {
  hidden = value;
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  hidden = false;
  motion = false;
  media = Object.assign(new EventTarget(), {
    get matches() {
      return motion;
    },
  });
  Object.defineProperty(media, "matches", { get: () => motion });
  vi.stubGlobal("matchMedia", () => media);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => (hidden ? "hidden" : "visible"),
  });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
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

describe("product card carousel", () => {
  it("honors hover that starts before hydration", async () => {
    vi.stubGlobal("matchMedia", (query: string) =>
      query === "(hover: hover)" ? { matches: true } : media,
    );
    const matches = vi.spyOn(Element.prototype, "matches").mockReturnValue(true);
    try {
      await mount();
      await advance(10000);
      expect(api.activeIndex).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      await act(async () => api.resume("hover"));
      await advance(4700);
      expect(api.activeIndex).toBe(1);
    } finally {
      matches.mockRestore();
    }
  });
  it("does not schedule or preload for one item", async () => {
    await mount(1);
    await advance(20000);
    expect(api.activeIndex).toBe(0);
    expect(prepareCarouselImage).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each([2, 3])(
    "loops %s products at 4500ms with an atomic 200ms out / 200ms in transition",
    async (count) => {
      await mount(count);
      for (let step = 1; step <= count; step++) {
        await advance(step === 1 ? 4500 : 4100);
        expect(api.phase).toBe("out");
        expect(api.activeIndex).toBe((step - 1) % count);
        await advance(200);
        expect(api.activeIndex).toBe(step % count);
        expect(api.image?.src).toBe(images[step % count]!.src);
        expect(api.phase).toBe("in");
        await advance(200);
        expect(api.phase).toBe("idle");
      }
    },
  );
  it("staggers the first rotation deterministically and resets manual timing", async () => {
    await mount(3, 2);
    await advance(5299);
    expect(api.phase).toBe("idle");
    await advance(1);
    expect(api.phase).toBe("out");
    await advance(400);
    await act(async () => {
      void api.goTo(2);
    });
    await advance(200);
    await advance(200);
    await advance(4299);
    expect(api.activeIndex).toBe(2);
    expect(api.phase).toBe("idle");
    await advance(1);
    expect(api.phase).toBe("out");
  });
  it("combines hover/focus/touch pause reasons and restarts a full interval on resume", async () => {
    await mount();
    await advance(3000);
    await act(async () => {
      api.pause("hover");
      api.pause("focus");
      api.pause("touch");
    });
    await advance(20000);
    expect(api.activeIndex).toBe(0);
    await act(async () => {
      api.resume("hover");
      api.resume("touch");
    });
    await advance(10000);
    expect(api.activeIndex).toBe(0);
    await act(async () => api.resume("focus"));
    await advance(4499);
    expect(api.phase).toBe("idle");
    await advance(201);
    expect(api.activeIndex).toBe(1);
  });
  it("stops offscreen and hidden tabs and resumes from the current product", async () => {
    await mount();
    await advance(4900);
    expect(api.activeIndex).toBe(1);
    await visibility(true);
    await advance(20000);
    expect(vi.getTimerCount()).toBe(0);
    await inView(false);
    await visibility(false);
    await advance(10000);
    expect(api.activeIndex).toBe(1);
    await inView(true);
    await advance(4700);
    expect(api.activeIndex).toBe(2);
  });
  it("uses manual-only instant changes with reduced motion, including a live preference change", async () => {
    motion = true;
    await mount();
    await advance(20000);
    expect(api.activeIndex).toBe(0);
    await act(async () => {
      void api.goTo(1);
    });
    expect(api.activeIndex).toBe(1);
    expect(api.phase).toBe("idle");
    motion = false;
    await act(async () => {
      media.dispatchEvent(new Event("change"));
    });
    await advance(4700);
    expect(api.activeIndex).toBe(2);
  });
  it("retains the old complete card while an image is slow, and latest manual selection wins", async () => {
    let resolve!: (value: PreparedCarouselImage) => void;
    vi.mocked(prepareCarouselImage).mockImplementation((image) =>
      image.src === images[1]!.src
        ? new Promise((done) => {
            resolve = done;
          })
        : Promise.resolve({ src: image.src, resolvedSrc: image.src }),
    );
    await mount();
    await advance(4500);
    expect(api.activeIndex).toBe(0);
    expect(api.phase).toBe("idle");
    await act(async () => {
      void api.goTo(2);
    });
    await advance(400);
    expect(api.activeIndex).toBe(2);
    await act(async () => resolve({ src: images[1]!.src, resolvedSrc: images[1]!.src }));
    await advance(400);
    expect(api.activeIndex).toBe(2);
  });
  it("never lets autoplay override a slow swipe/manual selection and gives the new card a full interval", async () => {
    let resolve!: (value: PreparedCarouselImage) => void;
    vi.mocked(prepareCarouselImage).mockImplementation((image) =>
      image.src === images[2]!.src
        ? new Promise((done) => {
            resolve = done;
          })
        : Promise.resolve({ src: image.src, resolvedSrc: image.src }),
    );
    await mount();
    await act(async () => {
      void api.goTo(2);
    });
    await advance(9000);
    expect(api.activeIndex).toBe(0);
    await act(async () => resolve({ src: images[2]!.src, resolvedSrc: images[2]!.src }));
    await advance(200);
    expect(api.activeIndex).toBe(2);
    await advance(4499);
    expect(api.activeIndex).toBe(2);
    expect(api.phase).toBe("idle");
    await advance(1);
    expect(api.phase).toBe("out");
  });
  it("keeps the current item on image/fallback failure and retries later", async () => {
    vi.mocked(prepareCarouselImage).mockResolvedValue(undefined);
    await mount();
    await advance(4900);
    expect(api.activeIndex).toBe(0);
    expect(api.phase).toBe("idle");
    vi.mocked(prepareCarouselImage).mockImplementation(async (image) => ({
      src: image.src,
      resolvedSrc: image.fallbackSrc,
    }));
    await advance(4500);
    expect(api.activeIndex).toBe(1);
    expect(api.image?.resolvedSrc).toBe(images[1]!.fallbackSrc);
  });
  it("cancels an automatic exit on hover but still permits manual selection while focused", async () => {
    await mount();
    await advance(4500);
    expect(api.phase).toBe("out");
    await act(async () => {
      api.pause("hover");
      api.pause("focus");
    });
    await advance(400);
    expect(api.activeIndex).toBe(0);
    await act(async () => {
      void api.goTo(2);
    });
    await advance(400);
    expect(api.activeIndex).toBe(2);
  });
  it("supports persistent user pause", async () => {
    await mount();
    await act(async () => api.setUserPaused(true));
    await advance(20000);
    expect(api.activeIndex).toBe(0);
    await act(async () => api.setUserPaused(false));
    await advance(4700);
    expect(api.activeIndex).toBe(1);
  });
  it("selecting the current indicator cancels an outstanding transition", async () => {
    await mount();
    await act(async () => {
      void api.goTo(1);
    });
    expect(api.phase).toBe("out");
    await act(async () => {
      void api.goTo(0);
    });
    await advance(400);
    expect(api.activeIndex).toBe(0);
    expect(api.phase).toBe("idle");
  });
  it("cleans timers and aborts pending image preparation on unmount/route change", async () => {
    await mount();
    const signal = vi.mocked(prepareCarouselImage).mock.calls[0]![1];
    await advance(4500);
    await act(async () => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
    expect(signal.aborted).toBe(true);
    root = createRoot(host);
  });
});
