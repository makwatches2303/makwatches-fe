/**
 * On-demand cache invalidation for admin-managed content.
 *
 * # The problem this solves
 *
 * Storefront copy -- navigation, footer, section headings, the homepage CMS --
 * is written in the admin panel and read here through `fetch` with a
 * `revalidate` window. Clearing the API's own Redis entry on save, which it
 * already does, only clears the first of three caches. The response still sits
 * in Next's Data Cache, and for any prerendered route the rendered HTML sits in
 * its Full Route Cache, so the live site keeps serving the previous heading
 * until those windows lapse. That is what "I saved it and nothing changed"
 * actually was.
 *
 * `revalidate` is a ceiling on staleness, not a signal. This route is the
 * signal: the API posts here right after a successful write, naming the cache
 * tags that just became stale, and `revalidateTag` purges both layers at once.
 * Nothing is uncached as a result -- the TTLs stay exactly as they were and
 * remain the fallback if this call never arrives.
 *
 * # Security
 *
 * A purge endpoint is a denial-of-service lever: called in a loop it forces a
 * re-render and an upstream fetch for every request behind it. So:
 *
 *   - It fails closed. With no REVALIDATE_SECRET configured it refuses every
 *     request rather than defaulting to open.
 *   - The secret is compared in constant time, and is never a query parameter
 *     (proxies and CDNs log those).
 *   - Only tags on the allow-list are honoured, so a caller cannot purge
 *     something this application did not intend to expose.
 *   - It never reads or returns any content. The only observable effect is
 *     that the next visitor gets a fresh render.
 */

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { CACHE_TAGS } from "@/lib/api/server";

/** Node, not edge: the constant-time comparison below needs node:crypto. */
export const runtime = "nodejs";
/** Never prerendered, never cached -- it is a command, not a document. */
export const dynamic = "force-dynamic";

/**
 * The tags this endpoint will purge.
 *
 * An allow-list rather than "whatever was sent": tags are also Next's own
 * internal namespace for implicit path tags, and accepting arbitrary strings
 * would hand a caller a lever over routes this application never meant to
 * expose.
 */
const ALLOWED_TAGS: readonly string[] = Object.values(CACHE_TAGS);

/** The header the API sends the shared secret in. */
const SECRET_HEADER = "x-revalidate-secret";

interface RevalidateBody {
  tags?: unknown;
}

/**
 * Constant-time secret comparison.
 *
 * `===` on strings short-circuits at the first differing byte, which leaks the
 * length of the matching prefix to anyone who can time the response. Both
 * sides are hashed first so timingSafeEqual always sees equal-length buffers --
 * it throws otherwise, and that throw would itself be a length oracle.
 */
async function secretMatches(provided: string, expected: string): Promise<boolean> {
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

export async function POST(request: Request): Promise<NextResponse> {
  const expected = process.env.REVALIDATE_SECRET?.trim();

  if (!expected) {
    // Fail closed. An unauthenticated purge route is worse than a stale
    // heading, so an unconfigured deployment simply has no purge route and
    // falls back to the TTLs.
    console.error(
      "[revalidate] REVALIDATE_SECRET is not set; refusing to revalidate. " +
        "Set it here and STOREFRONT_REVALIDATE_SECRET on the API to the same value."
    );
    return NextResponse.json(
      { revalidated: false, error: "Revalidation is not configured." },
      { status: 503 }
    );
  }

  const provided = request.headers.get(SECRET_HEADER)?.trim() ?? "";
  if (!provided || !(await secretMatches(provided, expected))) {
    // Deliberately terse and identical for a missing and a wrong secret.
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json(
      { revalidated: false, error: "Body must be JSON." },
      { status: 400 }
    );
  }

  const requested = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  const tags = requested.filter((tag) => ALLOWED_TAGS.includes(tag));
  const rejected = requested.filter((tag) => !ALLOWED_TAGS.includes(tag));

  if (tags.length === 0) {
    return NextResponse.json(
      {
        revalidated: false,
        error: "No known cache tag was named.",
        allowed: ALLOWED_TAGS,
      },
      { status: 400 }
    );
  }

  for (const tag of tags) {
    // `{ expire: 0 }` is immediate expiry: the next request re-fetches rather
    // than being served the stale entry while a refresh runs behind it. That
    // is the whole point here -- an admin reloading the page they just edited
    // must see their own write, not the copy it replaced.
    revalidateTag(tag, { expire: 0 });
  }

  if (rejected.length > 0) {
    console.warn(`[revalidate] ignored unknown tags: ${rejected.join(", ")}`);
  }
  console.log(`[revalidate] purged: ${tags.join(", ")}`);

  return NextResponse.json({
    revalidated: true,
    tags,
    ...(rejected.length > 0 ? { ignored: rejected } : {}),
    now: Date.now(),
  });
}
