import type { PaginationMeta, Product } from "@/lib/api/types";

/**
 * The catalog feed's state machine.
 *
 * Progressive loading is mostly a concurrency problem, not a rendering one: a
 * shopper scrolling fast, changing a filter mid-flight, or hitting a failed
 * batch produces overlapping responses that must not land in the wrong order
 * or in the wrong listing. Those rules live here, as plain functions over
 * plain state, so they can be tested without a browser, a DOM or a network.
 *
 * The React hook in useInfiniteCatalog owns the effects -- observing the
 * sentinel, issuing the request, aborting it. It owns no decisions.
 */

/**
 * How to ask for the batch after the current one.
 *
 * Keyset is the intended path and the one the API offers: a cursor names the
 * last document, so the next batch costs the same however far the shopper has
 * scrolled. The page form is a fallback for a response that reports more
 * results without handing over a cursor -- an API build that predates cursor
 * support, or a cached response from one. It is the same endpoint and the same
 * query either way.
 *
 * Modelling "how to continue" as a value rather than as a nullable cursor
 * string is the point: a feed that can only continue when it holds a cursor
 * has no way to express "there is more, and here is the other way to get it",
 * so it reports the catalogue as finished instead.
 */
export type CatalogRequest =
  | { kind: "cursor"; cursor: string }
  | { kind: "page"; page: number };

/** Identity of a request, for refusing to issue the same one twice. */
export function requestKey(request: CatalogRequest): string {
  return request.kind === "cursor" ? `cursor:${request.cursor}` : `page:${request.page}`;
}

export interface CatalogFeedState {
  /** Every product loaded for the current query, in order. */
  items: Product[];
  /**
   * How to fetch the next batch, or null at the end of the results.
   *
   * This is the feed's "is there more" in one value: null means there is
   * genuinely nothing further to ask for, not merely that this response
   * declined to say.
   */
  next: CatalogRequest | null;
  /** The request in flight, so the same one is never issued twice. */
  loading: CatalogRequest | null;
  /** Set when the last batch failed. The grid keeps its products either way. */
  error: string | null;
  /**
   * Identity of the query these products belong to.
   *
   * Every response carries the key it was requested under. A response whose
   * key no longer matches is discarded: it is the previous listing answering
   * after the shopper already moved on.
   */
  queryKey: string;
  /**
   * Monotonic id of the most recent request. A response from an older request
   * is discarded even within the same query, so a slow batch cannot overwrite
   * a newer one.
   */
  requestId: number;
}

export interface CatalogBatch {
  items: Product[];
  /** How to continue after this batch, or null if it is the last. */
  next: CatalogRequest | null;
}

/**
 * Read "how do I get the next batch" out of a listing response.
 *
 * Three sources, in order of how much the server actually committed to:
 *
 *   1. A cursor. The server handed over a position; use it.
 *   2. An explicit `hasMore: false`. The server said this is the end.
 *   3. The totals. `page * limit < total` is arithmetic the response already
 *      carries, and it is what saves the feed when an API build answers
 *      without cursor fields at all -- the case this function exists for. The
 *      first response of /shop reports 887 pieces across 24-item pages; a feed
 *      that only looked for a cursor would call that finished after one batch
 *      while the response itself says there are 36 more.
 *
 * Returning null means the feed has nothing left to ask for, which is the only
 * thing that ends it.
 */
export function nextRequestFrom(
  meta: PaginationMeta | undefined,
  batchSize: number
): CatalogRequest | null {
  if (!meta) return null;

  const cursor = meta.nextCursor?.trim();
  if (cursor) return { kind: "cursor", cursor };

  // Only an explicit false ends the feed here. `undefined` means the response
  // did not say, which is not the same answer.
  if (meta.hasMore === false) return null;

  const page = meta.page ?? 1;
  const limit = meta.limit || batchSize;
  if (typeof meta.total === "number" && page * limit < meta.total) {
    return { kind: "page", page: page + 1 };
  }

  return null;
}

/** The feed as it stands after the server rendered the first batch. */
export function initialFeedState(args: {
  items: Product[];
  next: CatalogRequest | null;
  queryKey: string;
}): CatalogFeedState {
  return {
    items: args.items,
    next: args.next,
    loading: null,
    error: null,
    queryKey: args.queryKey,
    requestId: 0,
  };
}

/**
 * Whether a request for the next batch should be issued.
 *
 * Every reason not to, in one place, because the sentinel fires far more often
 * than a batch is wanted -- on every scroll that keeps it in view, on resize,
 * and again the moment a batch renders and the sentinel moves.
 */
export function shouldLoadMore(state: CatalogFeedState): boolean {
  if (state.next === null) return false;
  // One batch in flight at a time: prefetch the next batch, never several.
  if (state.loading !== null) return false;
  // A failed batch waits for an explicit retry. Without this the observer
  // would re-fire against a broken endpoint on every scroll event.
  if (state.error !== null) return false;
  return true;
}

/** Mark the next batch as in flight and claim a request id for it. */
export function startLoading(state: CatalogFeedState): CatalogFeedState {
  if (!shouldLoadMore(state)) return state;
  return {
    ...state,
    loading: state.next,
    error: null,
    requestId: state.requestId + 1,
  };
}

/**
 * Apply a batch that arrived successfully.
 *
 * Stale responses are dropped rather than merged. Two ways a response goes
 * stale: the shopper changed the listing (queryKey moved on), or a newer
 * request for this same listing has already been issued (requestId moved on).
 * Either way the batch describes a window of results the feed is no longer
 * showing.
 */
export function receiveBatch(
  state: CatalogFeedState,
  received: { queryKey: string; requestId: number; batch: CatalogBatch }
): CatalogFeedState {
  if (received.queryKey !== state.queryKey) return state;
  if (received.requestId !== state.requestId) return state;

  // Guard against a batch that overlaps what the feed already holds. A product
  // added to the catalogue mid-scroll shifts page-mode windows by one, and
  // appending the overlap would duplicate both the product and its React key.
  const seen = new Set(state.items.map((item) => item.id));
  const fresh = received.batch.items.filter((item) => !seen.has(item.id));

  return {
    ...state,
    items: fresh.length > 0 ? [...state.items, ...fresh] : state.items,
    next: received.batch.next,
    loading: null,
    error: null,
  };
}

/**
 * Apply a failed batch.
 *
 * The products already on screen stay. A shopper who scrolled through two
 * hundred watches should not lose them because the two hundred and first batch
 * timed out; `next` is kept so retrying asks for the same batch again rather
 * than skipping it.
 */
export function receiveError(
  state: CatalogFeedState,
  received: { queryKey: string; requestId: number; message: string }
): CatalogFeedState {
  if (received.queryKey !== state.queryKey) return state;
  if (received.requestId !== state.requestId) return state;

  return { ...state, loading: null, error: received.message };
}

/** Clear the error so the sentinel -- or a retry button -- can try again. */
export function retry(state: CatalogFeedState): CatalogFeedState {
  if (state.error === null) return state;
  return { ...state, error: null };
}

/**
 * Start over for a different listing.
 *
 * The request id carries across rather than resetting to zero: a response from
 * the previous query could still be in flight, and reusing its id would make
 * that response look current.
 */
export function resetFeed(
  state: CatalogFeedState,
  next: { items: Product[]; next: CatalogRequest | null; queryKey: string }
): CatalogFeedState {
  return {
    items: next.items,
    next: next.next,
    loading: null,
    error: null,
    queryKey: next.queryKey,
    requestId: state.requestId + 1,
  };
}
