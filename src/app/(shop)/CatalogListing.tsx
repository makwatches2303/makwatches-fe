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
  ProductFeed,
  ProductGrid,
  ShopControls,
  ShopSort,
} from "@/components/commerce";
import {
  fetchFilters,
  fetchProducts,
  isApiConfigured,
} from "@/lib/api/server";
import {
  CATALOG_PAGE_SIZE,
  catalogQueryFromParams,
  firstParam,
  type CatalogScope,
} from "@/lib/catalog-query";
import { nextRequestFrom } from "@/lib/catalog-feed";

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

export interface CatalogListingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /**
   * The scope this listing is locked to -- a gender, a category path, a
   * collection. Shoppers filter *within* it and can never filter out of it.
   */
  scope?: CatalogScope;
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
  /**
   * Keep loading as the shopper scrolls, instead of numbering pages.
   *
   * Opt-in per route. The listings a shopper browses open-endedly -- /shop,
   * /men, /women -- turn it on; the ones they arrive at with something
   * specific in mind keep numbered pages, which link to a position in a way a
   * scroll does not.
   *
   * Either way the first batch is the same server-rendered grid, so the page
   * is identical to a crawler and to a browser with no JavaScript.
   */
  infinite?: boolean;
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
  infinite = false,
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

  const query = catalogQueryFromParams(searchParams, scope, CATALOG_PAGE_SIZE);

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

  /*
    How the feed continues past the server-rendered batch, read from the same
    response the grid above was built from -- so it starts loading without
    first re-fetching what is already on screen.

    Derived by the same function the browser uses on every later batch. Reading
    the response in two places was what broke this once already: the server
    looked only for a cursor and called an 887-piece listing finished after 24.
  */
  const initialNext = nextRequestFrom(page.meta, CATALOG_PAGE_SIZE);

  /*
    Progressive loading is offered only where the route asked for it, and only
    from the first page. Landing on ?page=3 means arriving at a bookmark or a
    crawler's link into the middle of the catalogue; continuing to scroll from
    there would build a grid whose beginning is missing. Those requests keep
    the numbered pages that produced them.
  */
  const feed = infinite && currentPage === 1;

  /** Preserve every param except the page number when paginating. */
  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      const single = firstParam(value);
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
              ) : feed ? (
                /*
                  The feed is handed the server-rendered batch rather than
                  fetching its own, so this renders exactly the grid the
                  paginated branch would and only then starts growing it.
                */
                <ProductFeed
                  initialProducts={page.items}
                  initialNext={initialNext}
                  query={query}
                  priorityCount={4}
                  emptyTitle="Nothing matches yet."
                  emptyDescription="Try removing a filter, or widening the price range."
                  listName={basePath}
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
