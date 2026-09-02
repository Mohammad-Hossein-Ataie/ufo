"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

interface CatalogAutoSubmitFormProps {
  action: string;
  children: ReactNode;
  className?: string;
}

const debouncedNames = new Set(["q", "minPrice", "maxPrice"]);

export function CatalogAutoSubmitForm({
  action,
  children,
  className,
}: CatalogAutoSubmitFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function buildTargetUrl(form: HTMLFormElement) {
    const query = new URLSearchParams();
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      const stringValue = String(value).trim();
      if (!stringValue) continue;
      query.set(key, stringValue);
    }

    const suffix = query.toString();
    return `${action}${suffix ? `?${suffix}` : ""}`;
  }

  function submit(delay = 0) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        formRef.current?.requestSubmit();
      }, delay);
      return;
    }

    formRef.current?.requestSubmit();
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    submit(
      target instanceof HTMLInputElement && target.type === "range"
        ? 850
        : debouncedNames.has(target.name)
          ? 850
          : 0,
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUrl = buildTargetUrl(event.currentTarget);
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) window.location.assign(nextUrl);
  }

  return (
    <form
      ref={formRef}
      action={action}
      className={className}
      onChange={handleChange}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
}
