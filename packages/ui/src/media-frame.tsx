import type { CSSProperties, ComponentPropsWithoutRef } from "react";

/** Reserve space independently of the source dimensions. Cover is opt-in for artwork. */
export function MediaFrame({
  ratio = "1 / 1",
  fit = "contain",
  position = "center",
  className = "",
  style,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  ratio?: CSSProperties["aspectRatio"];
  fit?: "contain" | "cover";
  position?: CSSProperties["objectPosition"];
}) {
  return (
    <div
      {...props}
      className={`media-frame ${className}`}
      data-fit={fit}
      style={{ aspectRatio: ratio, "--media-position": position, ...style } as CSSProperties}
    />
  );
}
