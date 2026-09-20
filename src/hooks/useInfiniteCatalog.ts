"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchCatalogBatch, CatalogFetchError } from "@/lib/api/catalog-client";
import type { CatalogQuery, Product } from "@/lib/api/types";
import { catalogQueryKey } from "@/lib/catalog-query";
import {
  initialFeedState,
  receiveBatch,
  receiveError,
  resetFeed,
  retry as clearError,
  shouldLoadMore,
  startLoading,
  type CatalogFeedState,
  type CatalogRequest,
} from "@/lib/catalog-feed";

/**
 * Progressive catalog loading, shared by every listing that offers it.
 *
 * The listing pages pass their own scope and nothing else; /men, /women and
 * /shop differ by a query, not by an implementation.
 *
 * The first batch is not fetched here. It is rendered on the server and handed
 * in, which is what keeps the page shareable, indexable and free of a
 * render-then-fetch flash. This hook only ever loads what comes after it.
 *
 * Every decision about what to load and what to keep lives in
 * @/lib/catalog-feed as pure functions over plain state. What is left here is
 * the effects: the request, the abort, and starting over when the shopper
 * changes the listing.
 */

export interface UseInfiniteCatalogArgs {
  /** The server-rendered first batch. */
  initialProducts: Product[];
  /**
   * How to fetch the batch after the server-rendered one, or null when the
   * first response was the whole listing. Derived from that response by
   * nextRequestFrom, the same way every later batch is.
   */
  initialNext: CatalogRequest | null;
  /** The query the first batch was fetched with. */
  query: CatalogQuery;
}

export interface UseInfiniteCatalog {
  products: Product[];
  /** True while a batch is in flight. */
  loading: boolean;
  /** Set when the last batch failed; the products already loaded are kept. */
  error: string | null;
  /** False once the catalogue is exhausted. */
  hasMore: boolean;
  /** Ask for the next batch. Safe to call on every scroll event. */
  loadMore: () => void;
  /** Retry the batch that failed. */
  retry: () => void;
}

export function useInfiniteCatalog({
  initialProducts,
  initialNext,
  query,
}: UseInfiniteCatalogArgs): UseInfiniteCatalog {
  const queryKey = useMemo(() => catalogQueryKey(query), [query]);

  const [state, setState] = useState<CatalogFeedState>(() =>
    initialFeedState({ items: initialProducts, next: initialNext, queryKey })
  );

  /*
    A mirror of the state, so loadMore can decide and claim the next batch
    synchronously.

    The decision cannot live inside a setState updater: React invokes updaters
    twice in development StrictMode, and an updater that issues a request would
    issue two. Reading and writing this ref instead means a second call in the
    same tick sees the batch already claimed and does nothing, which is the
    whole point of the deduplication.
  */
  const stateRef = useRef(state);
  stateRef.current = state;

  // The in-flight request, so a listing change can cancel it rather than let
  // it land. The state machine would discard a stale response anyway; aborting
  // means not paying to download it.
  const inFlight = useRef<AbortController | null>(null);

  // Read inside loadMore without making it depend on the query object, which
  // the parent rebuilds on every render.
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const loadMore = useCallback(() => {
    const current = stateRef.current;
    // Not starting a request is the normal case: the sentinel fires on every
    // scroll that keeps it in view, on resize, and again whenever a batch
    // renders and moves it.
    if (!shouldLoadMore(current)) return;

    const next = startLoading(current);
    // Claimed before the render, so a second call in this tick is refused.
    stateRef.current = next;
    setState(next);

    const controller = new AbortController();
    inFlight.current = controller;

    const { queryKey: key, requestId, loading: request } = next;
    // loading is non-null whenever shouldLoadMore passed.
    void fetchCatalogBatch(queryRef.current, request!, controller.signal)
      .then((batch) => {
        setState((latest) => receiveBatch(latest, { queryKey: key, requestId, batch }));
      })
      .catch((error: unknown) => {
        // An abort is this hook's own doing: the listing moved on, and there
        // is no failure to report to the shopper.
        if (error instanceof DOMException && error.name === "AbortError") return;

        const message =
          error instanceof CatalogFetchError && error.invalidCursor
            ? "This list has moved on. Reload the page to keep browsing."
            : "Could not load more pieces.";

        setState((latest) => receiveError(latest, { queryKey: key, requestId, message }));
      })
      .finally(() => {
        if (inFlight.current === controller) inFlight.current = null;
      });
  }, []);

  const retry = useCallback(() => {
    const cleared = clearError(stateRef.current);
    if (cleared === stateRef.current) return;

    stateRef.current = cleared;
    setState(cleared);
    // `next` was kept through the failure, so this asks for the batch that
    // failed rather than skipping past it. Requested here rather than waiting
    // for the observer, which will not fire again if the sentinel never moved.
    loadMore();
  }, [loadMore]);

  /*
    A filter, sort or search change is a navigation: the server re-renders the
    listing and hands down a new first batch. That is the signal to start over
    -- drop the products from the previous query, take the new cursor, and
    abandon anything in flight.

    Keyed on queryKey rather than on the products array, because the same query
    re-rendering must not wipe the batches already appended to it.
  */
  useEffect(() => {
    if (stateRef.current.queryKey === queryKey) return;

    inFlight.current?.abort();
    inFlight.current = null;

    const fresh = resetFeed(stateRef.current, {
      items: initialProducts,
      next: initialNext,
      queryKey,
    });
    stateRef.current = fresh;
    setState(fresh);
    // initialProducts is a fresh array identity on every server render; the
    // query key is what actually says the listing changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Abandon any in-flight request when the listing unmounts.
  useEffect(() => () => inFlight.current?.abort(), []);

  return {
    products: state.items,
    loading: state.loading !== null,
    error: state.error,
    // There is more exactly when there is something left to ask for.
    hasMore: state.next !== null,
    loadMore,
    retry,
  };
}
