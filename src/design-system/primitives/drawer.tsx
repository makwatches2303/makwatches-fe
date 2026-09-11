"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  useDialogLabels,
  useEscapeKey,
  useFocusTrap,
  useMounted,
  useScrollLock,
} from "../hooks";
import { IconButton } from "./button";
import { CloseIcon } from "../icons";

/**
 * A slide-in panel.
 *
 * Accessible by construction: rendered as a modal dialog, focus is trapped
 * inside while open and restored to the trigger on close, Escape dismisses, and
 * the page behind is inert to scroll.
 *
 * On mobile the drawer goes full-width, matching the approved responsive
 * strategy where the cart is a full-screen surface rather than a narrow panel.
 */

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. Also rendered as the visible heading. */
  title: ReactNode;
  /** Optional slot beside the title, e.g. an item count. */
  titleAside?: ReactNode;
  /** Pinned to the bottom, outside the scrolling body. */
  footer?: ReactNode;
  side?: "right" | "left";
  children: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  titleAside,
  footer,
  side = "right",
  children,
  className,
}: DrawerProps) {
  const mounted = useMounted();
  const { titleId } = useDialogLabels();
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useScrollLock(open);
  useEscapeKey(open, onClose);

  // Portals need a DOM; skip entirely during SSR.
  if (!mounted) return null;

  return createPortal(
    <div className={cn("mak", !open && "pointer-events-none")}>
      {/* Scrim. aria-hidden because the dialog below carries the semantics. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-90 bg-mak-ink/50 transition-opacity duration-300 ease-mak",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // Hidden from the accessibility tree when closed so its contents are
        // not reachable by screen reader or Tab while parked off-screen.
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        className={cn(
          // h-[100dvh] rather than inset-y-0.
          //
          // inset-y-0 sizes to the *layout* viewport, which on mobile stays
          // tall while the browser's URL bar is on screen -- so the bottom of
          // the panel, and with it the pinned footer and its primary action,
          // sits behind the browser chrome and cannot be reached. The dynamic
          // viewport unit tracks what is actually visible. On desktop dvh and
          // vh are identical, so nothing changes there.
          "fixed top-0 z-100 h-[100dvh] flex w-full max-w-[430px] flex-col bg-mak-bg",
          "transition-transform duration-[450ms] ease-mak",
          side === "right"
            ? "right-0 border-l-2 border-mak-line"
            : "left-0 border-r-2 border-mak-line",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full",
          className
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-mak-line px-6 py-5">
          <h2
            id={titleId}
            className="font-display text-xl font-extrabold tracking-[-0.01em] text-mak-ink"
          >
            {title}
            {titleAside ? (
              <span className="text-mak-muted"> · {titleAside}</span>
            ) : null}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer ? (
          // The safe-area inset keeps the primary action clear of the iOS home
          // indicator, which otherwise overlaps the bottom of the panel.
          <div
            className={cn(
              "shrink-0 border-t-2 border-mak-line px-6 py-5",
              "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
