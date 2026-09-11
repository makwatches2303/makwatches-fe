import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { fetchProductBySlug, fetchStorefront } from "@/lib/api/server";
import { resolveProductImages } from "@/lib/media";
import { ProductDetail } from "../../(product)/ProductDetail";

/**
 * A product page addressed by slug — the canonical product URL.
 *
 * Slugs exist only on records that have been through the additive backfill
 * (makwatches-be/cmd/backfill-slugs), which has not been run against this
 * catalogue. Until it is, product links resolve through /product/id/[id]
 * instead and this route 404s, which is correct: the slug genuinely does not
 * exist yet.
 */

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  const images = resolveProductImages(product)
    .map((m) => m.url)
    .filter((url) => url.startsWith("http"));

  return {
    title: product.seo?.title || product.name,
    description:
      product.seo?.description || product.shortDescription || product.description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: "website",
      title: product.seo?.title || product.name,
      description:
        product.seo?.description || product.shortDescription || product.description,
      // Only real product photography goes in the card; no placeholder.
      ...(images.length > 0 ? { images } : {}),
    },
  };
}

export default async function ProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) notFound();

  const storefront = await fetchStorefront();

  return (
    <div className="mak bg-mak-bg">
      <ProductDetail product={product} policies={storefront.policies} />
    </div>
  );
}
