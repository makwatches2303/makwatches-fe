import Link from "next/link";

import { cn } from "@/lib/utils";
import { ArrowRightIcon, Reveal } from "@/design-system";
import { ProductImage } from "@/components/commerce/ProductImage";
import type { MediaRef } from "@/lib/media";

/**
 * The category showcase: large editorial front doors into the catalogue.
 *
 * A sibling to CategoryTiles rather than a replacement. CategoryTiles is the
 * dense grid the homepage uses to show *every* subcategory; this is the
 * opposite job — a handful of departments, each given enough room and enough
 * type to read as a destination rather than a list item. Same visual language:
 * the 2px rule, the scrim, the accent arrow, the hover zoom.
 *
 * Every card is the same size. A lead-plus-leftovers layout makes the first two
 * categories tower over the rest on a wide screen and pushes the remainder
 * below the fold; one ratio and one type scale reads as a considered set and
 * keeps the whole shelf visible at once.
 *
 * ## Categories the catalogue does not have
 *
 * A card can be marked `unavailable`. It then renders as a non-interactive
 * panel with no href at all — not a link to a page that would 404, and not a
 * link quietly redirected somewhere unrelated. That is the honest rendering for
 * a category that has been planned but does not exist in the backend yet, and
 * it costs nothing the day it does: give it a route and it becomes a link.
 *
 * ## Accessibility
 *
 * One link per card wrapping the whole cell, so keyboard users tab once per
 * category instead of three times; the visible CTA sits inside that link rather
 * than being a second one. The set is a real `<ul>`/`<li>`, so assistive tech
 * announces how many categories there are up front. Focus is visible on the
 * card itself, and the CTA underline responds to `:focus-visible` as well as
 * hover so the affordance is not pointer-only.
 *
 * A server component — the hover treatment is CSS and needs no client boundary.
 */

export interface ShowcaseCategory {
  id: string;
  /** Display name, e.g. "MEN". */
  label: string;
  /** Existing route. Omitted when the category is unavailable. */
  href?: string;
  /** Call to action, e.g. "Shop Men". */
  cta: string;
  image?: MediaRef | null;
  /** Describes the photograph for screen readers. */
  imageAlt?: string;
  /** Real product count. Omitted when unknown or zero. */
  count?: number;
  /** Short line under the label — a count, or why the card is not shoppable. */
  note?: string;
  /** No route exists for this category yet: render it inert, never as a link. */
  unavailable?: boolean;
}

export interface CategoryShowcaseProps {
  categories: ShowcaseCategory[];
  className?: string;
}

/** The visual body, shared by the linked and the inert card. */
function CardBody({
  category,
  priority,
}: {
  category: ShowcaseCategory;
  priority: boolean;
}) {
  return (
    <div className="relative aspect-4/3 w-full">
      <ProductImage
        media={category.image ?? null}
        alt={category.imageAlt ?? ""}
        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
        ratio="auto"
        priority={priority}
        hoverZoom={!category.unavailable}
        className="absolute inset-0 size-full"
      />

      {/* Scrim, so the type stays legible over any photograph. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-linear-to-b from-transparent from-30%",
          category.unavailable
            ? "to-[rgba(20,18,17,0.92)]"
            : "to-[rgba(20,18,17,0.88)]"
        )}
      />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-[-0.02em] text-white break-words sm:text-3xl">
            {category.label}
          </h2>

          {category.note ? (
            <p className="mt-1 text-mak-label uppercase tracking-[0.12em] text-white/75">
              {category.note}
            </p>
          ) : null}

          {category.unavailable ? (
            <p className="mt-3 inline-flex items-center gap-2 font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-white/55">
              Coming soon
            </p>
          ) : (
            <p
              className={cn(
                // `relative` is load-bearing: without it the ::after underline
                // resolves against the card's positioned frame and draws a rule
                // across the whole card instead of under the CTA.
                "relative mt-3 inline-flex items-center gap-2 pb-1",
                "font-display text-mak-label font-extrabold uppercase tracking-[0.14em] text-white",
                "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-0 after:bg-mak-accent",
                "after:transition-[width] after:duration-500 after:ease-mak",
                "group-hover:after:w-full group-focus-visible:after:w-full"
              )}
            >
              {category.cta}
            </p>
          )}
        </div>

        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center",
            category.unavailable
              ? "border-2 border-white/25 text-white/40"
              : "bg-mak-accent text-mak-on-accent transition-transform duration-300 ease-mak group-hover:translate-x-1"
          )}
        >
          <ArrowRightIcon size={20} />
        </span>
      </div>
    </div>
  );
}

export function CategoryShowcase({
  categories,
  className,
}: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    // One-up on phones, two-up from `sm`, three-up from `lg`. Not RuleGrid:
    // these cards carry their own 2px border, so they keep their edges when the
    // row wraps -- which a shared-gap grid cannot do at a single column.
    <ul
      className={cn(
        "grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3",
        className
      )}
    >
      {categories.map((category, index) => (
        <Reveal
          key={category.id}
          as="li"
          delay={Math.min(index, 3) as 0 | 1 | 2 | 3}
          className="min-w-0"
        >
          {category.unavailable || !category.href ? (
            <div className="relative block h-full overflow-hidden border-2 border-mak-divider bg-white">
              <CardBody category={category} priority={false} />
            </div>
          ) : (
            <Link
              href={category.href}
              className={cn(
                "group relative block h-full overflow-hidden border-2 border-mak-line bg-white no-underline",
                "transition-colors duration-300 ease-mak hover:border-mak-accent",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mak-accent"
              )}
            >
              {/* Only the first row is above the fold on any viewport. */}
              <CardBody category={category} priority={index < 2} />
            </Link>
          )}
        </Reveal>
      ))}
    </ul>
  );
}
