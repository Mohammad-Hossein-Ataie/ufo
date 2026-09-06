export interface CarouselImage {
  src: string;
  fallbackSrc: string;
}

export interface PreparedCarouselImage {
  src: string;
  resolvedSrc: string;
}

function decodeImage(src: string, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted || !src) return resolve(false);
    const image = new Image();
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
      if (!ready) image.removeAttribute("src");
      resolve(ready);
    };
    const abort = () => finish(false);
    const timeout = setTimeout(() => finish(false), 8000);
    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      void image.decode().then(
        () => finish(true),
        () => finish(false),
      );
    };
    image.onerror = () => finish(false);
    image.src = src;
  });
}

// Callers supply the same protected derivative URL and fallback used by the card.
export async function prepareCarouselImage(
  image: CarouselImage,
  signal: AbortSignal,
): Promise<PreparedCarouselImage | undefined> {
  if (await decodeImage(image.src, signal)) return { src: image.src, resolvedSrc: image.src };
  if (!signal.aborted && (await decodeImage(image.fallbackSrc, signal))) {
    return { src: image.src, resolvedSrc: image.fallbackSrc };
  }
  return undefined;
}
