import { Metadata } from 'next';

export const metadata: Metadata = {
  // No literal "| MAK Watches" here: the root layout's title.template
  // ("%s | MAK Watches") already appends it. page.tsx under this segment
  // overrides this with its own metadata, so this string was only ever
  // reachable via the not-found fallback -- which is exactly where the
  // doubled suffix showed up once something under /men actually called
  // notFound() for the first time (see src/app/men/category/[subcategoryId]).
  title: "Men's Luxury Watches Collection - Designer Watches for Men",
  description: "Browse our exclusive collection of men's luxury watches. Shop premium designer watches, sports watches, smartwatches, and elegant timepieces for men at MAK Watches. Authentic brands, best prices.",
  keywords: [
    "men's watches",
    "luxury watches for men",
    "designer watches men",
    "sports watches men",
    "smartwatches for men",
    "casual watches men",
    "men's luxury timepieces",
    "branded watches for men India",
    "MAK men's watches",
  ],
  openGraph: {
    title: "Men's Luxury Watches Collection | MAK Watches",
    description: "Discover our exclusive collection of premium men's watches. Shop authentic designer watches with best prices.",
    url: "https://makwatches.in/men",
    images: [
      {
        url: "/men.png",
        width: 1200,
        height: 630,
        alt: "MAK Watches - Men's Collection",
      },
    ],
  },
  alternates: {
    canonical: "https://makwatches.in/men",
  },
};

export default function MenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

