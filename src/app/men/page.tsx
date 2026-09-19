import type { Metadata } from "next";

import { CatalogListing } from "../(shop)/CatalogListing";
import { fetchStorefront } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Men's watches",
  description: "Browse MAK Watches for men across leather, metal, gold and silver.",
  alternates: { canonical: "/men" },
};

export const revalidate = 0;

export default async function MenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Admin-managed header (Storefront -> Pages), with the shipped copy as the
  // fallback. The scope below is deliberately *not* editable: what this page
  // says is a merchandising decision, what it shows is not.
  const { listings } = await fetchStorefront();
  const header = listings.men;

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        eyebrow={header.eyebrow}
        title={header.title}
        description={header.description || undefined}
        // Scoped to the Men category tree. Facets are computed within that
        // scope, so a filter here can never return an empty set from Women.
        scope={{ mainCategory: "Men" }}
        lockedParams={[]}
        searchParams={params}
        basePath="/men"
        // Scoped search. The box writes ?q= into this URL, which is fetched
        // together with the Men scope above, so it can only ever return men's
        // pieces -- no second search system, and no catalogue-wide query.
        searchLabel="Search men's watches"
        searchPlaceholder="Search men's watches by name, brand or style"
      />
    </div>
  );
}
