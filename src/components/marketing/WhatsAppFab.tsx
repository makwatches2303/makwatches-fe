"use client";

import { useState, type CSSProperties } from "react";
import { FaWhatsapp } from "react-icons/fa6";

import { cn } from "@/lib/utils";
import { whatsAppGreeting, whatsAppNumber, whatsAppUrl } from "@/lib/whatsapp";

/**
 * The floating "message us on WhatsApp" button, on every page, fixed in the
 * bottom-right corner.
 *
 * An anchor rather than a button with an onClick: opening WhatsApp is a
 * navigation, so Enter, middle-click and "open in new tab" all keep working,
 * and it resolves before hydration for anyone who arrives with JavaScript still
 * loading.
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
 * ## Position
 *
 * Always the same corner, and not movable: it used to be draggable, with the
 * position remembered per browser, and is deliberately pinned now. Pages whose
 * own furniture occupies that corner move it through `className` -- see
 * WhatsAppGuard for the product page's purchase bar.
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

export function WhatsAppFab({ number, message, className }: WhatsAppFabProps) {
  const href = whatsAppUrl({
    number: number ?? whatsAppNumber(),
    message: message ?? whatsAppGreeting(),
  });

  /*
    The entrance animation runs once and is then taken off the element for
    good. It animates transform with `both` fill, so left in place it would hold
    its final frame's transform forever and override the hover lift and the
    press scale below.
  */
  const [playEntrance, setPlayEntrance] = useState(true);

  return (
    <a
      href={href}
      target="_blank"
      // noopener is the one that matters: without it the opened tab gets a
      // handle on this one through window.opener. noreferrer follows it.
      rel="noopener noreferrer"
      // The label says what happens, not what the icon is. A screen reader
      // announcing "WhatsApp" alone leaves "and then what?" unanswered.
      aria-label="Chat with MAK Watches on WhatsApp"
      // A native link drag would let the button be picked up and dropped.
      draggable={false}
      onAnimationEnd={() => setPlayEntrance(false)}
      className={cn(
        "mak fixed bottom-5 right-5 z-60 inline-flex items-center justify-center",
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
        "select-none",
        "transition-[transform,background-color,box-shadow] duration-200 ease-mak",
        // Hover is a fine-pointer affordance; the active state below is what a
        // touch device actually gets.
        "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--wa-green-dark)]",
        "[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_10px_26px_rgba(20,18,17,0.28)]",
        "[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5",
        "active:bg-[var(--wa-green-dark)] active:translate-y-0 active:scale-95",
        // The focus ring keeps the system's accent rather than a green-on-green
        // outline, and the offset puts a band of page between the two so the
        // red and the green are never edge to edge.
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent",
        // The entrance is decoration; a shopper who asked for less motion gets
        // the button without it.
        playEntrance &&
          "motion-safe:animate-[mak-rise_0.8s_cubic-bezier(0.16,1,0.3,1)_0.6s_both]",
        className
      )}
      style={
        {
          "--wa-green": WHATSAPP_GREEN,
          "--wa-green-dark": WHATSAPP_GREEN_DARK,
        } as CSSProperties
      }
    >
      <FaWhatsapp aria-hidden="true" className="size-7 sm:size-8" />
    </a>
  );
}
