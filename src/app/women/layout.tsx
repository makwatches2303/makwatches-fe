import { Metadata } from 'next';

export const metadata: Metadata = {
  // See src/app/men/layout.tsx -- same reasoning, mirrored for Women.
  title: "Women's Luxury Watches Collection - Designer Watches for Women",
  description: "Explore our exquisite collection of women's luxury watches. Shop elegant designer watches, smartwatches, and premium timepieces for women at MAK Watches. Authentic brands, exclusive designs.",
  keywords: [
    "women's watches",
    "luxury watches for women",
    "designer watches women",
    "elegant watches women",
    "smartwatches for women",
    "casual watches women",
    "women's luxury timepieces",
    "branded watches for women India",
    "MAK women's watches",
    "ladies watches",
  ],
  openGraph: {
    title: "Women's Luxury Watches Collection | MAK Watches",
    description: "Discover our exclusive collection of premium women's watches. Shop authentic designer watches with elegant designs.",
    url: "https://makwatches.in/women",
    images: [
      {
        url: "/women.png",
        width: 1200,
        height: 630,
        alt: "MAK Watches - Women's Collection",
      },
    ],
  },
  alternates: {
    canonical: "https://makwatches.in/women",
  },
};

export default function WomenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
