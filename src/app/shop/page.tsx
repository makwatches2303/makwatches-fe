import type { Metadata } from "next";

import { CatalogListing } from "../(shop)/CatalogListing";

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

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        eyebrow={query ? "Search results" : "The collection"}
        title={query ? `“${query}”` : "Every watch we make."}
        description={
          query
            ? undefined
            : "The complete MAK catalogue. Filter by brand, price and availability."
        }
        searchParams={params}
        basePath="/shop"
      />
    </div>
  );
}
