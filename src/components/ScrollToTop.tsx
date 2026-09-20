"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { getLenis } from "@/hooks/useLenis";

/**
 * Start every new page at the top.
 *
 * # Why this is needed at all
 *
 * The App Router already scrolls to the top on navigation. Two things in this
 * application undo it:
 *
 *   - Lenis. It does not read the scroll position back from the document each
 *     frame; it keeps its own and writes it out. The router's reset lands, and
 *     on the very next frame Lenis restores the position it still believes the
 *     page is at. Scrolling the window alone is not enough -- Lenis has to be
 *     told, or it will simply put the page back.
 *   - PageTransition's `AnimatePresence mode="wait"`. The old page stays
 *     mounted for the length of its exit animation, so at the moment the route
 *     commits the document is still as tall as the page being left.
 *
 * Together they are why leaving a page from its footer arrives at the footer of
 * the next one.
 *
 * # What it deliberately does not do
 *
 * Two navigations are left alone:
 *
 *   - Anything with a hash. `/#collection` and the in-page anchors are asking
 *     for a specific element, and hijacking them to the top would break every
 *     one of them.
 *   - The first render. A reload, or a link opened from elsewhere, may be
 *     restoring a position the browser remembered, and that is the browser's
 *     call to make rather than this component's.
 *   - Back and forward. Returning to a listing should return to the place in it
 *     you were reading, which is what every browser does on its own. Without
 *     the popstate flag below this component and the browser's restoration race
 *     each other, and which one wins depends on how quickly the page settles.
 *
 * Keyed on the pathname only, not on search params. Filters and sorting on
 * /shop are search-param navigations within one page; jumping to the top on
 * each one would throw a shopper back to the header every time they narrowed
 * the results.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  // Set by popstate, which the browser dispatches before React re-renders with
  // the new pathname -- so it is already true by the time the effect below runs.
  const cameFromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      cameFromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (cameFromHistory.current) {
      cameFromHistory.current = false;
      return;
    }

    if (window.location.hash) return;

    // Lenis first: `immediate` skips the easing, so the new page is at the top
    // before it is painted rather than gliding there afterwards. `force` makes
    // it apply even while Lenis is stopped, which it is whenever a modal or the
    // cart drawer has locked the page.
    getLenis()?.scrollTo(0, { immediate: true, force: true });

    // And the window, for the case where Lenis is not running at all -- it is
    // torn down on unmount, and never starts for a visitor whose browser asked
    // for reduced motion.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
