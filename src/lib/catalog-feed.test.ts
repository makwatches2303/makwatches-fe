import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PaginationMeta, Product } from "@/lib/api/types";
import {
  initialFeedState,
  nextRequestFrom,
  receiveBatch,
  receiveError,
  resetFeed,
  retry,
  shouldLoadMore,
  startLoading,
  type CatalogFeedState,
  type CatalogRequest,
} from "@/lib/catalog-feed";

/**
 * The feed's concurrency rules, tested without a browser.
 *
 * These are the cases that are hard to reproduce by hand and expensive to get
 * wrong: a shopper scrolling faster than the network answers, a filter changed
 * mid-request, a batch that fails halfway down a long scroll.
 */

function product(id: string): Product {
  // Only the fields the feed itself touches. It dedupes by id and otherwise
  // passes products straight through to the grid.
  return { id, name: `Watch ${id}`, price: 1000 } as Product;
}

function feed(overrides: Partial<CatalogFeedState> = {}): CatalogFeedState {
  return {
    ...initialFeedState({
      items: [product("1"), product("2")],
      next: { kind: "cursor", cursor: "cursor-2" },
      queryKey: "men",
    }),
    ...overrides,
  };
}

describe("shouldLoadMore", () => {
  it("asks for a batch when there is one to ask for", () => {
    assert.equal(shouldLoadMore(feed()), true);
  });

  it("stops at the end of the results", () => {
    assert.equal(shouldLoadMore(feed({ next: null })), false);
  });

  it("does not stack requests while one is in flight", () => {
    // The sentinel fires on every scroll event that keeps it in view. Without
    // this the feed would request four batches for one flick of the thumb.
    assert.equal(
      shouldLoadMore(feed({ loading: { kind: "cursor", cursor: "cursor-2" } })),
      false
    );
  });

  it("waits for a retry after a failure", () => {
    // Otherwise the observer hammers a failing endpoint on every scroll.
    assert.equal(shouldLoadMore(feed({ error: "Could not load more pieces." })), false);
  });
});

describe("request deduplication", () => {
  it("never issues the same cursor twice at once", () => {
    const first = startLoading(feed());
    assert.deepEqual(first.loading, { kind: "cursor", cursor: "cursor-2" });

    // A second sentinel crossing while the first batch is still out.
    const second = startLoading(first);
    assert.equal(second, first, "a second call must not start another request");
    assert.equal(second.requestId, first.requestId, "and must not claim a new id");
  });

  it("claims a new request id per started request", () => {
    const first = startLoading(feed());
    const settled = receiveBatch(first, {
      queryKey: first.queryKey,
      requestId: first.requestId,
      batch: { items: [product("3")], next: { kind: "cursor", cursor: "cursor-3" } },
    });
    const second = startLoading(settled);

    assert.equal(second.requestId, first.requestId + 1);
  });
});

describe("race protection", () => {
  it("ignores a response from a superseded request", () => {
    const inFlight = startLoading(feed());

    // The shopper changed a filter and changed it back: same query key, but a
    // newer request is out. The older response must not land.
    const newer = { ...inFlight, loading: null, requestId: inFlight.requestId + 1 };

    const after = receiveBatch(newer, {
      queryKey: newer.queryKey,
      requestId: inFlight.requestId,
      batch: { items: [product("stale")], next: { kind: "cursor", cursor: "stale" } },
    });

    assert.deepEqual(after, newer, "the stale batch must be discarded whole");
  });

  it("ignores a response belonging to a previous listing", () => {
    const inFlight = startLoading(feed());
    // Men's request is still out when the shopper navigates to Women.
    const women = resetFeed(inFlight, {
      items: [product("w1")],
      next: { kind: "cursor", cursor: "w-cursor" },
      queryKey: "women",
    });

    const after = receiveBatch(women, {
      queryKey: "men",
      requestId: inFlight.requestId,
      batch: { items: [product("m3")], next: { kind: "cursor", cursor: "m-3" } },
    });

    assert.deepEqual(after.items.map((p) => p.id), ["w1"], "men's batch must not enter women's grid");
  });

  it("ignores a stale failure", () => {
    const inFlight = startLoading(feed());
    const newer = { ...inFlight, requestId: inFlight.requestId + 1 };

    const after = receiveError(newer, {
      queryKey: newer.queryKey,
      requestId: inFlight.requestId,
      message: "boom",
    });

    assert.equal(after.error, null, "an abandoned request must not raise an error");
  });
});

describe("receiving a batch", () => {
  it("appends and advances the cursor", () => {
    const loading = startLoading(feed());
    const after = receiveBatch(loading, {
      queryKey: loading.queryKey,
      requestId: loading.requestId,
      batch: {
        items: [product("3"), product("4")],
        next: { kind: "cursor", cursor: "cursor-4" },
      },
    });

    assert.deepEqual(after.items.map((p) => p.id), ["1", "2", "3", "4"]);
    assert.deepEqual(after.next, { kind: "cursor", cursor: "cursor-4" });
    assert.equal(after.loading, null);
  });

  it("drops products it already holds", () => {
    // A cursor answered with an overlapping window would otherwise grow the
    // grid with duplicates, and duplicate React keys with it.
    const loading = startLoading(feed());
    const after = receiveBatch(loading, {
      queryKey: loading.queryKey,
      requestId: loading.requestId,
      batch: { items: [product("2"), product("3")], next: { kind: "cursor", cursor: "c3" } },
    });

    assert.deepEqual(after.items.map((p) => p.id), ["1", "2", "3"]);
  });
});

describe("end of results", () => {
  it("stops when the batch reports nothing further", () => {
    const loading = startLoading(feed());
    const after = receiveBatch(loading, {
      queryKey: loading.queryKey,
      requestId: loading.requestId,
      batch: { items: [product("3")], next: null },
    });

    assert.equal(after.next, null);
    assert.equal(shouldLoadMore(after), false);
  });
});

describe("a failed batch", () => {
  it("keeps every product already loaded", () => {
    const loading = startLoading(feed());
    const after = receiveError(loading, {
      queryKey: loading.queryKey,
      requestId: loading.requestId,
      message: "Could not load more pieces.",
    });

    assert.deepEqual(after.items.map((p) => p.id), ["1", "2"], "the grid must not blank");
    assert.equal(after.error, "Could not load more pieces.");
    assert.equal(after.loading, null);
  });

  it("retries the batch that failed rather than skipping it", () => {
    const loading = startLoading(feed());
    const failed = receiveError(loading, {
      queryKey: loading.queryKey,
      requestId: loading.requestId,
      message: "boom",
    });

    assert.deepEqual(
      failed.next,
      { kind: "cursor", cursor: "cursor-2" },
      "the position must survive the failure"
    );

    const cleared = retry(failed);
    assert.equal(cleared.error, null);
    assert.equal(shouldLoadMore(cleared), true);
    assert.deepEqual(startLoading(cleared).loading, { kind: "cursor", cursor: "cursor-2" });
  });
});

describe("changing the listing", () => {
  it("clears the products and takes the new first batch", () => {
    const loaded = receiveBatch(startLoading(feed()), {
      queryKey: "men",
      requestId: 1,
      batch: { items: [product("3")], next: { kind: "cursor", cursor: "cursor-3" } },
    });

    const filtered = resetFeed(loaded, {
      items: [product("f1")],
      next: { kind: "cursor", cursor: "f-cursor" },
      queryKey: "men+fastrack",
    });

    assert.deepEqual(filtered.items.map((p) => p.id), ["f1"]);
    assert.deepEqual(filtered.next, { kind: "cursor", cursor: "f-cursor" });
    assert.equal(filtered.error, null);
    assert.equal(filtered.loading, null);
  });

  it("advances the request id so an in-flight response cannot land", () => {
    const inFlight = startLoading(feed());
    const next = resetFeed(inFlight, { items: [], next: null, queryKey: "other" });

    assert.ok(
      next.requestId > inFlight.requestId,
      "reusing an id would make the previous query's response look current"
    );
  });
});

describe("nextRequestFrom", () => {
  /*
    The regression this function exists for.

    /shop answered with 887 pieces across 24-item pages, and the feed rendered
    "That is every piece in this selection." under the first 24. The response
    said page 1 of 37; the reader only looked for a cursor, found none, and
    treated silence as "no more results".
  */
  it("keeps going when the response reports a total but no cursor", () => {
    const next = nextRequestFrom({ page: 1, limit: 24, total: 887, pages: 37 }, 24);
    assert.deepEqual(next, { kind: "page", page: 2 });
  });

  it("prefers a cursor when the server offers one", () => {
    const next = nextRequestFrom(
      { page: 1, limit: 24, total: 887, hasMore: true, nextCursor: "CURSOR-2" },
      24
    );
    assert.deepEqual(next, { kind: "cursor", cursor: "CURSOR-2" });
  });

  it("treats an empty cursor as no cursor", () => {
    // The API sends nextCursor: "" rather than omitting it at the end of the
    // results, and a blank string must not become a request.
    const next = nextRequestFrom(
      { page: 1, limit: 24, total: 887, hasMore: true, nextCursor: "   " },
      24
    );
    assert.deepEqual(next, { kind: "page", page: 2 });
  });

  it("ends only when the server actually says so", () => {
    assert.equal(nextRequestFrom({ page: 37, limit: 24, total: 887 }, 24), null);
    assert.equal(nextRequestFrom({ page: 2, limit: 24, hasMore: false }, 24), null);
    assert.equal(nextRequestFrom({ page: 1, limit: 24, total: 24 }, 24), null);
  });

  it("continues from the page it was actually served", () => {
    const next = nextRequestFrom({ page: 5, limit: 24, total: 887 }, 24);
    assert.deepEqual(next, { kind: "page", page: 6 });
  });

  it("does not invent a request it cannot make", () => {
    // hasMore with neither a cursor nor a total is unactionable; spinning the
    // observer against a request that cannot be formed helps nobody.
    assert.equal(nextRequestFrom({ page: 1, limit: 24, hasMore: true }, 24), null);
    assert.equal(nextRequestFrom(undefined, 24), null);
  });
});

describe("loading a catalogue end to end", () => {
  /**
   * Drive the feed the way the browser does, against a stubbed catalogue:
   * every batch is whatever the previous response said to ask for.
   */
  function drive(
    total: number,
    batchSize: number,
    serve: (request: CatalogRequest | null) => { items: Product[]; meta: PaginationMeta }
  ) {
    const first = serve(null);
    let state = initialFeedState({
      items: first.items,
      next: nextRequestFrom(first.meta, batchSize),
      queryKey: "shop",
    });

    const requested: CatalogRequest[] = [];
    const sizes = [state.items.length];

    // Bounded so a feed that never terminates fails the test rather than
    // hanging it.
    for (let guard = 0; guard < total; guard += 1) {
      if (!shouldLoadMore(state)) break;

      state = startLoading(state);
      requested.push(state.loading!);

      const response = serve(state.loading);
      state = receiveBatch(state, {
        queryKey: state.queryKey,
        requestId: state.requestId,
        batch: { items: response.items, next: nextRequestFrom(response.meta, batchSize) },
      });
      sizes.push(state.items.length);
    }

    return { state, requested, sizes };
  }

  /** A catalogue served by cursor, the way the current API answers. */
  function cursorCatalogue(total: number, batchSize: number) {
    return (request: CatalogRequest | null) => {
      const offset = request?.kind === "cursor" ? Number(request.cursor) : 0;
      const items = Array.from(
        { length: Math.min(batchSize, total - offset) },
        (_, i) => product(String(offset + i))
      );
      const consumed = offset + items.length;
      const more = consumed < total;

      return {
        items,
        meta: {
          page: 1,
          limit: batchSize,
          ...(request === null ? { total, pages: Math.ceil(total / batchSize) } : {}),
          hasMore: more,
          nextCursor: more ? String(consumed) : "",
        } as PaginationMeta,
      };
    };
  }

  it("loads 24 -> 48 -> 72 -> 96 by cursor", () => {
    const { state, requested, sizes } = drive(100, 24, cursorCatalogue(100, 24));

    assert.deepEqual(sizes.slice(0, 5), [24, 48, 72, 96, 100]);
    assert.equal(state.next, null, "the feed must end at the last batch");
    assert.equal(state.items.length, 100);

    // Every product exactly once, in catalogue order.
    assert.equal(new Set(state.items.map((p) => p.id)).size, 100);
    assert.deepEqual(state.items.map((p) => p.id).slice(0, 3), ["0", "1", "2"]);

    // The cursor moved on every batch; repeating one would re-serve a window.
    const cursors = requested.map((r) => (r.kind === "cursor" ? r.cursor : r.page));
    assert.equal(new Set(cursors).size, cursors.length, "no cursor was requested twice");
  });

  /*
    The same catalogue from an API that answers without cursor fields -- the
    build that produced the bug. The feed has to walk it by page instead of
    stopping at 24.
  */
  function pageCatalogue(total: number, batchSize: number) {
    return (request: CatalogRequest | null) => {
      const page = request?.kind === "page" ? request.page : 1;
      const offset = (page - 1) * batchSize;
      return {
        items: Array.from(
          { length: Math.max(0, Math.min(batchSize, total - offset)) },
          (_, i) => product(String(offset + i))
        ),
        meta: {
          page,
          limit: batchSize,
          total,
          pages: Math.ceil(total / batchSize),
        } as PaginationMeta,
      };
    };
  }

  it("loads 24 -> 48 -> 72 -> 96 by page when the API offers no cursor", () => {
    const { state, requested, sizes } = drive(887, 24, pageCatalogue(887, 24));

    assert.deepEqual(sizes.slice(0, 4), [24, 48, 72, 96]);
    assert.equal(state.items.length, 887, "the whole catalogue must be reachable");
    assert.equal(state.next, null);
    assert.deepEqual(requested[0], { kind: "page", page: 2 });

    const pages = requested.map((r) => (r.kind === "page" ? r.page : -1));
    assert.equal(new Set(pages).size, pages.length, "no page was requested twice");
  });

  it("stops without a request when the first batch is the whole listing", () => {
    const { state, requested } = drive(10, 24, cursorCatalogue(10, 24));

    assert.equal(state.items.length, 10);
    assert.deepEqual(requested, [], "a complete first batch must not ask for another");
  });
});
