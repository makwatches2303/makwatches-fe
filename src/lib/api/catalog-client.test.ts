import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import { CatalogFetchError, fetchCatalogBatch } from "@/lib/api/catalog-client";
import type { CatalogQuery } from "@/lib/api/types";

/**
 * The browser-side batch request, against a stubbed fetch.
 *
 * No server is started and no real request leaves the process: every case here
 * is about the request this builds and what it makes of the answer.
 */

const query: CatalogQuery = {
  mainCategory: "Men",
  sortBy: "createdAt",
  order: "desc",
  page: 3,
  limit: 24,
};

/** The last URL the stub was called with. */
let lastUrl = "";

function stubFetch(response: {
  ok?: boolean;
  status?: number;
  body?: unknown;
}) {
  mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    lastUrl = String(input);
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.body ?? { success: true, data: [], meta: {} },
    } as Response;
  });
}

beforeEach(() => {
  lastUrl = "";
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.test";
});

afterEach(() => {
  mock.restoreAll();
});

describe("fetchCatalogBatch", () => {
  it("sends the cursor and the whole query context", async () => {
    stubFetch({});
    await fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" });

    const url = new URL(lastUrl);
    assert.equal(url.pathname, "/api/v1/catalog/products");
    assert.equal(url.searchParams.get("cursor"), "CURSOR-1");
    // Preserving the scope and sort is what makes the server accept the
    // cursor at all: it fingerprints them and rejects a mismatch.
    assert.equal(url.searchParams.get("mainCategory"), "Men");
    assert.equal(url.searchParams.get("sortBy"), "createdAt");
    assert.equal(url.searchParams.get("order"), "desc");
  });

  it("drops the page number", async () => {
    // A cursor already says where the batch starts. Sending both invites the
    // server to disagree with itself.
    stubFetch({});
    await fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" });

    assert.equal(new URL(lastUrl).searchParams.get("page"), null);
  });

  it("reads the next cursor and hasMore from the envelope", async () => {
    stubFetch({
      body: {
        success: true,
        data: [{ id: "1" }, { id: "2" }],
        meta: { hasMore: true, nextCursor: "CURSOR-2" },
      },
    });

    const batch = await fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" });
    assert.equal(batch.items.length, 2);
    assert.deepEqual(batch.next, { kind: "cursor", cursor: "CURSOR-2" });
  });

  it("reports the end of the results", async () => {
    stubFetch({ body: { success: true, data: [{ id: "9" }], meta: { hasMore: false } } });

    const batch = await fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" });
    assert.equal(batch.next, null);
  });

  it("falls back to the next page when the response carries no cursor", async () => {
    // The failure this guards: an API build without cursor support answered
    // /shop with 887 pieces, and the feed stopped after the first 24.
    stubFetch({
      body: {
        success: true,
        data: [{ id: "1" }],
        meta: { page: 2, limit: 24, total: 887, pages: 37 },
      },
    });

    const batch = await fetchCatalogBatch(query, { kind: "page", page: 2 });
    assert.deepEqual(batch.next, { kind: "page", page: 3 });
  });

  it("sends a page request as a page, with no cursor", async () => {
    stubFetch({});
    await fetchCatalogBatch(query, { kind: "page", page: 4 });

    const url = new URL(lastUrl);
    assert.equal(url.searchParams.get("page"), "4");
    assert.equal(url.searchParams.get("cursor"), null);
    // The scope still travels, so the fallback stays inside the listing.
    assert.equal(url.searchParams.get("mainCategory"), "Men");
  });

  it("flags a rejected cursor separately from a failure", async () => {
    // 400 means the cursor no longer matches its query. Retrying it would
    // fail identically, so the UI says so rather than offering a retry.
    stubFetch({ ok: false, status: 400 });

    await assert.rejects(
      () => fetchCatalogBatch(query, { kind: "cursor", cursor: "STALE" }),
      (error: unknown) => {
        assert.ok(error instanceof CatalogFetchError);
        assert.equal(error.invalidCursor, true);
        return true;
      }
    );
  });

  it("treats a server error as retryable", async () => {
    stubFetch({ ok: false, status: 503 });

    await assert.rejects(
      () => fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" }),
      (error: unknown) => {
        assert.ok(error instanceof CatalogFetchError);
        assert.equal(error.invalidCursor, false);
        return true;
      }
    );
  });

  it("surfaces an unsuccessful envelope", async () => {
    stubFetch({ body: { success: false, message: "Invalid or expired cursor" } });

    await assert.rejects(
      () => fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" }),
      /Invalid or expired cursor/
    );
  });

  it("re-throws an abort untouched", async () => {
    // The hook aborts in flight requests when the listing changes. That is not
    // a failed batch and must not be reported as one.
    mock.method(globalThis, "fetch", async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    await assert.rejects(
      () => fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" }),
      (error: unknown) => {
        assert.ok(error instanceof DOMException, "an abort must not become a CatalogFetchError");
        assert.equal(error.name, "AbortError");
        return true;
      }
    );
  });

  it("fails clearly when the API origin is unset", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    stubFetch({});

    await assert.rejects(() => fetchCatalogBatch(query, { kind: "cursor", cursor: "CURSOR-1" }), CatalogFetchError);
  });
});
