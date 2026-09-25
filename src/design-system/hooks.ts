"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { getLenis } from "@/hooks/useLenis";

/**
 * Shared behaviour for the interactive primitives.
 *
 * These are deliberately small and dependency-free: the project already carries
 * framer-motion for animation, and adding a headless-UI library for four
 * behaviours would be a new dependency for very little.
 */

/**
 * Whether the user has asked for reduced motion.
 *
 * Returns false during SSR and on the first client render, then updates. Motion
 * components use this to skip animation work entirely rather than run it at
 * zero duration.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * How many overlays hold the scroll lock right now.
 *
 * Overlays stack -- quick view over the cart drawer -- while Lenis is one
 * instance for the whole page, so it may restart only when the last lock is
 * released, not when the first of two overlays closes.
 */
let scrollLocks = 0;

/**
 * Lock body scroll while an overlay is open.
 *
 * The scrollbar width is compensated with padding so the page behind does not
 * shift horizontally when the bar disappears.
 *
 * Lenis is stopped too. `overflow: hidden` only stops the browser scrolling
 * the page; Lenis takes every wheel event and scrolls the page itself, so on
 * its own the lock left the wheel moving the page behind an open drawer. An
 * overlay's own scrolling area carries `data-lenis-prevent`, which Lenis
 * honours even while stopped, so it keeps scrolling natively.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    scrollLocks += 1;
    getLenis()?.stop();

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;

      scrollLocks -= 1;
      if (scrollLocks === 0) getLenis()?.start();
    };
  }, [locked]);
}

/** Call `onEscape` when Escape is pressed, while `active`. */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onEscape]);
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Trap focus inside a container while it is open, and restore focus to the
 * previously focused element on close.
 *
 * This is what makes a dialog usable by keyboard: without it, Tab walks out of
 * the overlay into the page behind, which is still visually obscured.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean
): React.RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    // Move focus into the overlay so the next Tab stays inside it.
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables[0] ?? container).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const items = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);

      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active_ = document.activeElement;

      if (event.shiftKey && active_ === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active_ === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      // Returning focus to the trigger is what lets a keyboard user carry on
      // from where they were rather than at the top of the document.
      restoreRef.current?.focus?.();
    };
  }, [active]);

  return containerRef;
}

/** True once mounted on the client. Guards portals and media queries. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** A stable id pair for labelling a dialog by its title and description. */
export function useDialogLabels() {
  const id = useId();
  return {
    titleId: `${id}-title`,
    descriptionId: `${id}-description`,
  };
}

/** Debounce a rapidly-changing value, for search-as-you-type. */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Whether the viewport matches a media query.
 *
 * Used to branch behaviour that genuinely differs between mobile and desktop --
 * a bottom sheet versus a sidebar, for instance. Prefer CSS where the
 * difference is only presentational.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * Reveal an element once it scrolls into view.
 *
 * Returns a ref to attach and whether it has been seen. Observation stops after
 * the first intersection: reveals are one-shot, and re-animating on scroll-back
 * is exactly the kind of motion the reference warns against.
 */
export function useInViewOnce<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  enabled = true
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  // Options are captured in a ref so an inline object literal from the caller
  // does not retrigger the effect on every render.
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!enabled) {
      setSeen(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      }
    }, optionsRef.current);

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return [ref, seen];
}

/** A boolean with stable open/close/toggle callbacks. */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, open, close, toggle };
}
