import { Hero } from "@/components/marketing";
import { formatPrice } from "@/design-system";
import { toMediaRef } from "@/lib/media";
import { productHref } from "@/lib/product-href";
import type { HeroSlide } from "@/lib/api/home-content";
import type { Product } from "@/lib/api/types";
import type { HeroContent, TrustContent } from "@/lib/api/storefront";

/**
 * The homepage hero.
 *
 * Deliberately not a carousel: the reference opens on one editorial statement,
 * and rotating through four would weaken it.
 *
 * Copy precedence is explicit. The headline and supporting line are brand
 * positioning and come from the admin-managed storefront document. The imagery
 * and the product plaque come from the hero slides CMS and the real product it
 * links to, so the plaque always names a piece that exists at the price it
 * currently sells for.
 */

export interface HomeHeroProps {
  /** Admin-managed hero copy. */
  content: HeroContent;
  /** Admin-managed service strip; rendered only when enabled. */
  trust: TrustContent;
  slide?: HeroSlide;
  /** Resolved product for the slide, when it links to one. */
  linkedProduct?: Product | null;
}

export function HomeHero({ content, trust, slide, linkedProduct }: HomeHeroProps) {
  // The slide's own image wins; a linked product's imagery is the fallback.
  const image =
    toMediaRef(slide?.image, slide?.title ?? "") ??
    toMediaRef(slide?.images?.[0], slide?.title ?? "") ??
    toMediaRef(linkedProduct?.imageUrl, linkedProduct?.name ?? "");

  // The plaque names the piece the hero actually shows, and is rendered only
  // when there is a real product behind it -- otherwise the hero would be
  // captioning its own decoration.
  const plaque = linkedProduct
    ? {
        eyebrow: linkedProduct.collection || linkedProduct.category || undefined,
        name: linkedProduct.name,
        price: formatPrice(linkedProduct.price),
      }
    : slide?.subtitle?.trim()
      ? {
          eyebrow: slide.category?.trim() || undefined,
          name: slide.subtitle.trim(),
          price: slide.price?.trim() || undefined,
        }
      : undefined;

  // The hero opens on a real piece, so it links to that piece's page -- the
  // same page every catalogue tile leads to, with the same purchase panel. Only
  // when a product is genuinely behind the slide: a slide that merely carries
  // an image has nothing to sell and is not dressed up as though it does.
  const href = linkedProduct ? productHref(linkedProduct) : undefined;

  const supporting =
    typeof content.pricedFrom === "number"
      ? `${content.supporting} Priced from ${formatPrice(content.pricedFrom)}.`
      : content.supporting;

  return (
    <Hero
      eyebrow={content.eyebrow}
      headlineLines={[...content.headlineLines]}
      uppercase
      supporting={supporting}
      primaryCta={content.primaryCta}
      secondaryCta={content.secondaryCta}
      image={image}
      imageAlt={slide?.title?.trim() || ""}
      plaque={plaque}
      href={href}
      // Empty unless the admin has entered real service terms.
      trustItems={trust.enabled ? trust.items : []}
      scrollCue
    />
  );
}
