import { fetchProducts } from "@/lib/api/server";
import { toMediaRef } from "@/lib/media";
import type { Category } from "@/lib/api/types";
import type { ShowcaseCategory } from "@/components/marketing/CategoryShowcase";

/**
 * The storefront's five category front doors, and how they resolve.
 *
 * ## Why this is shared
 *
 * Both /collections and the homepage's "shop by category" band show the same
 * five entries. Defining them twice would guarantee they drift — a renamed
 * label here, a route corrected there — so the list, the lookup and the
 * fact-gathering all live in this one module and both pages call it.
 *
 * ## Nothing here is invented
 *
 * These are a *display order*, not a content system. Each entry names a
 * category and is resolved against the live tree from `GET /categories` at
 * render time:
 *
 *   - a name that resolves gets its real route, its real product count, and a
 *     real photograph (the admin's own subcategory image where one is set,
 *     otherwise borrowed from the newest in-stock product in that scope);
 *   - a name that does not resolve is returned as `unavailable` with no href at
 *     all — never a link to a page that would 404, and never one quietly
 *     pointed somewhere unrelated.
 *
 * No product ids, no invented slugs. Rename a category in the admin and the
 * card follows it; create a missing one and its card becomes a link with no
 * code change.
 *
 * SERVER ONLY — it calls `@/lib/api/server`.
 */

/**
 * How a front door is looked up.
 *
 * `top` matches a top-level category; `sub` matches a subcategory under any
 * parent. Both match by *name*, case-insensitively, because that is the only
 * identity the category API exposes and the one an admin edits.
 */
export interface FrontDoor {
  id: string;
  label: string;
  cta: string;
  level: "top" | "sub";
  /** The category name as it appears in the live tree. */
  value: string;
  /**
   * The route used when the name resolves.
   *
   * Written out rather than derived: /men and /women are dedicated scoped
   * listings, better than the generic /shop?mainCategory= a top-level category
   * would otherwise produce; and the two subcategories below exist under *both*
   * parents, so they need the unscoped /category/<slug> — the parent-scoped
   * form would hide half the stock. Every one is an existing route in this app.
   */
  href: string;
  /** Describes the photograph, for screen readers. */
  imageAlt: string;
}

export const CATEGORY_FRONT_DOORS: FrontDoor[] = [
  {
    id: "men",
    label: "Men",
    cta: "Shop Men",
    level: "top",
    value: "Men",
    href: "/men",
    imageAlt: "A men's watch from the MAK Watches collection",
  },
  {
    id: "women",
    label: "Women",
    cta: "Shop Women",
    level: "top",
    value: "Women",
    href: "/women",
    imageAlt: "A women's watch from the MAK Watches collection",
  },
  {
    id: "kids",
    label: "Kids",
    cta: "Shop Kids",
    level: "top",
    value: "Kids",
    href: "/shop?mainCategory=Kids",
    imageAlt: "Watches for children",
  },
  {
    id: "wall-clocks",
    label: "Wall Clocks",
    cta: "Shop Wall Clocks",
    level: "sub",
    value: "Wall Clock",
    href: "/category/wall-clock",
    imageAlt: "A wall clock from the MAK Watches range",
  },
  {
    id: "smart-watches",
    label: "Smart Watches",
    cta: "Shop Smart Watches",
    level: "sub",
    value: "Smart Watch",
    href: "/category/smart-watch",
    imageAlt: "A smart watch from the MAK Watches range",
  },
];

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** The admin's own image for a subcategory, from whichever parent has one. */
function treeImageFor(
  door: FrontDoor,
  categories: Category[]
): string | undefined {
  if (door.level === "top") return undefined;
  for (const category of categories) {
    const sub = (category.subcategories ?? []).find((s) =>
      sameName(s.name ?? "", door.value)
    );
    if (sub?.imageUrl) return sub.imageUrl;
  }
  return undefined;
}

/** Whether the live tree actually contains this category. */
function resolves(door: FrontDoor, categories: Category[]): boolean {
  if (door.level === "top") {
    return categories.some((category) => sameName(category.name ?? "", door.value));
  }
  return categories.some((category) =>
    (category.subcategories ?? []).some((sub) => sameName(sub.name ?? "", door.value))
  );
}

/**
 * Turn the five front doors into renderable cards.
 *
 * One probe per door: `limit: 1` reads the real total out of the pagination
 * metadata and borrows the newest in-stock product's photograph, so nothing is
 * transferred that is not used and no figure is invented.
 *
 * A door whose category is absent is still returned — as an inert card. Hiding
 * it would make the gap invisible; linking it would make it broken.
 */
export async function resolveCategoryFrontDoors(
  categories: Category[]
): Promise<ShowcaseCategory[]> {
  const facts = await Promise.all(
    CATEGORY_FRONT_DOORS.map(async (door) => {
      if (!resolves(door, categories)) {
        return {
          door,
          resolved: false,
          count: 0,
          image: undefined as string | undefined,
        };
      }

      const page = await fetchProducts(
        {
          ...(door.level === "top"
            ? { mainCategory: door.value }
            : { subcategory: door.value }),
          limit: 1,
          inStock: true,
          sortBy: "createdAt" as const,
          order: "desc" as const,
        },
        `frontDoor(${door.id})`
      );

      const product = page.items[0];
      return {
        door,
        resolved: true,
        count: page.meta?.total ?? 0,
        image:
          treeImageFor(door, categories) ??
          product?.media?.[0]?.url ??
          product?.images?.[0] ??
          product?.imageUrl ??
          undefined,
      };
    })
  );

  // A reference that did not resolve is a merchandising gap, not a render
  // error. The card is already inert; this makes the gap findable in the server
  // log rather than only by noticing a missing link.
  const missing = facts.filter((f) => !f.resolved).map((f) => f.door.value);
  if (missing.length > 0) {
    console.warn(
      `[categories] no category in the live tree matches: ${missing.join(", ")}. ` +
        `Those cards render as "coming soon" with no link.`
    );
  }

  return facts.map(({ door, resolved, count, image }) => ({
    id: door.id,
    label: door.label,
    cta: door.cta,
    // No href at all when the category does not exist. An inert panel is
    // correct; a link to a 404 is not.
    href: resolved ? door.href : undefined,
    unavailable: !resolved,
    imageAlt: image ? door.imageAlt : "",
    image: toMediaRef(image, door.imageAlt),
    count: count > 0 ? count : undefined,
    note: !resolved
      ? "Not in the catalogue yet"
      : count > 0
        ? `${count.toLocaleString("en-IN")} ${count === 1 ? "piece" : "pieces"}`
        : "Stock coming soon",
  }));
}
