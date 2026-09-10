import { notFound, permanentRedirect } from "next/navigation";

import { resolveCategory, slugify } from "@/lib/category-lookup";

/**
 * Legacy route: /women/category/:subcategoryId?name=Leather+Watch.
 * See src/app/men/category/[subcategoryId]/page.tsx -- same reasoning,
 * mirrored for the Women scope.
 */
export default async function WomenCategoryRedirect({
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

  if (!resolved) notFound();

  permanentRedirect(`/category/${slug}?mainCategory=Women`);
}
