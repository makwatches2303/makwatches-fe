import type { NextConfig } from "next";

/**
 * The Firebase Storage bucket product media is served from.
 *
 * Read from the environment so the allow-list and the client-side media
 * resolver (src/lib/media) can never disagree about which bucket is in use.
 * Falls back to the project's bucket so a checkout without a .env.local still
 * builds; unlike the API origin, guessing wrong here degrades to a placeholder
 * image rather than sending traffic somewhere unintended.
 */
const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "mak-watches.firebasestorage.app";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Product/catalog images live in Firebase Storage. Objects are written by
      // the Go backend to the bucket root and served publicly from the GCS
      // hostname, which is what the API returns.
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: `/${STORAGE_BUCKET}/**`,
      },
      // Firebase download-URL form (v0 endpoint), for objects addressed through
      // the Firebase SDK rather than the raw GCS path.
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: `/v0/b/${STORAGE_BUCKET}/**`,
      },
      // Static artwork referenced by the legacy storefront. These are retained
      // only for routes not yet rebuilt and should go with them.
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.picsum.photos" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  /**
   * Legacy route redirects.
   *
   * Phase 3 shipped, but not as a static rule here: /men/category/:id and
   * /women/category/:id encode an opaque legacy id in the path and the real
   * subcategory *name* in a ?name= query param (see how CategoryTile used to
   * build these links, in git history). A static rewrite only has the id to
   * work with, which doesn't slugify to anything /category/[slug] can look
   * up -- so both legacy routes are now themselves thin Server Components
   * that resolve the name to a slug (the same lookup /category/[slug] uses)
   * and issue a permanentRedirect(), 404ing if the category no longer
   * exists. See src/app/men/category/[subcategoryId]/page.tsx.
   *
   * Deliberately still empty otherwise: remaining legacy routes' replacements
   * do not exist yet, and a permanent redirect to a 404 is worse than the
   * working legacy page -- it is cached by browsers and search engines and is
   * painful to undo.
   *
   *   Phase 4 — /product/[slug] exists:
   *     A static rule has the same problem as Phase 3 did: /product_details
   *     identifies the product by a query-param id, not a path segment a
   *     rewrite can map to a slug. The rebuilt /product_details page should
   *     look the product up and issue its own redirect, the same way the
   *     Phase 3 pages now do.
   */
  async redirects() {
    return [];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
