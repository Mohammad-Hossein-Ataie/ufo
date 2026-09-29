"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Category } from "@ufo/types";

export interface HomepageHeroCategory
  extends Pick<Category, "id" | "nameFa" | "slug" | "descriptionFa"> {
  image: string;
}

export function normalizeCarouselIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function getCircularOffset(index: number, activeIndex: number, length: number) {
  if (length <= 1) return 0;
  let offset = normalizeCarouselIndex(index - activeIndex, length);
  if (offset > length / 2) offset -= length;
  return offset;
}

export function HomepageCategoryCarousel({
  items,
  initialIndex = 3,
}: {
  items: HomepageHeroCategory[];
  initialIndex?: number;
}) {
  const [activeIndex, setActiveIndex] = useState(() =>
    normalizeCarouselIndex(initialIndex, items.length),
  );
  const id = useId();
  const gesture = useRef<
    | { pointerId: number; x: number; y: number; horizontal: boolean; moved: boolean }
    | undefined
  >(undefined);
  const suppressClick = useRef(false);
  const wheelLocked = useRef(false);

  if (items.length === 0) return null;

  const active = items[activeIndex] ?? items[0]!;
  const select = (index: number) => setActiveIndex(normalizeCarouselIndex(index, items.length));
  const previous = () => select(activeIndex - 1);
  const next = () => select(activeIndex + 1);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") next();
    else if (event.key === "ArrowRight") previous();
    else if (event.key === "Home") select(0);
    else if (event.key === "End") select(items.length - 1);
    else return;
    event.preventDefault();
  }

  return (
    <div className="hero-category-carousel" data-active-index={activeIndex}>
      <div
        id={id}
        className="hero-category-stage"
        role="region"
        aria-roledescription="کاروسل"
        aria-label="دسته‌بندی‌های محصولات"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onWheel={(event) => {
          if (wheelLocked.current || Math.abs(event.deltaX) < Math.abs(event.deltaY) + 8) return;
          event.preventDefault();
          wheelLocked.current = true;
          if (event.deltaX > 0) previous();
          else next();
          window.setTimeout(() => {
            wheelLocked.current = false;
          }, 380);
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
          suppressClick.current = false;
          gesture.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            horizontal: false,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const start = gesture.current;
          if (!start || start.pointerId !== event.pointerId) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            start.horizontal = true;
            start.moved = true;
          }
        }}
        onPointerUp={(event) => {
          const start = gesture.current;
          if (!start || start.pointerId !== event.pointerId) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (start.horizontal && Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            suppressClick.current = true;
            if (dx > 0) next();
            else previous();
          }
          gesture.current = undefined;
        }}
        onPointerCancel={() => {
          gesture.current = undefined;
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
      >
        <div className="hero-category-orbit" aria-live="polite">
          {items.map((item, index) => {
            const offset = getCircularOffset(index, activeIndex, items.length);
            const distance = Math.abs(offset);
            const visible = distance <= 3;
            return (
              <div
                key={item.id}
                className="hero-category-slide"
                data-active={offset === 0 ? "true" : "false"}
                data-visible={visible ? "true" : "false"}
                style={
                  {
                    "--hero-offset": offset,
                    "--hero-distance": distance,
                  } as CSSProperties
                }
                aria-hidden={!visible}
              >
                <Link
                  href={`/products/category/${item.slug}`}
                  className="hero-category-card group"
                  aria-current={offset === 0 ? "true" : undefined}
                  tabIndex={visible ? 0 : -1}
                  aria-label={`مشاهده محصولات ${item.nameFa}`}
                >
                  {visible ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      priority={index === initialIndex}
                      loading={index === initialIndex ? "eager" : "lazy"}
                      draggable={false}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transition-none"
                      sizes="(min-width: 1024px) 250px, (min-width: 640px) 30vw, 46vw"
                    />
                  ) : null}
                  <span className="hero-category-card-shade" aria-hidden="true" />
                  <span className="hero-category-card-label">
                    <strong>{item.nameFa}</strong>
                    {offset === 0 ? <small>مشاهده دسته</small> : null}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hero-category-toolbar">
        <button
          type="button"
          onClick={previous}
          className="hero-category-control"
          aria-label="دسته قبلی"
          aria-controls={id}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 text-center" aria-live="polite" aria-atomic="true">
          <h2 className="text-xl font-black text-white sm:text-2xl">{active.nameFa}</h2>
          <p className="mx-auto mt-1 line-clamp-1 max-w-xl text-xs leading-6 text-retail-secondary sm:text-sm">
            {active.descriptionFa}
          </p>
        </div>
        <button
          type="button"
          onClick={next}
          className="hero-category-control"
          aria-label="دسته بعدی"
          aria-controls={id}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="hero-category-dots" role="group" aria-label="انتخاب دسته‌بندی">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => select(index)}
            aria-label={`نمایش دسته ${item.nameFa}`}
            aria-pressed={index === activeIndex}
            aria-controls={id}
            className="hero-category-dot"
          />
        ))}
      </div>
    </div>
  );
}
