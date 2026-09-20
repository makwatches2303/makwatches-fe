/**
 * Query-string building, on its own.
 *
 * Split out of client.ts so that using it does not pull in axios. The listing
 * feed builds a URL in the browser and has no use for an HTTP client, and
 * pulling one in would put it in the bundle of every page that scrolls.
 * client.ts re-exports this, so every existing import still works.
 */

/**
 * Build a query string from a params object, dropping undefined/null/empty
 * values so the API never receives `?category=&page=`.
 */
export function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      if (value) search.set(key, "true");
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(","));
      continue;
    }
    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
