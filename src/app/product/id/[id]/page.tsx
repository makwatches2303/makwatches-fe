import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";

import { fetchProductById, fetchStorefront } from "@/lib/api/server";
import { resolveProductImages } from "@/lib/media";
import { ProductDetail } from "../../../(product)/ProductDetail";

/**
 * A product page addressed by database id.
 *
 * This is the working route today, because no product carries a slug yet. Once
 * the slug backfill runs, a product reached here redirects permanently to its
 * slug URL, so the id form degrades into a redirect rather than a duplicate
 * page competing for the same content in search.
 */

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) return { title: "Product not found" };

  const images = resolveProductImages(product)
    .map((m) => m.url)
    .filter((url) => url.startsWith("http"));

  return {
    title: product.seo?.title || product.name,
    description:
      product.seo?.description || product.shortDescription || product.description,
    // Canonical points at the slug once one exists, so the id URL never
    // competes with it.
    alternates: {
      canonical: product.slug ? `/product/${product.slug}` : `/product/id/${id}`,
    },
    openGraph: {
      type: "website",
      title: product.seo?.title || product.name,
      description:
        product.seo?.description || product.shortDescription || product.description,
      ...(images.length > 0 ? { images } : {}),
    },
  };
}

export default async function ProductIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) notFound();

  // Prefer the canonical slug URL when the record has one.
  if (product.slug) permanentRedirect(`/product/${product.slug}`);

  const storefront = await fetchStorefront();

  return (
    <div className="mak bg-mak-bg">
      <ProductDetail product={product} policies={storefront.policies} />
    </div>
  );
}
