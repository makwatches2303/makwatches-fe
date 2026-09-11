import type { Metadata } from "next";

import { CatalogListing } from "../(shop)/CatalogListing";

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

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        eyebrow="For him"
        title="The men's edit."
        // Scoped to the Men category tree. Facets are computed within that
        // scope, so a filter here can never return an empty set from Women.
        scope={{ mainCategory: "Men" }}
        lockedParams={[]}
        searchParams={params}
        basePath="/men"
      />
    </div>
  );
}
