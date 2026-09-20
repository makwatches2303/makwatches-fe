import type { Metadata } from "next";

import { CatalogListing } from "../(shop)/CatalogListing";
import { fetchStorefront } from "@/lib/api/server";

/**
 * The full catalog.
 *
 * Filtering, sorting, search and pagination all live in the URL, so any view
 * of this page is a shareable link and is rendered on the server.
 */

export const metadata: Metadata = {
  title: "Shop all watches",
  description:
    "Browse the full MAK Watches collection. Filter by brand, price and availability.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 0;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;

  // The header is admin-managed (Storefront -> Pages). It used to be three
  // literals here, which made the one part of this page anyone would want to
  // reword the one part that needed a deploy. Falls back to the shipped copy
  // when the API is unreachable, so the page is never headless.
  const { listings } = await fetchStorefront();
  const header = listings.collection;

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        // A search replaces the editorial header with the query itself: the
        // admin's headline describes the catalogue, not these results.
        eyebrow={query ? "Search results" : header.eyebrow}
        title={query ? `“${query}”` : header.title}
        description={query ? undefined : header.description}
        searchParams={params}
        // Browsing listings keep loading as the shopper scrolls; see
        // CatalogListing's `infinite` prop.
        infinite
        basePath="/shop"
      />
    </div>
  );
}
