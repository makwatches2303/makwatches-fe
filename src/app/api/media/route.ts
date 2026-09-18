/**
 * Same-origin passthrough for product media.
 *
 * Exists for one caller: the 3D showroom, whose textures are read back by the
 * GPU and therefore need a CORS-clean response. The storage bucket sends no
 * CORS headers at all, so a texture loaded straight from it taints the canvas
 * and fails.
 *
 * This used to be done by pointing the loader at /_next/image, which made the
 * response same-origin as a side effect of optimizing it. That route is gone:
 * image optimization is off (see next.config.ts -- the project's Vercel quota
 * is exhausted and every uncached optimizer request answers 402), so
 * /_next/image now 404s and every texture with it. Serving the bytes through
 * our own origin is the part the showroom actually needed; the resizing was
 * incidental.
 *
 * Deliberately narrow: it will fetch from the media bucket and nowhere else.
 * An open passthrough would let anyone use this deployment to fetch arbitrary
 * URLs under our domain's name.
 */

import { NextResponse } from "next/server";

const BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "mak-watches.firebasestorage.app";

/** The exact origins and path prefixes product media is served from. */
const ALLOWED: { origin: string; prefix: string }[] = [
  { origin: "https://storage.googleapis.com", prefix: `/${BUCKET}/` },
  { origin: "https://firebasestorage.googleapis.com", prefix: `/v0/b/${BUCKET}/` },
];

/** Whether a URL points at our own media, and nothing else. */
function isAllowed(target: URL): boolean {
  return ALLOWED.some(
    (entry) => target.origin === entry.origin && target.pathname.startsWith(entry.prefix)
  );
}

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("url");
  if (!src) {
    return NextResponse.json({ error: "No url given." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "That is not a URL." }, { status: 400 });
  }

  if (!isAllowed(target)) {
    // Not "not found": the caller asked for something this route will never
    // serve, and saying so plainly beats a misleading 404.
    return NextResponse.json(
      { error: "This route only serves MAK Watches media." },
      { status: 403 }
    );
  }

  const upstream = await fetch(target, {
    // Objects are immutable -- their names carry a timestamp -- so the CDN may
    // hold them indefinitely.
    next: { revalidate: 31536000 },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "That image is not available." },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    // The bucket holds only media, but this route hands bytes to a canvas;
    // confirm they are an image rather than trusting the path.
    return NextResponse.json({ error: "That is not an image." }, { status: 415 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      // Same-origin already, but explicit for a texture loader that sets
      // crossOrigin="anonymous" and so sends an Origin header.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
