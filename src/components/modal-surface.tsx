"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cloneElement, useRef, type ReactElement, type ReactNode } from "react";

/** Focus containment, background inertness, Escape and focus restoration for overlays. */
export function ModalSurface({
  open,
  onClose,
  title,
  children,
  overlayClassName = "backdrop-blur-[2px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactElement<{ children?: ReactNode }>;
  overlayClassName?: string;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={`fixed inset-0 z-[60] bg-black/75 ${overlayClassName}`}
        />
        <Dialog.Content
          asChild
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
          }}
        >
          {cloneElement(
            children,
            {},
            <Dialog.Title className="sr-only">{title}</Dialog.Title>,
            children.props.children,
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
