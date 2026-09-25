"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  useDialogLabels,
  useEscapeKey,
  useFocusTrap,
  useMounted,
  usePrefersReducedMotion,
  useScrollLock,
} from "../hooks";
import { IconButton } from "./button";
import { CloseIcon } from "../icons";

/**
 * A centred modal dialog.
 *
 * Same accessibility contract as Drawer: focus trapped and restored, Escape to
 * dismiss, scroll locked, labelled by its title.
 *
 * Unlike Drawer this unmounts when closed. A modal's content is usually about
 * one specific item (a quick view, a confirmation), so keeping a stale copy
 * mounted would mean rendering the previous product behind the scenes.
 */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Accessible name. Pass `titleVisible={false}` when the design shows the name
   * some other way -- it still labels the dialog for screen readers.
   */
  title: string;
  titleVisible?: boolean;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
  /** Hide the default close button when the content supplies its own. */
  hideClose?: boolean;
}

const MODAL_SIZE = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  titleVisible = true,
  size = "md",
  children,
  className,
  hideClose = false,
}: ModalProps) {
  const mounted = useMounted();
  const reducedMotion = usePrefersReducedMotion();
  const { titleId } = useDialogLabels();
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useScrollLock(open);
  useEscapeKey(open, onClose);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="mak fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6"
      // The scrim is the click target for dismissal; the panel stops propagation.
      onClick={onClose}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-mak-ink/60" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden",
          "border-2 border-mak-line bg-mak-bg",
          MODAL_SIZE[size],
          !reducedMotion && "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95",
          className
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-start justify-between gap-4",
            titleVisible
              ? "border-b-2 border-mak-line px-6 py-5"
              : "pointer-events-none absolute right-0 top-0 z-10 p-4"
          )}
        >
          <h2
            id={titleId}
            className={cn(
              "font-display text-xl font-extrabold tracking-[-0.01em] text-mak-ink",
              !titleVisible && "sr-only"
            )}
          >
            {title}
          </h2>
          {!hideClose && (
            <IconButton
              label="Close"
              onClick={onClose}
              className={cn(!titleVisible && "pointer-events-auto bg-mak-bg")}
            >
              <CloseIcon />
            </IconButton>
          )}
        </div>

        {/*
          data-lenis-prevent: the wheel scrolls this body natively. Lenis
          otherwise claims it for the page, which is locked behind the modal.
        */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
