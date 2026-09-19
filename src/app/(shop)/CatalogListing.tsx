import { Suspense } from "react";

import {
  Container,
  ErrorState,
  Eyebrow,
  Heading,
  Pagination,
  Section,
  Text,
} from "@/design-system";
import {
  CatalogSearch,
  ProductGrid,
  ShopControls,
  ShopSort,
} from "@/components/commerce";
import {
  fetchFilters,
  fetchProducts,
  isApiConfigured,
} from "@/lib/api/server";
import type { CatalogQuery } from "@/lib/api/types";

/**
 * The shared catalog listing.
 *
 * Every Phase 3 route -- /shop, /men, /women, /collections/[slug],
 * /category/[slug] -- renders this with a different scope. One implementation
 * means filtering, sorting, pagination and empty states can never drift apart
 * between them.
 *
 * A server component. Products and facets are fetched on the server from the
 * URL's search params, so a filtered view is fully rendered before it reaches
 * the browser and is shareable as a link. Only the controls are interactive.
 */

/** Products per page. */
const PAGE_SIZE = 24;

export interface CatalogListingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /**
   * The scope this listing is locked to -- a gender, a category path, a
   * collection. Shoppers filter *within* it and can never filter out of it.
   */
  scope?: Pick<CatalogQuery, "category" | "mainCategory" | "subcategory" | "collection" | "gender">;
  /** Query params that define the scope and survive a filter reset. */
  lockedParams?: string[];
  /** Raw search params from the route. */
  searchParams: Record<string, string | string[] | undefined>;
  /** Base path used to build pagination links. */
  basePath: string;
  /**
   * Render an in-listing search box above the results.
   *
   * Opt-in, and scoped by construction: the box only writes `q` into this
   * URL, which is then fetched together with this listing's own `scope`, so a
   * search here can never reach outside the collection being viewed.
   */
  searchLabel?: string;
  /** Placeholder for the search box. Falls back to `searchLabel`. */
  searchPlaceholder?: string;
}

/** First value of a possibly-repeated search param. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Translate the URL's sort key into catalog query fields. */
function sortToQuery(sort: string | undefined): Pick<CatalogQuery, "sortBy" | "order"> {
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

/** Build the catalog query from the URL. */
function queryFromParams(
  searchParams: CatalogListingProps["searchParams"],
  scope: CatalogListingProps["scope"]
): CatalogQuery {
  const num = (key: string) => {
    const raw = first(searchParams[key]);
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };

  const page = Math.max(1, num("page") ?? 1);
  const brand = first(searchParams.brand);

  return {
    ...scope,
    // Free-text search shares the listing, so /shop?q=… works without a
    // separate route.
    q: first(searchParams.q),
    // A brand filter is multi-select and arrives comma-separated.
    ...(brand ? { brand } : {}),
    gender: scope?.gender ?? first(searchParams.gender),
    dialColor: first(searchParams.dialColor),
    dialShape: first(searchParams.dialShape),
    dialType: first(searchParams.dialType),
    strapColor: first(searchParams.strapColor),
    strapMaterial: first(searchParams.strapMaterial),
    style: first(searchParams.style),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    inStock: first(searchParams.inStock) === "true" || undefined,
    ...sortToQuery(first(searchParams.sort)),
    page,
    limit: PAGE_SIZE,
  } as CatalogQuery;
}

export async function CatalogListing({
  eyebrow,
  title,
  description,
  scope,
  lockedParams = [],
  searchParams,
  basePath,
  searchLabel,
  searchPlaceholder,
}: CatalogListingProps) {
  if (!isApiConfigured()) {
    return (
      <Section spacing="loose">
        <Container>
          <ErrorState
            title="The storefront is not configured."
            description="NEXT_PUBLIC_API_BASE_URL is not set, so the catalog cannot be reached."
          />
        </Container>
      </Section>
    );
  }

  const query = queryFromParams(searchParams, scope);

  // Facets are scoped to the listing, not the whole catalog, so /men never
  // offers a filter that would return nothing.
  const [page, filters] = await Promise.all([
    fetchProducts(query, `catalog(${basePath})`),
    fetchFilters({
      category: scope?.category,
      mainCategory: scope?.mainCategory,
      subcategory: scope?.subcategory,
    }),
  ]);

  const total = page.meta?.total ?? 0;
  const totalPages = page.meta?.pages ?? 1;
  const currentPage = page.meta?.page ?? 1;

  /** Preserve every param except the page number when paginating. */
  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      const single = first(value);
      if (single && key !== "page") params.set(key, single);
    }
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <>
      <Section spacing="tight" className="border-b-2 border-mak-line">
        <Container>
          {eyebrow ? <Eyebrow withRule className="mb-4">{eyebrow}</Eyebrow> : null}
          <Heading level="display" as="h1">
            {title}
          </Heading>
          {description ? (
            <Text size="lead" tone="muted" className="mt-4 max-w-2xl">
              {description}
            </Text>
          ) : null}
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-12">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <ShopControls
                filters={filters}
                resultCount={total}
                lockedParams={lockedParams}
              />
            </aside>

            <div className="min-w-0">
              {searchLabel ? (
                <div className="mb-6">
                  {/*
                    Suspense because CatalogSearch reads the URL through
                    useSearchParams; without a boundary a statically rendered
                    listing would have to bail out to client rendering
                    wholesale.
                  */}
                  <Suspense
                    fallback={
                      <div className="h-11 w-full border-2 border-mak-divider bg-mak-bg" />
                    }
                  >
                    <CatalogSearch
                      label={searchLabel}
                      placeholder={searchPlaceholder}
                    />
                  </Suspense>
                </div>
              ) : null}

              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-mak-line pb-4">
                <Text size="small" tone="muted" aria-live="polite">
                  {page.failed
                    ? "Results unavailable"
                    : `${total.toLocaleString("en-IN")} ${total === 1 ? "piece" : "pieces"}`}
                </Text>
                <ShopSort />
              </div>

              {page.failed ? (
                <ErrorState
                  title="Products could not be loaded."
                  description="The catalog is temporarily unavailable. Please refresh and try again."
                />
              ) : (
                <>
                  <ProductGrid
                    products={page.items}
                    priorityCount={4}
                    emptyTitle="Nothing matches yet."
                    emptyDescription="Try removing a filter, or widening the price range."
                  />

                  {totalPages > 1 ? (
                    <Pagination
                      page={currentPage}
                      totalPages={totalPages}
                      hrefFor={hrefFor}
                      className="mt-12"
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
