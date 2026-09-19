import type { Metadata } from "next";

import { CatalogListing } from "../(shop)/CatalogListing";
import { fetchStorefront } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Women's watches",
  description: "Browse MAK Watches for women across leather, metal, rose gold and silver.",
  alternates: { canonical: "/women" },
};

export const revalidate = 0;

export default async function WomenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Admin-managed header -- see the note on the men's page.
  const { listings } = await fetchStorefront();
  const header = listings.women;

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        eyebrow={header.eyebrow}
        title={header.title}
        description={header.description || undefined}
        scope={{ mainCategory: "Women" }}
        searchParams={params}
        basePath="/women"
        // Scoped search -- see the note on the men's page.
        searchLabel="Search women's watches"
        searchPlaceholder="Search women's watches by name, brand or style"
      />
    </div>
  );
}
