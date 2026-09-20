import type { Crumb } from "@/design-system";
import type { Product } from "@/lib/api/types";
import { resolveProductImages } from "@/lib/media";

/**
 * Product and BreadcrumbList structured data.
 *
 * Built from the same product record and the same crumb array the page
 * renders, so the markup and the visible page can never disagree.
 *
 * Only fields the product genuinely carries are emitted. A missing brand, SKU
 * or image is omitted rather than guessed: structured data that asserts
 * something untrue is worse than structured data that says less. No
 * `aggregateRating` is emitted at all -- the page shows no reviews, and rating
 * markup that has no visible counterpart on the page is a search-engine policy
 * violation as well as a claim shoppers cannot check.
 */

export interface ProductJsonLdProps {
  product: Product;
  crumbs: Crumb[];
  /** Absolute site origin, when known, so URLs in the markup are absolute. */
  origin?: string;
}

export function ProductJsonLd({
  product,
  crumbs,
  origin = "https://makwatches.in",
}: ProductJsonLdProps) {
  const images = resolveProductImages(product)
    .map((media) => media.url)
    // Only real, absolute media belongs in structured data; the local
    // placeholder is not a photograph of the product.
    .filter((url) => url.startsWith("http"));

  const path = product.slug
    ? `/product/${product.slug}`
    : `/product/id/${product.id}`;

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: `${origin}${path}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${origin}${path}`,
    },
  };

  if (product.description) productLd.description = product.description;
  if (images.length > 0) productLd.image = images;
  if (product.brand) {
    productLd.brand = { "@type": "Brand", name: product.brand };
  }
  if (product.sku) productLd.sku = product.sku;
  if (product.category) productLd.category = product.category;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${origin}${crumb.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // The payload is built from typed server data, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
