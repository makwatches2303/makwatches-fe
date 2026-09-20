import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  ButtonLink,
  Container,
  Eyebrow,
  Heading,
  Text,
} from "@/design-system";
import { IMAGE_SIZES, type MediaRef } from "@/lib/media";
import { ProductImage } from "@/components/commerce/ProductImage";

/**
 * The homepage hero.
 *
 * Matches the reference composition exactly: an asymmetric 1.05fr/0.95fr split
 * with the editorial headline flush left, and on the right an offset accent
 * block sitting behind a 2px-bordered 4:5 image frame, with a bordered product
 * plaque overlapping its lower-left corner -- stacked beneath the frame on a
 * phone, where an overlap would bury the photograph. A scroll cue sits centred
 * beneath.
 *
 * Copy is entirely prop-driven -- see src/content/home.ts. Nothing here has a
 * default, so an unconfigured hero renders structure without inventing claims.
 *
 * A server component; the entrance animation is CSS-only.
 */

export interface HeroPlaque {
  /** Small uppercase accent label above the name. */
  eyebrow?: string;
  name: string;
  /** Pre-formatted price string, so the hero does no currency logic. */
  price?: string;
}

export interface HeroProps {
  eyebrow?: string;
  /**
   * The headline, one entry per rendered line.
   *
   * The reference sets this in the display face at clamp(44px, 7.4vw, 108px)
   * with a hard break between lines, which is what gives the opening its
   * weight. Passing a single long string would wrap unpredictably instead.
   */
  headlineLines: string[];
  /** Render the headline uppercase, as the reference does. */
  uppercase?: boolean;
  supporting?: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image?: MediaRef | null;
  imageAlt?: string;
  plaque?: HeroPlaque;
  /**
   * Where the pictured piece lives, when the hero is showing a real product.
   *
   * With it, the photograph and its plaque become one link to that product's
   * page -- the same page every other tile in the catalogue leads to, so the
   * piece the homepage opens on can be bought like any other.
   *
   * Without it the hero is editorial: a slide with no product behind it is not
   * made to look clickable, for the same reason the plaque is withheld when
   * there is nothing real to caption.
   */
  href?: string;
  /**
   * The service strip beneath the CTAs. Supply real policy only; an empty
   * array omits the row.
   */
  trustItems?: readonly string[];
  /** Show the animated scroll cue beneath the hero. */
  scrollCue?: boolean;
  className?: string;
}

export function Hero({
  eyebrow,
  headlineLines,
  uppercase = true,
  supporting,
  primaryCta,
  secondaryCta,
  image,
  imageAlt = "",
  plaque,
  href,
  trustItems = [],
  scrollCue = true,
  className,
}: HeroProps) {
  const lines = headlineLines.filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;

  return (
    <section className={cn("bg-mak-bg", className)}>
      <Container>
        <div className="grid items-center gap-12 pb-3 pt-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            {eyebrow ? (
              <Eyebrow
                withRule
                className="mb-6 motion-safe:animate-[mak-rise_0.9s_cubic-bezier(0.16,1,0.3,1)_both]"
              >
                {eyebrow}
              </Eyebrow>
            ) : null}

            <Heading
              level="hero"
              as="h1"
              className={cn(
                "motion-safe:animate-[mak-rise_1s_cubic-bezier(0.16,1,0.3,1)_0.08s_both]",
                uppercase && "uppercase"
              )}
            >
              {lines.map((line, index) => (
                <span key={line} className="block">
                  {line}
                  {index < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </Heading>

            {supporting ? (
              <Text
                size="lead"
                tone="muted"
                className="mt-7 max-w-[440px] motion-safe:animate-[mak-rise_1s_cubic-bezier(0.16,1,0.3,1)_0.18s_both]"
              >
                {supporting}
              </Text>
            ) : null}

            {primaryCta || secondaryCta ? (
              <div className="mt-8 flex flex-wrap gap-3.5 motion-safe:animate-[mak-rise_1s_cubic-bezier(0.16,1,0.3,1)_0.26s_both]">
                {primaryCta ? (
                  <ButtonLink
                    href={primaryCta.href}
                    variant="primary"
                    size="lg"
                    iconRight={<ArrowRightIcon size={16} />}
                  >
                    {primaryCta.label}
                  </ButtonLink>
                ) : null}
                {secondaryCta ? (
                  <ButtonLink href={secondaryCta.href} variant="secondary" size="lg">
                    {secondaryCta.label}
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}

            {trustItems.length > 0 ? (
              <ul className="mt-11 flex flex-wrap items-center gap-x-4 gap-y-2 text-mak-label font-normal uppercase tracking-[0.05em] text-mak-muted motion-safe:animate-[mak-rise_1s_cubic-bezier(0.16,1,0.3,1)_0.34s_both]">
                {trustItems.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-center gap-4">
                    {index > 0 && (
                      <span aria-hidden="true" className="text-mak-divider">
                        /
                      </span>
                    )}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="relative motion-safe:animate-[mak-rise_1.1s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
            {/*
              The photograph and its plaque are one link, not two. They name the
              same piece, and a screen reader offered "Fastrack Exuberant..."
              twice in a row has to work out that they are the same destination.
              The plaque's own text is the link's accessible name, so there is
              deliberately no aria-label overriding it.

              `relative` here as well as on the wrapper: the plaque positions
              against its nearest positioned ancestor, which becomes this
              element once the link is in place. Without it the plaque would
              hang off the grid column instead of the frame.
            */}
            <HeroFrame href={href}>
              {/*
                The frame and its accent block share their own positioning
                context, so the plaque can sit beneath them in the flow on a
                phone without the accent stretching to the taller column.
              */}
              <div className="relative">
                {/* The offset accent block behind the frame. Decorative. */}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-5 -right-5 z-0 h-[78%] w-[70%] bg-mak-accent"
                />

                {/* 2px ink border and a 4:5 frame, exactly as the reference. */}
                <div className="relative z-10 overflow-hidden border-2 border-mak-line bg-mak-surface">
                  <ProductImage
                    media={image ?? null}
                    alt={imageAlt}
                    sizes={IMAGE_SIZES.half}
                    ratio="portrait"
                    priority
                    grayscale
                    // The same zoom the product tiles use, so the hero answers
                    // a hover the way the rest of the catalogue does. Only when
                    // there is somewhere to go.
                    hoverZoom={Boolean(href)}
                  />
                </div>
              </div>

              {/*
                The plaque overlaps the frame's lower-left corner from sm up, as
                the reference does. On a phone it drops below the frame instead:
                a real product name runs to three or four lines at 375px, and an
                overlapping plaque that tall hides the watch it is captioning.
                The mt-5 clears the accent block's own 20px overhang, so the red
                still reads as the offset it is.
              */}
              {plaque ? (
                <div className="relative z-20 mt-5 border-2 border-mak-line bg-mak-bg px-4 py-3.5 sm:absolute sm:-left-4 sm:bottom-8 sm:mt-0">
                  {plaque.eyebrow ? (
                    <div className="text-mak-micro font-semibold uppercase tracking-[0.18em] text-mak-accent">
                      {plaque.eyebrow}
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "font-display text-lg font-extrabold tracking-[-0.01em] text-mak-ink",
                      // The only hint that the plaque is a link. Subtle on
                      // purpose: the hero is an editorial opening, not a tile.
                      href && "transition-colors duration-200 ease-mak group-hover:text-mak-accent"
                    )}
                  >
                    {plaque.name}
                  </div>
                  {plaque.price ? (
                    <div className="text-mak-small text-mak-muted">{plaque.price}</div>
                  ) : null}
                </div>
              ) : null}
            </HeroFrame>
          </div>
        </div>

        {scrollCue ? (
          <div className="flex justify-center pb-5" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-mak-ink motion-safe:animate-[mak-cue_1.6s_ease-in-out_infinite]"
            >
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/**
 * The hero's picture and plaque, linked to the pictured product when there is
 * one.
 *
 * Split out so the markup inside is written once. The alternative -- rendering
 * the whole block twice, once inside a Link and once bare -- is how the linked
 * and unlinked heroes drift apart.
 */
function HeroFrame({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  if (!href) return <>{children}</>;

  return (
    <Link
      href={href}
      className="group relative block no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mak-accent"
    >
      {children}
    </Link>
  );
}
