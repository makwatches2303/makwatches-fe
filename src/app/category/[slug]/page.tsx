import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resolveCategory } from "@/lib/category-lookup";
import { CatalogListing } from "../../(shop)/CatalogListing";

/**
 * A category listing, e.g. /category/leather-watch.
 *
 * The catalog stores a composite category path ("Men — Leather watch"), and
 * subcategory names repeat across Men and Women. The slug therefore identifies
 * a *subcategory name*, and the listing spans both genders unless the URL
 * narrows it with ?mainCategory=Men.
 *
 * slugify/resolveCategory live in @/lib/category-lookup: the legacy
 * /men/category/[subcategoryId] and /women/category/[subcategoryId] routes
 * use the same resolution to redirect here (see those files for why that
 * can't be a static next.config.ts rewrite).
 */

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveCategory(slug);

  if (!resolved) return { title: "Category not found" };

  return {
    title: resolved.name,
    description: `Browse MAK Watches in ${resolved.name}.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const resolved = await resolveCategory(slug);

  // An unknown slug is a 404, not an empty grid: the page genuinely does not
  // exist, and returning 200 with no results would let it be indexed.
  if (!resolved) notFound();

  const mainCategory =
    typeof search.mainCategory === "string" ? search.mainCategory : undefined;

  return (
    <div className="mak bg-mak-bg">
      <CatalogListing
        eyebrow={mainCategory ? `${mainCategory} · Category` : "Category"}
        title={resolved.name}
        scope={{
          subcategory: resolved.name,
          ...(mainCategory ? { mainCategory } : {}),
        }}
        lockedParams={["mainCategory"]}
        searchParams={search}
        basePath={`/category/${slug}`}
      />
    </div>
  );
}
