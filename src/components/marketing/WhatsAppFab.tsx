"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { FaWhatsapp } from "react-icons/fa6";

import { cn } from "@/lib/utils";
import { whatsAppGreeting, whatsAppNumber, whatsAppUrl } from "@/lib/whatsapp";

/**
 * The floating "message us on WhatsApp" button, on every page, draggable.
 *
 * Still an anchor rather than a button with an onClick: opening WhatsApp is a
 * navigation, so Enter, middle-click and "open in new tab" all keep working,
 * and it resolves before hydration for anyone who arrives with JavaScript still
 * loading. The drag is added on top of that rather than replacing it.
 *
 * ## Why this one breaks the house style
 *
 * The rest of the system is square, ink-bordered and flat. This is a green
 * circle with a drop shadow, because it is not MAK's button -- it is WhatsApp's,
 * and the shape and colour are the whole of its legibility. A shopper
 * recognises it at a glance from the corner of the screen precisely because it
 * looks the same here as on every other site.
 *
 * The glyph is Font Awesome's WhatsApp mark by way of react-icons, already a
 * dependency (see components/commerce/PromoCodeBox), rather than a hand-drawn
 * path: a brand mark redrawn by hand is a brand mark drawn slightly wrong.
 *
 * ## Dragging
 *
 * The shopper can move it anywhere, and where they leave it is remembered for
 * that browser. That is what makes a button that floats over every page on the
 * site tolerable: wherever it happens to cover something -- a toast, the mobile
 * purchase bar, a form field -- they can push it aside once instead of living
 * with it.
 *
 * Three things make a draggable link behave:
 *
 *   - A movement threshold. Under it the gesture is a tap and the link opens;
 *     over it the gesture is a drag and the click that follows is suppressed.
 *     Without this, every drag would also navigate.
 *   - `touch-none`, so a drag on a phone moves the button instead of scrolling
 *     the page. The cost is that a scroll gesture starting on the button does
 *     not scroll, which is the trade any draggable control makes.
 *   - Clamping, on drop and on resize. A position saved on a desktop window
 *     would otherwise put the button off-screen on a phone, with no way back.
 *
 * Alt+arrow moves it from the keyboard, because a control that can only be
 * repositioned by dragging can only be repositioned by people who can drag.
 *
 * ## Layering
 *
 * z-60 puts it above page content and below every overlay: the cart drawer
 * (z-90/z-100), modals (z-110/z-120) and toasts (z-120) all cover it rather
 * than competing with it. A shopper reading a confirmation should not have a
 * floating button punched through it.
 *
 * ## What it does not do
 *
 * It sends nothing. The link opens WhatsApp with the message typed and the
 * shopper presses send. Automated replies to that message are configured in
 * WhatsApp Business against the same number, outside this codebase; see
 * src/lib/whatsapp.ts for the shared wording that the two sides agree on.
 */

/**
 * WhatsApp's brand green, and the darker shade its own UI uses for a pressed
 * state.
 *
 * Deliberately literals rather than design tokens: these belong to WhatsApp,
 * not to MAK, and putting another company's brand colour into this palette
 * would invite it to be reused as if it were ours.
 */
const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_GREEN_DARK = "#1DA851";

/** Where the shopper last left it. Per browser; never leaves the device. */
const POSITION_KEY = "mak_whatsapp_fab_position";

/**
 * How far a pointer must travel before the gesture counts as a drag.
 *
 * Small enough that deliberate dragging feels immediate, large enough that the
 * few pixels a thumb moves during a tap do not swallow the tap.
 */
const DRAG_THRESHOLD_PX = 6;

/** Keeps the button clear of the viewport edges when clamped. */
const EDGE_MARGIN_PX = 8;

/** How far one Alt+arrow press moves it. */
const KEYBOARD_STEP_PX = 16;

interface Point {
  x: number;
  y: number;
}

export interface WhatsAppFabProps {
  /**
   * Overrides the configured number. For previews and stories; production
   * reads NEXT_PUBLIC_WHATSAPP_NUMBER with a shipped fallback.
   */
  number?: string;
  /** Overrides the pre-filled message. See whatsAppGreeting. */
  message?: string;
  className?: string;
}

/** Hold a position inside the viewport, given the button's measured size. */
function clampToViewport(point: Point, size: { w: number; h: number }): Point {
  const maxX = Math.max(EDGE_MARGIN_PX, window.innerWidth - size.w - EDGE_MARGIN_PX);
  const maxY = Math.max(EDGE_MARGIN_PX, window.innerHeight - size.h - EDGE_MARGIN_PX);

  return {
    x: Math.min(Math.max(point.x, EDGE_MARGIN_PX), maxX),
    y: Math.min(Math.max(point.y, EDGE_MARGIN_PX), maxY),
  };
}

function readStoredPosition(): Point | null {
  try {
    const raw = window.localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Point).x === "number" &&
      typeof (parsed as Point).y === "number" &&
      Number.isFinite((parsed as Point).x) &&
      Number.isFinite((parsed as Point).y)
    ) {
      return parsed as Point;
    }
  } catch {
    // Private browsing, blocked storage, or a value from an older shape. The
    // button simply starts in its default corner.
  }
  return null;
}

function writeStoredPosition(point: Point): void {
  try {
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(point));
  } catch {
    // Not being able to remember the position is not a reason to refuse to
    // move it.
  }
}

export function WhatsAppFab({ number, message, className }: WhatsAppFabProps) {
  const href = whatsAppUrl({
    number: number ?? whatsAppNumber(),
    message: message ?? whatsAppGreeting(),
  });

  const anchor = useRef<HTMLAnchorElement | null>(null);

  /*
    null means "wherever the corner classes put it". The server renders that,
    and so does the first client render, so there is no hydration mismatch and
    no flash of a button in the wrong place for anyone who never moved it.
  */
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);

  /*
    The entrance animation runs once and is then taken off the element for
    good.

    It is a transform, and the drag styles live in the same class list. Leaving
    it applied meant that dropping the button re-added the class and replayed
    the whole rise from wherever it had been dropped -- measured as a 26px jump
    after every drag. Dropping the class on animationend is what makes the
    entrance an entrance rather than a reaction to any later state change.
  */
  const [playEntrance, setPlayEntrance] = useState(true);

  // Where the pointer grabbed the button, relative to its own top-left, so the
  // button does not jump under the cursor on the first move.
  const grabOffset = useRef<Point>({ x: 0, y: 0 });
  const pointerStart = useRef<Point>({ x: 0, y: 0 });
  // Set when a gesture turned into a drag, and read by the click handler that
  // fires immediately afterwards.
  const suppressClick = useRef(false);

  const measure = useCallback(() => {
    const rect = anchor.current?.getBoundingClientRect();
    return { w: rect?.width ?? 56, h: rect?.height ?? 56 };
  }, []);

  // Restore the remembered position, and keep it on-screen when the window
  // changes size or the phone is rotated.
  useEffect(() => {
    const stored = readStoredPosition();
    if (stored) setPosition(clampToViewport(stored, measure()));

    const onResize = () =>
      setPosition((current) => (current ? clampToViewport(current, measure()) : null));

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    // Left button or touch only; a right-click is the context menu.
    if (event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    grabOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointerStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;

    // Capture, so a fast drag that outruns the pointer keeps sending moves to
    // this element rather than to whatever is underneath it.
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

      const travelled = Math.hypot(
        event.clientX - pointerStart.current.x,
        event.clientY - pointerStart.current.y
      );
      if (!dragging && travelled < DRAG_THRESHOLD_PX) return;

      if (!dragging) setDragging(true);
      // Past the threshold the gesture belongs to the button, not the page.
      event.preventDefault();

      setPosition(
        clampToViewport(
          {
            x: event.clientX - grabOffset.current.x,
            y: event.clientY - grabOffset.current.y,
          },
          measure()
        )
      );
    },
    [dragging, measure]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (!dragging) return;

      setDragging(false);
      // The click event is still to come; this is what stops a drag from also
      // opening WhatsApp.
      suppressClick.current = true;
      setPosition((current) => {
        if (current) writeStoredPosition(current);
        return current;
      });
    },
    [dragging]
  );

  const onClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>) => {
      // Alt is the modifier, so the arrow keys keep scrolling the page when the
      // button happens to hold focus.
      if (!event.altKey) return;

      const step: Record<string, Point> = {
        ArrowUp: { x: 0, y: -KEYBOARD_STEP_PX },
        ArrowDown: { x: 0, y: KEYBOARD_STEP_PX },
        ArrowLeft: { x: -KEYBOARD_STEP_PX, y: 0 },
        ArrowRight: { x: KEYBOARD_STEP_PX, y: 0 },
      };
      const delta = step[event.key];
      if (!delta) return;

      event.preventDefault();
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;

      const moved = clampToViewport(
        { x: rect.left + delta.x, y: rect.top + delta.y },
        { w: rect.width, h: rect.height }
      );
      setPosition(moved);
      writeStoredPosition(moved);
    },
    []
  );

  return (
    <a
      ref={anchor}
      href={href}
      target="_blank"
      // noopener is the one that matters: without it the opened tab gets a
      // handle on this one through window.opener. noreferrer follows it.
      rel="noopener noreferrer"
      // The label says what happens, not what the icon is. A screen reader
      // announcing "WhatsApp" alone leaves "and then what?" unanswered.
      aria-label="Chat with MAK Watches on WhatsApp"
      // Announces the repositioning shortcut to anyone who cannot discover it
      // by dragging.
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
      // A native image drag would fight the pointer handlers.
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onAnimationEnd={() => setPlayEntrance(false)}
      className={cn(
        "mak fixed z-60 inline-flex items-center justify-center",
        // The default corner. Overridden by the inline style below once the
        // shopper has moved it.
        "bottom-5 right-5",
        // 56px, comfortably past the 44px minimum touch target, and 60px from
        // sm up where there is room for it.
        "size-14 rounded-full text-white no-underline sm:size-15",
        // The brand colours come from the CSS variables set below, so the two
        // literals stay declared together in one place rather than being
        // spelled into class strings.
        "bg-[var(--wa-green)]",
        // The elevation is what makes a circle read as floating above the page
        // rather than as a sticker printed on it.
        "shadow-[0_6px_20px_rgba(20,18,17,0.22)]",
        // A drag must move the button, not scroll the page.
        "touch-none select-none",
        // Hover is a fine-pointer affordance; the active state below is what a
        // touch device actually gets.
        "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--wa-green-dark)]",
        "[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_10px_26px_rgba(20,18,17,0.28)]",
        "active:bg-[var(--wa-green-dark)]",
        // The focus ring keeps the system's accent rather than a green-on-green
        // outline, and the offset puts a band of page between the two so the
        // red and the green are never edge to edge.
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent",
        dragging
          ? // Nothing animates while dragging: a transition on transform makes
            // the button lag behind the finger holding it.
            "scale-105 cursor-grabbing shadow-[0_14px_32px_rgba(20,18,17,0.32)]"
          : cn(
              "transition-[transform,background-color,box-shadow] duration-200 ease-mak",
              "[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5",
              "active:translate-y-0 active:scale-95",
              // The entrance is decoration; a shopper who asked for less motion
              // gets the button without it.
              playEntrance &&
                "motion-safe:animate-[mak-rise_0.8s_cubic-bezier(0.16,1,0.3,1)_0.6s_both]"
            ),
        className
      )}
      style={
        {
          "--wa-green": WHATSAPP_GREEN,
          "--wa-green-dark": WHATSAPP_GREEN_DARK,
          // `auto` unsets the corner classes above so left/top take over; set
          // together so the button can never be pinned by two edges at once.
          ...(position
            ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
            : null),
        } as CSSProperties
      }
    >
      <FaWhatsapp aria-hidden="true" className="size-7 sm:size-8" />
    </a>
  );
}
