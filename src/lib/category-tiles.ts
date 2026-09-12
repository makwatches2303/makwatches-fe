import type { Category } from "@/lib/api/types";
import type {
  CategoryTileConfig,
  CategoryTilesContent,
} from "@/lib/api/storefront";

/**
 * Resolve admin-configured category tiles against the live category tree.
 *
 * Mirrors models.ResolveCategoryTiles on the backend. The storefront resolves
 * client-side too because it already holds the category tree for counts and the
 * marquee — re-fetching a resolved list would be a second round trip for data
 * it can derive.
 *
 * A tile holds a *reference*, never a copy, so it keeps resolving as categories
 * are renamed or re-imaged. A reference that no longer resolves is OMITTED and
 * reported — never replaced by a different category, which would show the
 * shopper a tile the merchandiser did not choose.
 */

/** The separator between parent and child in a subcategory reference. */
export const CATEGORY_TILE_SEPARATOR = " > ";

export interface ResolvedCategoryTile {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  /** The live category's image, or the tile's override. */
  image?: string;
  mainCategory?: string;
  subcategory?: string;
}

export interface TileWarning {
  tileId: string;
  source: string;
  value: string;
  message: string;
}

/** Must match the backend's slug so /category/<slug> round-trips. */
export function categorySlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function splitValue(value: string): { parent: string; child: string } {
  const index = value.indexOf(CATEGORY_TILE_SEPARATOR);
  if (index < 0) return { parent: value.trim(), child: "" };
  return {
    parent: value.slice(0, index).trim(),
    child: value.slice(index + CATEGORY_TILE_SEPARATOR.length).trim(),
  };
}

function categoryHref(mainCategory: string, subcategory: string): string {
  if (!subcategory) {
    // A top-level category has no dedicated route; the scoped shop is the
    // closest true destination.
    return `/shop?mainCategory=${encodeURIComponent(mainCategory)}`;
  }
  return `/category/${categorySlug(subcategory)}?mainCategory=${encodeURIComponent(mainCategory)}`;
}

/** Apply the admin's overrides over the live category's own values. */
function buildTile(
  tile: CategoryTileConfig,
  mainCategory: string,
  subcategory: string,
  image?: string
): ResolvedCategoryTile {
  return {
    id: tile.id || categorySlug(`${mainCategory}-${subcategory}`),
    label: tile.label || subcategory || mainCategory,
    subtitle: tile.subtitle || undefined,
    href: tile.href || categoryHref(mainCategory, subcategory),
    image: tile.image || image || undefined,
    mainCategory,
    subcategory: subcategory || undefined,
  };
}

/** One tile per subcategory, in tree order. */
function autoTiles(
  categories: Category[],
  fallbackImages: Record<string, string> = {}
): ResolvedCategoryTile[] {
  return categories.flatMap((category) =>
    (category.subcategories ?? [])
      .filter((sub) => sub.name?.trim())
      .map((sub) => {
        const name = sub.name.trim();
        return {
          id: categorySlug(`${category.name}-${name}`),
          label: name,
          href: categoryHref(category.name, name),
          // The admin's own image always wins; the borrowed product photo is
          // only a stand-in so an un-merchandised subcategory does not render
          // as a "no image" placeholder.
          image: sub.imageUrl || fallbackImage(fallbackImages, category.name, name),
          mainCategory: category.name,
          subcategory: name,
        };
      })
  );
}

/** Must match categoryImageKey in lib/api/server.ts. */
function fallbackImage(
  images: Record<string, string>,
  mainCategory: string,
  subcategory: string
): string | undefined {
  const key = `${mainCategory.trim().toLowerCase()}|${subcategory.trim().toLowerCase()}`;
  return images[key] || undefined;
}

/** Match one curated reference against the live tree. */
function resolveTile(
  tile: CategoryTileConfig,
  categories: Category[],
  fallbackImages: Record<string, string> = {}
): { tile: ResolvedCategoryTile } | { error: string } {
  const value = tile.value?.trim();
  if (!value) return { error: "tile has no category reference" };

  const { parent, child } = splitValue(value);

  if (tile.source === "subcategory") {
    for (const category of categories) {
      // A qualified value ("Men > Gold watch") must match both halves; a bare
      // one matches the first tree entry with that name.
      if (child && !sameName(category.name, parent)) continue;

      const target = child || parent;
      const sub = (category.subcategories ?? []).find((s) =>
        sameName(s.name, target)
      );
      if (sub) {
        const name = sub.name.trim();
        return {
          tile: buildTile(
            tile,
            category.name,
            name,
            sub.imageUrl || fallbackImage(fallbackImages, category.name, name)
          ),
        };
      }
    }
    return { error: `subcategory "${value}" no longer exists` };
  }

  // "category" or unset.
  const category = categories.find((c) => sameName(c.name, parent));
  if (category) return { tile: buildTile(tile, category.name, "") };

  return { error: `category "${value}" no longer exists` };
}

/**
 * Turn the stored configuration into renderable tiles.
 *
 * Returns warnings alongside, so a broken reference is observable rather than
 * silently vanishing.
 */
export function resolveCategoryTiles(
  content: CategoryTilesContent,
  categories: Category[],
  /** Stand-in images for subcategories with none of their own, keyed by
   * categoryImageKey. Optional -- omit and those tiles fall back to the
   * branded placeholder as before. */
  fallbackImages: Record<string, string> = {}
): { tiles: ResolvedCategoryTile[]; warnings: TileWarning[] } {
  if (!content.enabled) return { tiles: [], warnings: [] };

  if (content.autoFromCategories || content.tiles.length === 0) {
    return { tiles: autoTiles(categories, fallbackImages), warnings: [] };
  }

  const ordered = [...content.tiles].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const tiles: ResolvedCategoryTile[] = [];
  const warnings: TileWarning[] = [];

  for (const tile of ordered) {
    if (!tile.enabled) continue;

    const result = resolveTile(tile, categories, fallbackImages);
    if ("error" in result) {
      warnings.push({
        tileId: tile.id,
        source: tile.source,
        value: tile.value,
        message: result.error,
      });
      continue;
    }
    tiles.push(result.tile);
  }

  return { tiles, warnings };
}
