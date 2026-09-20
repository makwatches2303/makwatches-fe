import { toQueryString } from "@/lib/api/query-string";
import type { ApiResponse, CatalogQuery, Product } from "@/lib/api/types";
import { nextRequestFrom, type CatalogBatch, type CatalogRequest } from "@/lib/catalog-feed";

/**
 * Browser-side catalog fetching, for the batches after the first.
 *
 * The first batch is rendered on the server, so this only runs once a shopper
 * scrolls. It calls the same `/api/v1/catalog/products` endpoint the server
 * does, with the same query plus a cursor.
 */

/** Thrown for any failure a caller can usefully retry. */
export class CatalogFetchError extends Error {
  /** True when the server rejected the cursor rather than failing to answer. */
  readonly invalidCursor: boolean;

  constructor(message: string, options: { invalidCursor?: boolean } = {}) {
    super(message);
    this.name = "CatalogFetchError";
    this.invalidCursor = options.invalidCursor ?? false;
  }
}

function apiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new CatalogFetchError("The catalog API is not configured.");
  }
  return base.replace(/\/+$/, "");
}

/**
 * Fetch one batch, continuing from where the previous one stopped.
 *
 * The request carries the listing's whole query alongside the position, which
 * is what lets the server accept a cursor at all: it fingerprints the scope,
 * filters and sort, and refuses a cursor minted for anything else.
 *
 * A cursor request drops `page`. The cursor already says where the batch
 * starts, and sending both would invite the server to disagree with itself. A
 * page request is the fallback for an API that reported more results without
 * offering a cursor; it sends no cursor at all.
 *
 * The signal is the caller's: the hook aborts in flight requests when the
 * listing changes, and an abort propagates as an AbortError the caller
 * recognises rather than as a failed batch.
 */
export async function fetchCatalogBatch(
  query: CatalogQuery,
  request: CatalogRequest,
  signal?: AbortSignal
): Promise<CatalogBatch> {
  const { page: _page, ...rest } = query;
  void _page;

  const position =
    request.kind === "cursor"
      ? { cursor: request.cursor }
      : { page: request.page };

  const url = `${apiBaseUrl()}/api/v1/catalog/products${toQueryString({
    ...(rest as Record<string, unknown>),
    ...position,
  })}`;

  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch (error) {
    // An abort is the caller's own doing and is re-thrown untouched, so it is
    // never mistaken for a batch that failed.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new CatalogFetchError(
      error instanceof Error ? error.message : "The catalog could not be reached."
    );
  }

  if (!response.ok) {
    throw new CatalogFetchError(
      `The catalog answered ${response.status}.`,
      // 400 here means the cursor no longer matches its query -- a stale tab,
      // an edited URL. Retrying the same cursor would fail identically.
      { invalidCursor: response.status === 400 }
    );
  }

  const body = (await response.json()) as ApiResponse<Product[]>;
  if (body && typeof body === "object" && "success" in body && !body.success) {
    throw new CatalogFetchError(body.message ?? "The catalog request failed.");
  }

  return {
    items: body.data ?? [],
    // One reading of "is there more", shared with the server-rendered first
    // batch, so a feed cannot end for a reason the first page would not have
    // ended for. See nextRequestFrom.
    next: nextRequestFrom(body.meta, query.limit ?? 24),
  };
}
