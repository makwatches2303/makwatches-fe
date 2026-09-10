import { notFound, permanentRedirect } from "next/navigation";

import { resolveCategory, slugify } from "@/lib/category-lookup";

/**
 * Legacy route: /men/category/:subcategoryId?name=Leather+Watch.
 *
 * This used to be a full client-rendered listing page (client-side fetch,
 * client-side filter/paginate) duplicating what /category/[slug] now does
 * server-side. It's replaced with a permanent redirect there instead.
 *
 * :subcategoryId is an opaque legacy id, not a slug -- CategoryTile used to
 * build these links as `/${mainCategory}/category/${encodeURIComponent(
 * category.id)}?name=${encodeURIComponent(category.name)}`, so the *name*
 * needed to resolve a category lives in the `name` query param, not the path
 * segment. That's why this can't be a static rewrite in next.config.ts (a
 * static rule only has the id to work with, and the id doesn't slugify to
 * anything /category/[slug] can look up) -- it has to run the same
 * resolveCategory lookup the destination page uses, here, before redirecting.
 */
export default async function MenCategoryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ subcategoryId: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const [{ subcategoryId }, search] = await Promise.all([
    params,
    searchParams,
  ]);

  const candidateName = search.name
    ? decodeURIComponent(search.name)
    : decodeURIComponent(subcategoryId);
  const slug = slugify(candidateName);
  const resolved = await resolveCategory(slug);

  // The category may since have been renamed or removed -- an old bookmark
  // or indexed link that no longer resolves to anything is a 404, not a
  // redirect to a page that doesn't match what the visitor followed.
  if (!resolved) notFound();

  permanentRedirect(`/category/${slug}?mainCategory=Men`);
}
