import { fetchCategories } from "@/lib/api/server";

/** Slugify the same way the backend does, so URLs round-trip. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Find the subcategory whose name slugifies to `slug`. */
export async function resolveCategory(
  slug: string
): Promise<{ parent: string; name: string } | null> {
  const categories = await fetchCategories();

  for (const category of categories) {
    for (const sub of category.subcategories ?? []) {
      if (slugify(sub.name) === slug) {
        return { parent: category.name, name: sub.name };
      }
    }
  }
  return null;
}
