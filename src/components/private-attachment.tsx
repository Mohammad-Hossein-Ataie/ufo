"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { SalesChannel } from "@ufo/types";
import { authHeaders } from "@/lib/customer-client";

/** Private files use authenticated fetch; session credentials never enter image URLs. */
export function PrivateAttachment({
  url,
  name,
  pdf = false,
  audience,
}: {
  url: string;
  name: string;
  pdf?: boolean;
  audience: SalesChannel | "admin";
}) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setSource("");
    setFailed(false);
    void fetch(url, {
      headers: audience === "admin" ? {} : authHeaders(audience),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, audience]);
  if (!source)
    return (
      <p role="status" className="text-xs leading-6">
        {failed ? "دریافت فایل انجام نشد؛ صفحه را تازه کنید." : "در حال دریافت فایل…"}
      </p>
    );
  return (
    <a
      href={source}
      download={pdf ? name : undefined}
      target={pdf ? undefined : "_blank"}
      rel="noreferrer"
      className="block min-w-0 rounded-xl border border-current/20 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
    >
      {pdf ? (
        <span className="break-all text-sm">دریافت PDF · {name}</span>
      ) : (
        <Image
          src={source}
          alt={name}
          width={480}
          height={320}
          unoptimized
          className="h-auto max-h-64 w-full object-contain"
        />
      )}
    </a>
  );
}
