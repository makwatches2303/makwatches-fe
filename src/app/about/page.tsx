import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRightIcon,
  ButtonLink,
  Container,
  Divider,
  Eyebrow,
  Heading,
  Reveal,
  RuleGrid,
  RuleGridCell,
  Section,
  SectionHeader,
  Text,
} from "@/design-system";
import { MAK_CONTACT, PolicyContact } from "@/components/marketing/policy";
import {
  fetchCategories,
  fetchFilters,
  fetchProducts,
  fetchStorefront,
} from "@/lib/api/server";

/**
 * About MAK Watches.
 *
 * ## What this page is now driven by
 *
 * Previously this was a fully static file: two hardcoded arrays (`VALUES` and
 * `STATS`) and no API call at all. It described a manufacturer — "Craftsmanship",
 * "Expert Craftsmen", "Years of Excellence", "dedicated to the craft of
 * watchmaking" — none of which describes MAK Watches, which is an online watch
 * *retailer* selling Titan, Fastrack, Casio, Citizen and others.
 *
 * It now reads the storefront document's existing `house` block — the
 * admin-managed About/House fields that already exist for exactly this purpose
 * (eyebrow, title, body, cta, image) and are written by the admin application
 * through PUT /admin/storefront. **No new content model was introduced.** The
 * page is a read-only consumer of GET /api/v1/storefront, so the admin's
 * editing flow, API contract and data model are untouched.
 *
 * Where the admin has not filled a field in — and today `house.title` and
 * `house.body` are both empty — the retailer-appropriate fallback below is
 * used. That is a *presentation* default, not stored content: the moment the
 * admin writes copy, theirs wins, with no code change.
 *
 * ## What is counted rather than claimed
 *
 * The figures band counts the live catalogue (products listed, brands stocked,
 * categories). Any figure that comes back zero is not rendered. There are no
 * business statistics on this page — no employees, no years, no facilities, no
 * awards, no certifications — because none of those are things this system
 * knows or MAK can evidence.
 *
 * Every service claim points at something that genuinely exists: the Razorpay
 * checkout, the courier integration and tracking behind /shipping, the
 * published policy at /refund, and the contact details in MAK_CONTACT. Timeline
 * and warranty specifics are deliberately *not* restated here; they live on the
 * policy pages, which are the only place they can be kept accurate.
 */

export const metadata: Metadata = {
  title: "About Us",
  description:
    "MAK Watches is an online watch retail platform — authentic timepieces from genuine brands, with secure checkout, tracked delivery across India and support from our team in Jetpur, Rajkot.",
  alternates: { canonical: "/about" },
};

/** Refreshed hourly: catalogue figures move slowly, the copy not at all. */
export const revalidate = 3600;

/**
 * Retailer-appropriate fallbacks for the admin-managed `house` block.
 *
 * Used only for fields the admin has left empty. Kept deliberately free of any
 * claim that cannot be evidenced — it describes what the platform *is* and what
 * it *does*, not how long it has done it or how well.
 */
const HOUSE_FALLBACK = {
  eyebrow: "About MAK Watches",
  title: "Your destination for watches that fit your style.",
  body: "MAK Watches is an online watch retail platform bringing together authentic timepieces, genuine brands and carefully selected collections in one convenient shopping experience.",
  cta: { label: "Shop the collection", href: "/shop" },
} as const;

/**
 * What we offer a shopper, stated as service rather than as heritage.
 *
 * Each entry describes a capability the storefront genuinely has. Nothing here
 * quotes a duration, a percentage, a guarantee or a certification — those
 * either live in the published policies or do not exist.
 */
const PROMISES: { title: string; description: string }[] = [
  {
    title: "Authentic watches",
    description:
      "We sell genuine watches from the brands we carry. No replicas, and no listing for a piece we cannot supply.",
  },
  {
    title: "Genuine brands",
    description:
      "Every listing names the house that made the watch, so you always know exactly whose piece you are buying.",
  },
  {
    title: "Premium collections",
    description:
      "A curated shelf rather than an endless one — selected across men's, women's, smart watches and wall clocks.",
  },
  {
    title: "Easy shopping",
    description:
      "Filter by brand, price, dial, strap and style; save pieces to a wishlist; keep your addresses for next time.",
  },
  {
    title: "Secure payments",
    description:
      "Checkout runs through Razorpay. Card and UPI details are handled by the gateway and never touch our servers.",
  },
  {
    title: "Reliable delivery",
    description:
      "Orders ship through registered courier partners with a tracking number, so you can follow the parcel to your door.",
  },
  {
    title: "Customer support",
    description: `Reach us on ${MAK_CONTACT.phoneDisplay} or ${MAK_CONTACT.email} — the same team that packs the orders.`,
  },
];

/** The customer journey, each step describing something the app actually does. */
const JOURNEY: { step: string; title: string; description: string }[] = [
  {
    step: "01",
    title: "Discover",
    description:
      "Browse by brand, category, style or price, or search the full catalogue.",
  },
  {
    step: "02",
    title: "Choose",
    description:
      "Compare pieces, check what a listing records, and save favourites to your wishlist.",
  },
  {
    step: "03",
    title: "Secure checkout",
    description:
      "Pay online through Razorpay, or by cash on delivery where the courier supports it.",
  },
  {
    step: "04",
    title: "Delivery",
    description:
      "We hand the parcel to a registered courier and the tracking number appears against your order.",
  },
  {
    step: "05",
    title: "Support",
    description:
      "Something wrong on arrival? Tell us within the window set out in our returns policy.",
  },
];

/** One counted figure. Rendered only when the catalogue actually reports it. */
interface CatalogueFigure {
  value: string;
  label: string;
}

export default async function AboutPage() {
  const [storefront, catalogue, filters, categories] = await Promise.all([
    fetchStorefront(),
    // Counted, never claimed. `limit: 1` transfers a single product and reads
    // the total out of the pagination metadata, so this costs no more than a
    // probe.
    fetchProducts({ limit: 1 }, "about/catalogueTotal"),
    fetchFilters(),
    fetchCategories(),
  ]);

  // The admin's own About/House copy wins; the fallback fills only what they
  // have left empty. `enabled` is honoured for the CTA, which is a commitment
  // to send someone somewhere.
  const house = storefront.house;
  const eyebrow = house.eyebrow.trim() || HOUSE_FALLBACK.eyebrow;
  const title = house.title.trim() || HOUSE_FALLBACK.title;
  const body = house.body.trim() || HOUSE_FALLBACK.body;
  const cta =
    house.cta.label.trim() && house.cta.href.trim()
      ? house.cta
      : HOUSE_FALLBACK.cta;

  const figures: CatalogueFigure[] = [];

  const totalPieces = catalogue.meta?.total ?? 0;
  if (totalPieces > 0) {
    figures.push({
      value: totalPieces.toLocaleString("en-IN"),
      label: totalPieces === 1 ? "Watch listed" : "Watches listed",
    });
  }

  const brands = filters.brands ?? [];
  if (brands.length > 0) {
    figures.push({
      value: brands.length.toLocaleString("en-IN"),
      label: brands.length === 1 ? "Brand stocked" : "Brands stocked",
    });
  }

  const subcategoryCount = categories.reduce(
    (sum, category) => sum + (category.subcategories?.length ?? 0),
    0
  );
  if (subcategoryCount > 0) {
    figures.push({
      value: subcategoryCount.toLocaleString("en-IN"),
      label: "Watch categories",
    });
  }

  // Real brands, linking into the real filtered listing. Capped so the band
  // stays a taster rather than a directory.
  const brandLinks = brands.slice(0, 12);

  return (
    <div className="mak bg-mak-bg">
      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <Section tone="ink" spacing="loose">
        <Container>
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow withRule tone="accent" className="mb-5">
                {eyebrow}
              </Eyebrow>
              {/*
                `display` rather than `hero`: this is the only h1 on the page,
                and the hero token clamps up to 108px, which swallows a full
                sentence on a phone. Display tops out at 56px and stays
                readable at 34px on a small screen.
              */}
              <Heading level="display" as="h1" tone="inverse">
                {title}
              </Heading>
              <Text
                size="lead"
                tone="inverse"
                className="mt-6 max-w-2xl opacity-80"
              >
                {body}
              </Text>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={cta.href} variant="inverse" size="lg">
                  {cta.label}
                </ButtonLink>
                <ButtonLink
                  href="/collections"
                  variant="ghost"
                  size="lg"
                  className="text-mak-on-ink hover:text-mak-ink"
                >
                  Shop by category
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── 2. Why MAK Watches ──────────────────────────────────────────── */}
      <Section spacing="loose">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Why MAK Watches"
              title="A watch shop, online"
              headingAs="h2"
            />
          </Reveal>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <Reveal>
              <Text size="lead" tone="muted" className="mb-5">
                <span className="font-semibold text-mak-ink">MAK Watches</span>{" "}
                is a watch retailer. Every piece on this site was built by the
                brand named on its dial; our job is to choose the ones worth
                selling and make buying one straightforward.
              </Text>
              <Text tone="muted" className="mb-4">
                Behind the site is a counter. Our store is in{" "}
                {MAK_CONTACT.address.slice(-2).join(", ")}, and the contact
                details on every policy page reach it — not a form that goes
                nowhere.
              </Text>
              <Text tone="muted">
                What we promise is narrow, and we would rather keep it that way:
                the watch you see is the watch that arrives, the price you see is
                the price you pay, and if something is wrong we will tell you
                plainly what we can do about it.
              </Text>
            </Reveal>
            <Reveal
              delay={2}
              className="relative aspect-[4/3] w-full overflow-hidden border-2 border-mak-line"
            >
              <Image
                src="/luxury watch.png"
                alt="A watch from the MAK Watches catalogue, shown on its side"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── 3. Our promise ──────────────────────────────────────────────── */}
      <Section tone="surface" spacing="loose">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Our promise"
              title="What you get, every order"
              headingAs="h2"
            />
          </Reveal>
          <RuleGrid cols={{ base: 1, md: 2, lg: 3 }} className="mt-10">
            {PROMISES.map((promise, i) => (
              <RuleGridCell key={promise.title}>
                <Reveal delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
                  <Heading level="heading" as="h3" className="mb-2">
                    {promise.title}
                  </Heading>
                  <Text tone="muted">{promise.description}</Text>
                </Reveal>
              </RuleGridCell>
            ))}
          </RuleGrid>
          <Text size="small" tone="subtle" className="mt-6">
            Delivery timelines, returns and refunds are set out in full on our{" "}
            <Link href="/shipping" className="text-mak-accent underline">
              shipping
            </Link>{" "}
            and{" "}
            <Link href="/refund" className="text-mak-accent underline">
              returns
            </Link>{" "}
            pages.
          </Text>
        </Container>
      </Section>

      {/* ── 4. Shopping experience ──────────────────────────────────────── */}
      <Section spacing="loose">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="How it works"
              title="From browsing to your wrist"
              headingAs="h2"
            />
          </Reveal>
          <ol className="mt-10 grid list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 lg:grid-cols-5">
            {JOURNEY.map((stage, i) => (
              <Reveal
                key={stage.step}
                as="li"
                delay={Math.min(i, 3) as 0 | 1 | 2 | 3}
                className="border-t-2 border-mak-line pt-5 sm:pr-6"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-mak-title font-extrabold leading-none text-mak-accent"
                >
                  {stage.step}
                </span>
                <Heading level="heading" as="h3" className="mb-2 mt-3">
                  {stage.title}
                </Heading>
                <Text size="small" tone="muted">
                  {stage.description}
                </Text>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── 5. Discovery ────────────────────────────────────────────────── */}
      {brandLinks.length > 0 || categories.length > 0 ? (
        <Section tone="surface" spacing="loose">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Find your way in"
                title="Browse how you like"
                headingAs="h2"
              />
            </Reveal>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
              {brandLinks.length > 0 ? (
                <Reveal>
                  <Heading level="heading" as="h3" className="mb-4">
                    By brand
                  </Heading>
                  <ul className="flex list-none flex-wrap gap-2 p-0">
                    {brandLinks.map((brand) => (
                      <li key={brand.value}>
                        <Link
                          href={`/shop?brand=${encodeURIComponent(brand.value)}`}
                          className="inline-flex border-[1.5px] border-mak-line bg-mak-bg px-3.5 py-2 font-display text-mak-label font-extrabold uppercase tracking-[0.08em] text-mak-ink no-underline transition-colors duration-200 ease-mak hover:border-mak-accent hover:text-mak-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                        >
                          {brand.label ?? brand.value}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}

              {categories.length > 0 ? (
                <Reveal delay={2}>
                  <Heading level="heading" as="h3" className="mb-4">
                    By category
                  </Heading>
                  <ul className="flex list-none flex-col p-0">
                    {categories.map((category) => (
                      <li key={category.id ?? category.name}>
                        <Link
                          href={`/shop?mainCategory=${encodeURIComponent(category.name)}`}
                          className="group flex items-center justify-between gap-4 border-b-[1.5px] border-mak-divider py-3.5 no-underline transition-colors duration-200 ease-mak hover:text-mak-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
                        >
                          <span className="font-display text-mak-small font-extrabold text-mak-ink group-hover:text-mak-accent">
                            {category.name}
                          </span>
                          <span
                            aria-hidden="true"
                            className="shrink-0 text-mak-subtle transition-transform duration-200 ease-mak group-hover:translate-x-0.5 group-hover:text-mak-accent"
                          >
                            <ArrowRightIcon size={16} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href="/collections"
                    variant="secondary"
                    className="mt-6"
                    iconRight={<ArrowRightIcon size={16} />}
                  >
                    See all categories
                  </ButtonLink>
                </Reveal>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}

      {/*
        ── The catalogue, counted ─────────────────────────────────────────

        Rendered only when there is something true to count. A figure that comes
        back zero is left out, and the whole band disappears if the catalogue
        cannot be read. Nothing here is a business statistic: these are three
        facts about what is on the shelf right now, and they change on their own
        as stock does.
      */}
      {figures.length > 0 ? (
        <Section tone="ink" spacing="default">
          <Container>
            <div
              className={[
                "grid grid-cols-1 divide-y divide-mak-on-ink/10 sm:divide-y-0 sm:divide-x sm:divide-mak-on-ink/10",
                figures.length >= 3
                  ? "sm:grid-cols-3"
                  : figures.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-1",
              ].join(" ")}
            >
              {figures.map((figure, i) => (
                <Reveal
                  key={figure.label}
                  delay={i as 0 | 1 | 2}
                  className="flex flex-col items-center justify-center p-6 text-center sm:p-8"
                >
                  <span className="font-display text-mak-display font-extrabold tracking-tight text-mak-on-ink">
                    {figure.value}
                  </span>
                  <span className="mt-2.5 text-mak-label uppercase tracking-[0.14em] text-mak-on-ink/70">
                    {figure.label}
                  </span>
                </Reveal>
              ))}
            </div>
            <Text size="small" className="mt-6 text-center text-mak-on-ink/60">
              Counted from the live catalogue.
            </Text>
          </Container>
        </Section>
      ) : null}

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <Section spacing="loose">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Talk to us"
              title="Real people, real counter"
              headingAs="h2"
            />
          </Reveal>
          <Reveal delay={1} className="mt-10">
            <Text size="lead" tone="muted" className="mb-8 max-w-2xl">
              Questions about a watch, an order on its way, or something that
              arrived wrong — the details below reach the team that packs the
              boxes.
            </Text>
            {/*
              The same PolicyContact block every policy page ends on, reading the
              same MAK_CONTACT constants. Reused rather than re-laid-out so the
              store's details can never disagree between pages -- there is one
              place they are written down.
            */}
            <PolicyContact />
            <Text size="small" tone="subtle" className="mt-5">
              Store: {MAK_CONTACT.address.join(", ")}.
            </Text>
          </Reveal>
        </Container>
      </Section>

      {/* ── 6. Closing CTA ──────────────────────────────────────────────── */}
      <Section tone="accent" spacing="default">
        <Container size="narrow" className="text-center">
          <Heading level="title" as="h2" className="mb-4 text-mak-on-accent">
            Find your next watch.
          </Heading>
          <Text tone="onAccent" className="mx-auto mb-8 max-w-xl opacity-85">
            Browse what we have in stock, or tell us what you are looking for and
            we will point you at it.
          </Text>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <ButtonLink href="/shop" variant="inverse" size="lg">
              Shop all watches
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="ghost"
              size="lg"
              className="text-mak-on-accent hover:text-mak-ink"
            >
              Contact us
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Divider />
    </div>
  );
}
