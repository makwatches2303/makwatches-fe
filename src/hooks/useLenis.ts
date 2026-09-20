"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";

// Global Lenis instance
let lenisInstance: Lenis | null = null;

/**
 * The live Lenis instance, or null when smooth scrolling is not running.
 *
 * A plain getter rather than the hook below, for callers that need the
 * instance inside an effect at the moment it fires. `useLenis` publishes it
 * through state, which means it is still null on the render where a route
 * change happens -- exactly when a scroll reset needs it.
 */
export const getLenis = (): Lenis | null => lenisInstance;

export const useLenis = () => {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    setLenis(lenisInstance);
  }, []);

  return lenis;
};

// Hook to scroll to specific elements or positions
export const useScrollTo = () => {
  const lenis = useLenis();

  const scrollTo = (target: string | number | HTMLElement, options?: { 
    offset?: number; 
    duration?: number; 
    easing?: (t: number) => number;
  }) => {
    if (!lenis) return;

    if (typeof target === "string") {
      const element = document.querySelector(target) as HTMLElement;
      if (element) {
        lenis.scrollTo(element, options);
      }
    } else {
      lenis.scrollTo(target, options);
    }
  };

  const scrollToTop = (options?: { duration?: number }) => {
    if (!lenis) return;
    lenis.scrollTo(0, options);
  };

  return { scrollTo, scrollToTop };
};

// Initialize Lenis globally
export const initLenis = () => {
  if (typeof window === "undefined" || lenisInstance) return lenisInstance;

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  function raf(time: number) {
    lenisInstance?.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return lenisInstance;
};

// Destroy Lenis instance
export const destroyLenis = () => {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
};