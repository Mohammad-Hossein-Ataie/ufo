import Image from "next/image";

/** Preserve the source artwork's 3:1 aspect ratio at every display size. */
export function BrandLogo({ compact = true }: { compact?: boolean }) {
  return (
    <span className="inline-flex max-w-full shrink-0 items-center" aria-hidden="true">
      <Image
        src="/logos/ufo-puff-logo.webp"
        alt=""
        width={2172}
        height={724}
        fetchPriority="high"
        decoding="async"
        unoptimized
        className={`h-auto max-w-full object-contain ${compact ? "w-[120px] lg:w-36" : "w-36"}`}
      />
    </span>
  );
}
