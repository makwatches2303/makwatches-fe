import type { CatalogQuery } from "@/lib/api/types";

/**
 * One normalization of a catalog listing's URL into a catalog query.
 *
 * Shared because the query has to be built twice for the same listing: once on
 * the server for the first batch, and again in the browser for every batch
 * after it. Two implementations would be two chances for them to disagree, and
 * a disagreement here does not fail loudly -- the server would render one
 * listing and the browser would append a different one to it. The API also
 * fingerprints the query and rejects a cursor whose fingerprint does not
 * match, so a drift would surface as batches that simply stop loading.
 *
 * Framework-free on purpose: no React, no next/headers, no fetch. It is the
 * part of the feed worth testing on its own.
 */

/** Products per batch, and the initial server-rendered page. */
export const CATALOG_PAGE_SIZE = 24;

/** The sort keys the shop controls offer, as they appear in the URL. */
export type CatalogSort =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

/** Raw search params, in the shape a Next.js route hands them over. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** The scope a listing is locked to and cannot be filtered out of. */
export type CatalogScope = Pick<
  CatalogQuery,
  "category" | "mainCategory" | "subcategory" | "collection" | "gender"
>;

/** First value of a possibly-repeated search param. */
export function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Translate the URL's sort key into catalog query fields. */
export function sortToQuery(
  sort: string | undefined
): Pick<CatalogQuery, "sortBy" | "order"> {
  switch (sort) {
    case "price-asc":
      return { sortBy: "price", order: "asc" };
    case "price-desc":
      return { sortBy: "price", order: "desc" };
    case "name-asc":
      return { sortBy: "name", order: "asc" };
    case "newest":
    case "featured":
    default:
      // No dedicated featured ordering exists yet; newest is the closest true
      // proxy and is what the catalog is ordered by anyway.
      return { sortBy: "createdAt", order: "desc" };
  }
}

/**
 * Build the catalog query from a listing's URL and its locked scope.
 *
 * The scope is spread first and `gender` falls back to it, so a URL parameter
 * can narrow a listing but never widen it out of its own section.
 */
export function catalogQueryFromParams(
  searchParams: RawSearchParams,
  scope?: CatalogScope,
  limit: number = CATALOG_PAGE_SIZE
): CatalogQuery {
  const num = (key: string) => {
    const raw = firstParam(searchParams[key]);
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };

  const page = Math.max(1, num("page") ?? 1);
  const brand = firstParam(searchParams.brand);

  return {
    ...scope,
    // Free-text search shares the listing, so /shop?q=… works without a
    // separate route.
    q: firstParam(searchParams.q),
    // A brand filter is multi-select and arrives comma-separated.
    ...(brand ? { brand } : {}),
    gender: scope?.gender ?? firstParam(searchParams.gender),
    dialColor: firstParam(searchParams.dialColor),
    dialShape: firstParam(searchParams.dialShape),
    dialType: firstParam(searchParams.dialType),
    strapColor: firstParam(searchParams.strapColor),
    strapMaterial: firstParam(searchParams.strapMaterial),
    style: firstParam(searchParams.style),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    inStock: firstParam(searchParams.inStock) === "true" || undefined,
    ...sortToQuery(firstParam(searchParams.sort)),
    page,
    limit,
  } as CatalogQuery;
}

/**
 * A stable identity for everything about a query except where in the results
 * it is.
 *
 * This is what a feed watches to know it is looking at a different listing.
 * When it changes, the accumulated products belong to the previous query and
 * have to go: keeping them would mix two catalogues in one grid. `page` and
 * `limit` are excluded for the same reason the server excludes them from its
 * cursor fingerprint -- they describe position, not identity.
 *
 * Keys are sorted so that two queries built in a different property order
 * still produce the same key.
 */
export function catalogQueryKey(query: CatalogQuery): string {
  const entries = Object.entries(query)
    .filter(
      ([key, value]) =>
        key !== "page" &&
        key !== "limit" &&
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value)])
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify(entries);
}
