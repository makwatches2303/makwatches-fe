"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { cn } from "@/lib/utils";
import {
  Container,
  Heading,
  StickyScroller,
  Text,
  usePrefersReducedMotion,
} from "@/design-system";
import { IMAGE_SIZES, type MediaRef } from "@/lib/media";
import { ProductImage } from "@/components/commerce/ProductImage";

/**
 * The Craft section: a pinned circular visual that rotates as the page scrolls,
 * with numbered panels passing it on the dark ground.
 *
 * This is scroll-*driven*, not scroll-*jacking*: the page scrolls at its normal
 * rate and nothing is intercepted. The rotation is a transform on the
 * compositor, read inside requestAnimationFrame.
 *
 * Below the lg breakpoint the layout collapses to a plain vertical sequence
 * with the image inline — a pinned half-screen leaves too little room for
 * either half on a phone.
 *
 * Panel copy and specifications are props; see src/content/home.ts. Nothing in
 * this component invents a figure.
 */

export interface CraftPanel {
  /** Step number, e.g. "01". */
  number: string;
  title: string;
  body: string;
  /** Key/value figures shown beneath the copy. Optional. */
  specs?: readonly { key: string; value: string }[];
  /** Shown in the pinned frame while this panel is active. */
  image?: MediaRef | null;
}

export interface CraftScrollerProps {
  panels: readonly CraftPanel[];
  className?: string;
}

/**
 * Rotation driven by scroll *into this section*, matching the reference's
 * 0.08deg per pixel.
 *
 * Reading window.scrollY directly used to drive this: the angle at rest
 * depended on how far down the page the section happened to sit, so the
 * visual loaded pre-tilted by an arbitrary amount instead of starting
 * straight. Measuring from the section's own position instead means the dial
 * is always upright the moment it comes on screen, and only turns as the
 * reader scrolls through it.
 *
 * Returns 0 under reduced motion and attaches no listener at all in that case.
 */
function useScrollRotation(
  enabled: boolean,
  sectionRef: RefObject<HTMLElement | null>
): number {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      // How far the section's top has scrolled past the viewport's top.
      // Clamped at 0 so the dial sits straight for the whole approach, right
      // up until the section actually starts scrolling past.
      const scrolledIntoSection = Math.max(0, -section.getBoundingClientRect().top);
      setAngle(scrolledIntoSection * 0.08);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, sectionRef]);

  return angle;
}

function PanelBody({ panel }: { panel: CraftPanel }) {
  return (
    <>
      <div className="font-display text-6xl font-extrabold leading-none tracking-[-0.03em] text-mak-accent md:text-7xl">
        {panel.number}
      </div>

      <Heading level="title" as="h3" tone="inverse" className="mt-4">
        {panel.title}
      </Heading>

      <Text size="lead" className="mt-4 max-w-[400px] text-mak-on-ink/70">
        {panel.body}
      </Text>

      {panel.specs && panel.specs.length > 0 ? (
        <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-4">
          {panel.specs.map((spec) => (
            <div key={spec.key}>
              <dd className="font-display text-xl font-extrabold text-mak-on-ink">
                {spec.value}
              </dd>
              <dt className="text-mak-micro uppercase tracking-[0.12em] text-mak-on-ink/50">
                {spec.key}
              </dt>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
}

export function CraftScroller({ panels, className }: CraftScrollerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const rotation = useScrollRotation(!reducedMotion, sectionRef);

  if (panels.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="craft"
      className={cn("bg-mak-ink text-mak-on-ink", className)}
    >
      <Container>
        {/* Desktop: pinned, rotating visual driven by the active panel. */}
        <div className="hidden lg:block">
          <StickyScroller
            media={(activeIndex) => (
              <div className="relative flex h-full w-full items-center justify-center">
                {/* Concentric rings, echoing a dial. Decorative. */}
                <div
                  aria-hidden="true"
                  className="absolute size-[min(72vh,640px)] rounded-full border border-white/[0.08]"
                />
                <div
                  aria-hidden="true"
                  className="absolute size-[min(58vh,520px)] rounded-full border-2 border-white/[0.16]"
                />

                <div
                  className="relative z-10 size-[min(46vh,400px)] overflow-hidden rounded-full border-2 border-mak-on-ink shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                  style={
                    reducedMotion
                      ? undefined
                      : { transform: `rotate(${rotation}deg)` }
                  }
                >
                  <ProductImage
                    media={panels[activeIndex]?.image ?? panels[0]?.image ?? null}
                    alt=""
                    sizes={IMAGE_SIZES.half}
                    ratio="auto"
                    className="size-full"
                  />
                </div>

                {!reducedMotion ? (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-10 left-0 right-0 text-center text-mak-label font-normal uppercase tracking-[0.2em] text-mak-on-ink/50"
                  >
                    Scroll to rotate
                  </div>
                ) : null}
              </div>
            )}
            panels={panels.map((panel) => ({
              id: panel.number,
              content: <PanelBody panel={panel} />,
            }))}
          />
        </div>

        {/* Mobile and tablet: a plain sequence, image above each panel. */}
        <div className="flex flex-col gap-14 py-16 lg:hidden">
          {panels.map((panel) => (
            <div key={panel.number}>
              {panel.image ? (
                <div className="mb-7 aspect-square w-full max-w-[280px] overflow-hidden rounded-full border-2 border-mak-on-ink">
                  <ProductImage
                    media={panel.image}
                    alt=""
                    sizes="280px"
                    ratio="auto"
                    className="size-full"
                  />
                </div>
              ) : null}
              <PanelBody panel={panel} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
