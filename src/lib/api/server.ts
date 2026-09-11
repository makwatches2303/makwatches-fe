import { getApiBaseUrl, tryGetApiBaseUrl } from "@/lib/env";
import type {
  ApiResponse,
  CatalogFilters,
  CatalogQuery,
  FilterOption,
  Category,
  Collection,
  PaginationMeta,
  Product,
} from "./types";
import {
  FALLBACK_STOREFRONT,
  normalizeStorefront,
  type ProductRail,
  type StorefrontContent,
} from "./storefront";
import {
  EMPTY_HOME_CONTENT,
  normalizeHomeContent,
  type HomeContent,
} from "./home-content";
import { toQueryString } from "./client";

/**
 * Server-side data access for the storefront.
 *
 * SERVER COMPONENTS ONLY. This module is not marked with the `server-only`
 * package because adding a dependency for it was out of scope; the constraint
 * is enforced by convention and by the fact that `next: { revalidate }` is
 * meaningless in the browser. Never import this from a "use client" module --
 * use ./client there instead.
 *
 * Separate from the axios client in ./client, deliberately:
 *
 *   - It uses native fetch, so Next can cache and revalidate responses. Axios
 *     bypasses that entirely, which would make every homepage render hit the
 *     API.
 *   - It never touches localStorage or an auth token. These are public catalog
 *     reads for a page that is rendered once and served to everyone; attaching
 *     a token would both fail on the server and make the response uncacheable.
 *   - It resolves rather than throws. The homepage is composed of independent
 *     sections, and one failing endpoint must not blank the whole page -- each
 *     section falls back to empty and renders nothing.
 *
 * Anything needing per-user data or writes belongs on the client, through
 * ./client.
 */

/** How long a catalog response stays fresh, in seconds. */
const REVALIDATE_CATALOG = 300;
/** CMS content changes more often during setup, so it is refreshed sooner. */
const REVALIDATE_CONTENT = 60;

interface FetchOptions {
  revalidate?: number;
  /** Identifies the call in server logs when it fails. */
  label: string;
}

/**
 * Fetch and unwrap an API envelope, returning null on any failure.
 *
 * Failures are logged once, server-side, and swallowed. A section that gets
 * null renders its empty state; nothing is thrown into the render tree.
 */
async function getJSON<T>(
  path: string,
  { revalidate = REVALIDATE_CATALOG, label }: FetchOptions
): Promise<{ data: T; meta?: PaginationMeta } | null> {
  const base = tryGetApiBaseUrl();
  if (!base) {
    console.error(
      `[api/server] ${label}: NEXT_PUBLIC_API_BASE_URL is not set; skipping request.`
    );
    return null;
  }

  try {
    const response = await fetch(`${base}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      // 404 is a legitimate answer, not a fault: CMS records can point at a
      // product that has since been deleted, and the caller already handles a
      // null by omitting whatever the record would have populated. Logging it
      // as an error would put a permanent false alarm in the server output.
      if (response.status !== 404) {
        console.error(`[api/server] ${label}: HTTP ${response.status}`);
      }
      return null;
    }

    const body = (await response.json()) as ApiResponse<T>;
    if (body && typeof body === "object" && "success" in body && !body.success) {
      console.error(`[api/server] ${label}: ${body.message ?? "request failed"}`);
      return null;
    }

    return { data: body.data, meta: body.meta };
  } catch (error) {
    console.error(
      `[api/server] ${label}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

/** Whether the API origin is configured at all. Drives the page-level error state. */
export function isApiConfigured(): boolean {
  return tryGetApiBaseUrl() !== null;
}

/** Re-exported so server components can build absolute URLs for metadata. */
export { getApiBaseUrl };

// ── Catalog ─────────────────────────────────────────────────────────────────

export interface ProductPage {
  items: Product[];
  meta?: PaginationMeta;
  /** True when the request failed, as distinct from succeeding with no results. */
  failed: boolean;
}

/** List products. Never throws; a failure yields an empty page marked failed. */
export async function fetchProducts(
  query: CatalogQuery = {},
  label = "fetchProducts"
): Promise<ProductPage> {
  const result = await getJSON<Product[]>(
    `/api/v1/catalog/products${toQueryString(query as Record<string, unknown>)}`,
    { label }
  );

  if (!result) return { items: [], failed: true };
  return { items: result.data ?? [], meta: result.meta, failed: false };
}

/** One product by slug. Null when missing or on failure. */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const result = await getJSON<Product>(
    `/api/v1/catalog/products/slug/${encodeURIComponent(slug)}`,
    { label: `fetchProductBySlug(${slug})` }
  );
  return result?.data ?? null;
}

/** One product by id. Null when missing or on failure. */
export async function fetchProductById(id: string): Promise<Product | null> {
  const result = await getJSON<Product>(
    `/api/v1/catalog/products/${encodeURIComponent(id)}`,
    { label: `fetchProductById(${id})` }
  );
  return result?.data ?? null;
}

/** Top-level categories with their subcategories. */
export async function fetchCategories(): Promise<Category[]> {
  const result = await getJSON<Category[]>("/categories", {
    label: "fetchCategories",
  });
  return result?.data ?? [];
}

/** Editorial collections. Empty until products carry a collection value. */
export async function fetchCollections(): Promise<Collection[]> {
  const result = await getJSON<Collection[]>("/api/v1/collections", {
    label: "fetchCollections",
  });
  return result?.data ?? [];
}

/**
 * The raw shape /catalog/filters returns: plain string arrays plus numeric
 * price bounds. The UI works in FilterOption objects, so this is normalized
 * here rather than in every consumer.
 */
interface RawFilters {
  brands?: string[] | null;
  genders?: string[] | null;
  dialColors?: string[] | null;
  dialShapes?: string[] | null;
  dialTypes?: string[] | null;
  strapColors?: string[] | null;
  strapMaterials?: string[] | null;
  styles?: string[] | null;
  minPrice?: number;
  maxPrice?: number;
}

/** Drop blanks, trim, and de-duplicate case-insensitively. */
function toOptions(values: string[] | null | undefined): FilterOption[] {
  if (!values?.length) return [];

  const seen = new Map<string, string>();
  for (const raw of values) {
    const value = raw?.trim();
    if (!value) continue;
    // The catalog contains casing duplicates ("Timex" and "TIMEX"); keep the
    // first spelling encountered so the facet does not list the same brand twice.
    const key = value.toLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  }

  return Array.from(seen.values())
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value }));
}

/**
 * Facets available for a catalog scope.
 *
 * Empty facets are omitted entirely, so the filter panel renders only the
 * groups that actually have values behind them.
 */
export async function fetchFilters(
  scope: Pick<CatalogQuery, "category" | "mainCategory" | "subcategory"> = {}
): Promise<CatalogFilters> {
  const result = await getJSON<RawFilters>(
    `/catalog/filters${toQueryString(scope as Record<string, unknown>)}`,
    { label: "fetchFilters" }
  );

  const raw = result?.data ?? {};
  const filters: CatalogFilters = {};

  const assign = (key: keyof CatalogFilters, options: FilterOption[]) => {
    if (options.length > 0) {
      (filters[key] as FilterOption[]) = options;
    }
  };

  assign("brands", toOptions(raw.brands));
  assign("genders", toOptions(raw.genders));
  assign("dialColors", toOptions(raw.dialColors));
  assign("dialShapes", toOptions(raw.dialShapes));
  assign("dialTypes", toOptions(raw.dialTypes));
  assign("strapColors", toOptions(raw.strapColors));
  assign("strapMaterials", toOptions(raw.strapMaterials));
  assign("styles", toOptions(raw.styles));

  if (
    typeof raw.minPrice === "number" &&
    typeof raw.maxPrice === "number" &&
    raw.maxPrice > raw.minPrice
  ) {
    filters.priceRange = { min: raw.minPrice, max: raw.maxPrice };
  }

  return filters;
}

// ── Storefront presentation ─────────────────────────────────────────────────

/**
 * The admin-managed storefront configuration.
 *
 * Falls back to the shipped defaults when the endpoint is unreachable, so a
 * settings outage degrades the storefront to its baseline rather than blanking
 * it. The defaults keep every claim-bearing section disabled.
 */
export async function fetchStorefront(): Promise<StorefrontContent> {
  const result = await getJSON<unknown>("/api/v1/storefront", {
    label: "fetchStorefront",
    revalidate: REVALIDATE_CONTENT,
  });

  if (!result) return FALLBACK_STOREFRONT;
  return normalizeStorefront(result.data);
}

/**
 * Resolve one admin-configured rail into products.
 *
 * The rail names a selection rule, so this translates that rule into a catalog
 * query. Nothing here pins product ids: a rail keeps showing the right thing as
 * stock and the catalogue change.
 */
export async function fetchRailProducts(rail: ProductRail): Promise<ProductPage> {
  const limit = rail.limit > 0 ? rail.limit : 8;
  const base: CatalogQuery = { limit, inStock: true };

  const query: CatalogQuery = (() => {
    switch (rail.source) {
      case "featured":
        return { ...base, featured: true };
      case "bestseller":
        return { ...base, bestseller: true };
      case "newArrival":
        return { ...base, newArrival: true };
      case "category":
        return { ...base, mainCategory: rail.value };
      case "subcategory":
        return { ...base, subcategory: rail.value };
      case "collection":
        return { ...base, collection: rail.value };
      case "latest":
      default:
        return { ...base, sortBy: "createdAt", order: "desc" };
    }
  })();

  return fetchProducts(query, `rail(${rail.id})`);
}

// ── Reviews ─────────────────────────────────────────────────────────────────

/** A published product review. */
export interface ProductReview {
  id: string;
  userId?: string;
  userName?: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt?: string;
  helpfulCount?: number;
}

export interface ReviewSummary {
  reviews: ProductReview[];
  total: number;
  /** Mean rating, or null when there are no reviews to average. */
  average: number | null;
}

/**
 * Reviews for one product.
 *
 * The average is computed from the returned page rather than taken from the
 * API, which does not expose an aggregate. With no reviews the average is null,
 * not 0 -- an unrated product must not render as one star.
 */
export async function fetchProductReviews(
  productId: string
): Promise<ReviewSummary> {
  const result = await getJSON<ProductReview[]>(
    `/products/${encodeURIComponent(productId)}/reviews`,
    { label: `fetchProductReviews(${productId})` }
  );

  const reviews = result?.data ?? [];
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating > 0);

  return {
    reviews,
    total: reviews.length,
    average: rated.length
      ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
      : null,
  };
}

/**
 * Products related to another, for the PDP's closing rail.
 *
 * Narrows from the most specific real grouping outwards: collection, then
 * subcategory, then the top-level category. There is no relatedness endpoint;
 * when one exists only this function changes.
 */
export async function fetchRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const scopes: CatalogQuery[] = [];

  if (product.collection) scopes.push({ collection: product.collection });
  if (product.subcategory) scopes.push({ subcategory: product.subcategory });
  if (product.mainCategory) scopes.push({ mainCategory: product.mainCategory });

  for (const scope of scopes) {
    const page = await fetchProducts(
      { ...scope, limit: limit + 1, inStock: true },
      "fetchRelatedProducts"
    );
    const related = page.items.filter((p) => p.id !== product.id).slice(0, limit);
    if (related.length > 0) return related;
  }

  return [];
}

// ── Variants ────────────────────────────────────────────────────────────────

/**
 * One sibling colorway of a product that belongs to a variant group.
 *
 * Deliberately carries no price/discount fields -- each sibling's own product
 * page already computes its price correctly; duplicating that math here
 * would just create a second place it could drift from effectivePrice().
 */
export interface ProductVariant {
  id: string;
  slug?: string;
  name: string;
  variantLabel?: string;
  thumbnail?: string;
  inStock: boolean;
}

/**
 * Other colorways of the same product, when it belongs to a variant group.
 *
 * Never called for a product with no variantGroupId -- see ProductDetail.
 * Always fresh (stock/availability shouldn't sit behind the catalog's usual
 * cache window), and excludes the product itself, mirroring
 * fetchRelatedProducts.
 */
export async function fetchProductVariants(
  groupId: string,
  excludeId: string
): Promise<ProductVariant[]> {
  const result = await getJSON<ProductVariant[]>(
    `/api/v1/catalog/variants${toQueryString({ groupId })}`,
    { revalidate: 0, label: `fetchProductVariants(${groupId})` }
  );
  return (result?.data ?? []).filter((v) => v.id !== excludeId);
}

// ── CMS ─────────────────────────────────────────────────────────────────────

/** The admin-managed homepage content. Empty payload on failure. */
export async function fetchHomeContent(): Promise<HomeContent> {
  const result = await getJSON<unknown>("/home-content", {
    label: "fetchHomeContent",
    revalidate: REVALIDATE_CONTENT,
  });

  if (!result) return EMPTY_HOME_CONTENT;
  return normalizeHomeContent(result.data);
}

// ── Derived reads ───────────────────────────────────────────────────────────

/**
 * The most recently added products.
 *
 * Used where the reference shows "Featured". No product currently carries the
 * `featured` flag, and presenting an arbitrary selection as editorially chosen
 * would be a claim the data does not support -- so this sorts by creation date
 * and the section that uses it is labelled for what it actually is.
 */
export async function fetchLatestProducts(limit = 8): Promise<ProductPage> {
  return fetchProducts(
    { limit, sortBy: "createdAt", order: "desc", inStock: true },
    "fetchLatestProducts"
  );
}

/** In-stock products within one category path, newest first. */
export async function fetchProductsByCategory(
  category: string,
  limit = 8
): Promise<ProductPage> {
  return fetchProducts(
    { mainCategory: category, limit, sortBy: "createdAt", order: "desc", inStock: true },
    `fetchProductsByCategory(${category})`
  );
}

/**
 * Product counts per top-level category, for the category tiles.
 *
 * Issued as one request per category with limit=1, reading only the `total`
 * from the pagination metadata rather than transferring any products.
 */
export async function fetchCategoryCounts(
  categories: string[]
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    categories.map(async (name) => {
      const page = await fetchProducts(
        { mainCategory: name, limit: 1 },
        `fetchCategoryCount(${name})`
      );
      return [name, page.meta?.total ?? 0] as const;
    })
  );

  return Object.fromEntries(entries);
}
