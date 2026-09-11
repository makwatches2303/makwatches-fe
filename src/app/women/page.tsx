import type { Metadata } from "next";

import { CatalogListing } from "../(shop)/CatalogListing";

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

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        eyebrow="For her"
        title="The women's edit."
        scope={{ mainCategory: "Women" }}
        searchParams={params}
        basePath="/women"
      />
    </div>
  );
}
