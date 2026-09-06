"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  prepareCarouselImage,
  type CarouselImage,
  type PreparedCarouselImage,
} from "@/lib/product-carousel-image";

export const productCarouselInterval = 4500;
export const productCarouselHalfTransition = 200;
type PauseReason = "hover" | "focus" | "touch";

export function useProductCardCarousel(images: CarouselImage[], slotIndex: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const [slide, setSlide] = useState<{ index: number; image?: PreparedCarouselImage }>({
    index: 0,
  });
  const activeRef = useRef(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [direction, setDirection] = useState(1);
  const [rtl, setRtl] = useState(true);
  const [nearViewport, setNearViewport] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const reducedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const pauseReasons = useRef(new Set<PauseReason>());
  const [clock, setClock] = useState(0);
  const firstSchedule = useRef(true);
  const runningRef = useRef(false);
  const operation = useRef(0);
  const origin = useRef<"auto" | "manual">("auto");
  const manualPending = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);
  const prepared = useRef(new Map<string, Promise<PreparedCarouselImage | undefined>>());
  const count = images.length;
  const running = count > 1 && nearViewport && visible && !paused && !userPaused && !reducedMotion;
  runningRef.current = running;

  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      reducedRef.current = media.matches;
      setReducedMotion(media.matches);
    };
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    onMotion();
    onVisibility();
    const element = containerRef.current;
    if (element) {
      setRtl(getComputedStyle(element).direction === "rtl");
      // Hover/focus can predate hydration without a React enter event.
      if (window.matchMedia("(hover: hover)").matches && element.matches(":hover")) {
        pauseReasons.current.add("hover");
      }
      if (element.contains(document.activeElement)) pauseReasons.current.add("focus");
      setPaused(pauseReasons.current.size > 0);
    }
    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(Boolean(entry?.isIntersecting)),
      { rootMargin: "100px" },
    );
    if (element) observer.observe(element);
    media.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      operation.current++;
      abort.abort();
      prepared.current.clear();
      clearTimeout(transitionTimer.current);
      observer.disconnect();
      media.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const prepare = useCallback((index: number) => {
    const image = imagesRef.current[index];
    const signal = controller.current?.signal;
    if (!image || !signal || signal.aborted) return Promise.resolve(undefined);
    const key = `${image.src}\0${image.fallbackSrc}`;
    let promise = prepared.current.get(key);
    if (!promise) {
      promise = prepareCarouselImage(image, signal).then((result) => {
        if (!result && prepared.current.get(key) === promise) prepared.current.delete(key);
        return result;
      });
      prepared.current.set(key, promise);
    }
    return promise;
  }, []);

  // Only one upcoming image is warmed; offscreen cards do no speculative loading.
  useEffect(() => {
    if (nearViewport && visible && count > 1) void prepare((slide.index + 1) % count);
  }, [count, nearViewport, visible, slide.index, prepare]);

  const resetAutoplay = useCallback(() => {
    firstSchedule.current = false;
    setClock((value) => value + 1);
  }, []);

  const goTo = useCallback(
    async (requested: number, source: "auto" | "manual" = "manual", step = 1) => {
      const length = imagesRef.current.length;
      if (length < 2) return;
      if (source === "manual") resetAutoplay();
      const index = ((requested % length) + length) % length;
      const ticket = ++operation.current;
      origin.current = source;
      manualPending.current = source === "manual";
      clearTimeout(transitionTimer.current);
      setPhase("idle");
      if (index === activeRef.current) {
        manualPending.current = false;
        return;
      }
      const image = await prepare(index);
      if (ticket === operation.current && !image) manualPending.current = false;
      if (
        !image ||
        ticket !== operation.current ||
        controller.current?.signal.aborted ||
        (source === "auto" && !runningRef.current)
      )
        return;
      setDirection(step);
      const commit = () => {
        if (ticket !== operation.current) return;
        activeRef.current = index;
        manualPending.current = false;
        if (source === "manual") resetAutoplay();
        // Content and its decoded image source commit in one React state update.
        setSlide({ index, image });
        setPhase(reducedRef.current ? "idle" : "in");
        if (!reducedRef.current)
          transitionTimer.current = setTimeout(
            () => setPhase("idle"),
            productCarouselHalfTransition,
          );
      };
      if (reducedRef.current) commit();
      else {
        setPhase("out");
        transitionTimer.current = setTimeout(commit, productCarouselHalfTransition);
      }
    },
    [prepare, resetAutoplay],
  );

  useEffect(() => {
    if (!running) {
      if (origin.current === "auto") {
        operation.current++;
        clearTimeout(transitionTimer.current);
        setPhase("idle");
      }
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!manualPending.current) void goTo(activeRef.current + 1, "auto");
      timer = setTimeout(tick, productCarouselInterval);
    };
    const stagger = firstSchedule.current ? slotIndex * 400 : 0;
    firstSchedule.current = false;
    timer = setTimeout(tick, productCarouselInterval + stagger);
    return () => clearTimeout(timer);
  }, [running, slotIndex, clock, goTo]);

  const pause = useCallback((reason: PauseReason) => {
    pauseReasons.current.add(reason);
    setPaused(true);
  }, []);
  const resume = useCallback(
    (reason: PauseReason) => {
      pauseReasons.current.delete(reason);
      setPaused(pauseReasons.current.size > 0);
      resetAutoplay();
    },
    [resetAutoplay],
  );
  const next = useCallback(() => void goTo(activeRef.current + 1), [goTo]);
  const previous = useCallback(() => void goTo(activeRef.current - 1, "manual", -1), [goTo]);

  return {
    containerRef,
    activeIndex: slide.index,
    image: slide.image,
    phase,
    direction,
    rtl,
    reducedMotion,
    userPaused,
    setUserPaused,
    goTo,
    next,
    previous,
    pause,
    resume,
    resetAutoplay,
  };
}
