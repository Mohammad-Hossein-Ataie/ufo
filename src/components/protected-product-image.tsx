"use client";

import Image, { type ImageProps } from "next/image";

type ProtectedProductImageProps = Omit<ImageProps, "draggable" | "onContextMenu" | "onDragStart">;

export function ProtectedProductImage({ className, ...props }: ProtectedProductImageProps) {
  return (
    <Image
      {...props}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      className={`${className ?? ""} select-none [-webkit-user-drag:none] [-webkit-touch-callout:none]`}
    />
  );
}
