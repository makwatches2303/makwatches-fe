import { cn } from "@/lib/utils";
import { Reveal } from "@/design-system";
import { IMAGE_SIZES, toMediaRef, type MediaRef } from "@/lib/media";
import { ProductImage } from "@/components/commerce/ProductImage";

/**
 * A full-bleed band of editorial imagery.
 *
 * Driven by the gallery images the admin uploads. Images carry no copy of their
 * own, so this section makes no claims -- it is purely a visual beat between
 * two product-heavy sections, which is the rhythm the reference establishes.
 *
 * The first image is given a wider cell on large screens so the band reads as
 * an editorial composition rather than a uniform contact sheet -- but only when
 * that still fills whole rows. See `opensWide` below: with five images in a
 * five-column grid, a double-width opener needs six column slots, so the fifth
 * image wrapped onto a row of its own and the four unfilled cells showed the
 * grid's own divider colour as one large grey slab.
 *
 * Empty cells are unavoidable in general -- no image count divides evenly by
 * two, three AND five -- so the hairlines between tiles are drawn by the tiles
 * themselves rather than by a coloured backdrop showing through the gaps. A
 * short last row now just ends, instead of painting a block of dead colour.
 *
 * Renders nothing when there are no images.
 */

export interface EditorialGalleryProps {
  images: { url: string; alt?: string }[];
  /** Cap the number shown. */
  limit?: number;
  className?: string;
}

export function EditorialGallery({
  images,
  limit = 5,
  className,
}: EditorialGalleryProps) {
  const resolved = images
    .slice(0, limit)
    .map((image) => toMediaRef(image.url, image.alt ?? ""))
    .filter((media): media is MediaRef => media !== null);

  if (resolved.length === 0) return null;

  // The wide opener costs one extra column slot, so it only earns its place
  // when (count + 1) divides the five-column row evenly. Otherwise the band
  // runs uniform and every row stays flush.
  const opensWide = resolved.length >= 5 && (resolved.length + 1) % 5 === 0;

  return (
    <section
      aria-label="Gallery"
      className={cn("border-y-2 border-mak-line", className)}
    >
      <div
        className={cn(
          "grid gap-0.5",
          // 2-up on mobile so the band still reads as a composition, not a
          // single tall column.
          "grid-cols-2",
          resolved.length >= 3 && "md:grid-cols-3",
          resolved.length >= 5 && "lg:grid-cols-5"
        )}
      >
        {resolved.map((media, index) => (
          <Reveal
            key={`${media.url}-${index}`}
            delay={Math.min(index, 4) as 0 | 1 | 2 | 3 | 4}
            className={cn(
              // Inverts the house .mak-rule-grid pattern on purpose: there the
              // container paints the divider and cells repaint the ground over
              // it, which is exactly what turns unfilled cells into a slab.
              // Here the hairline rides on the tile, so a gap with no tile
              // behind it shows the page instead.
              "bg-mak-bg shadow-[0_0_0_1px_var(--color-mak-divider)]",
              // The opening image spans two columns on wide viewports.
              index === 0 && opensWide && "lg:col-span-2"
            )}
          >
            <ProductImage
              media={media}
              // Decorative unless the admin supplied a meaningful description.
              alt={media.alt ?? ""}
              sizes={IMAGE_SIZES.categoryTile}
              ratio={index === 0 && opensWide ? "landscape" : "square"}
              className="size-full"
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
