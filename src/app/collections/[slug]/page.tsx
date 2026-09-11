import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { fetchCollections } from "@/lib/api/server";
import { CatalogListing } from "../../(shop)/CatalogListing";

/**
 * One collection's listing.
 *
 * Collections are derived from a product field that is currently unset, so
 * every slug 404s until products carry one. That is the correct behaviour: a
 * collection page with no collection behind it does not exist.
 */

export const revalidate = 0;

async function resolve(slug: string) {
  const collections = await fetchCollections();
  return collections.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await resolve(slug);

  if (!collection) return { title: "Collection not found" };

  return {
    title: collection.name,
    description: `Browse the ${collection.name} collection from MAK Watches.`,
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const collection = await resolve(slug);

  if (!collection) notFound();

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        eyebrow="Collection"
        title={collection.name}
        scope={{ collection: collection.name }}
        searchParams={search}
        basePath={`/collections/${slug}`}
      />
    </div>
  );
}
