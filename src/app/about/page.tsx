import type { Metadata } from "next";
import Image from "next/image";
import {
  Container,
  Section,
  SectionHeader,
  Eyebrow,
  Heading,
  Text,
  RuleGrid,
  RuleGridCell,
  Divider,
  ButtonLink,
  Reveal,
} from "@/design-system";

const VALUES = [
  {
    title: "Craftsmanship",
    description:
      "Every MAK watch is meticulously assembled by skilled hands, bringing decades of experience to each timepiece.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: "Innovation",
    description:
      "We push the boundaries of watchmaking technology while respecting the traditional techniques it stands on.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
  {
    title: "Excellence",
    description:
      "Our commitment to excellence drives every detail, from the initial sketch to the final quality check.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    ),
  },
];

const STATS = [
  { number: "5K+", label: "Satisfied Customers" },
  { number: "10+", label: "Years of Excellence" },
  { number: "50+", label: "Expert Craftsmen" },
  { number: "100+", label: "Unique Designs" },
];

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story behind MAK Watches -- India's destination for premium, authentic designer watches.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mak">
      {/* Hero */}
      <Section tone="ink" spacing="loose">
        <Container size="narrow" className="text-center">
          <Reveal>
            <Eyebrow tone="accent" className="justify-center">
              About MAK Watches
            </Eyebrow>
            <Heading level="hero" tone="inverse" className="mt-4">
              Timeless elegance,
              <br />
              modern craft.
            </Heading>
            <Text size="lead" tone="onAccent" className="mx-auto mt-6 max-w-xl opacity-80">
              A curated house of mechanical and quartz timepieces, built to be
              worn every day and handed down for generations.
            </Text>
          </Reveal>
        </Container>
      </Section>

      {/* Our Story */}
      <Section spacing="loose">
        <Container>
          <Reveal>
            <SectionHeader eyebrow="Our Story" title="Built on one idea" />
          </Reveal>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <Reveal>
              <Text size="lead" tone="muted" className="mb-5">
                <span className="font-semibold text-mak-ink">MAK Watches</span>{" "}
                was founded on a single idea: a watch should transcend mere
                function and become a companion through life&apos;s most
                precious moments.
              </Text>
              <Text tone="muted" className="mb-4">
                Since our inception, we have been dedicated to the craft of
                watchmaking, pairing traditional technique with modern
                design. Every timepiece in our collection carries a story of
                precision, restraint, and an unwavering commitment to
                quality.
              </Text>
              <Text tone="muted">
                Our craftsmen work into every detail, so each MAK watch meets
                our own exacting standard before it meets yours.
              </Text>
            </Reveal>
            <Reveal delay={2} className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/luxury watch.png"
                alt="A MAK Watches timepiece"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section tone="surface" spacing="loose">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="What We Stand For"
              title="Three pillars, every watch"
            />
          </Reveal>
          <RuleGrid cols={{ base: 1, md: 3, lg: 3 }} className="mt-10">
            {VALUES.map((value, i) => (
              <RuleGridCell key={value.title}>
                <Reveal delay={i as 0 | 1 | 2}>
                  <svg
                    className="mb-5 h-8 w-8 text-mak-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {value.icon}
                  </svg>
                  <Heading level="heading" as="h3" className="mb-2">
                    {value.title}
                  </Heading>
                  <Text tone="muted">{value.description}</Text>
                </Reveal>
              </RuleGridCell>
            ))}
          </RuleGrid>
        </Container>
      </Section>

      {/* Heritage */}
      <Section spacing="loose">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <Reveal className="relative order-2 aspect-[4/3] w-full overflow-hidden lg:order-1">
              <Image
                src="/header-watch.png"
                alt="A MAK Watches timepiece, detail view"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={2} className="order-1 lg:order-2">
              <Eyebrow tone="accent" className="mb-3">
                Heritage &amp; Innovation
              </Eyebrow>
              <Heading level="title" as="h2" className="mb-5">
                Old craft, current design
              </Heading>
              <Text size="lead" tone="muted" className="mb-4">
                Our timepieces draw on a long heritage of watchmaking,
                carried forward with a contemporary hand.
              </Text>
              <Text tone="muted" className="mb-4">
                Every watch in the collection represents research,
                development and refinement -- from the first sketch to the
                final quality check, each step held to the same standard.
              </Text>
              <Text tone="muted">
                We source only materials built to last, so a MAK watch is
                built to outlast a single owner.
              </Text>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section tone="ink" spacing="default">
        <Container>
          <RuleGrid cols={{ base: 2, md: 4, lg: 4 }} bordered={false} className="!border-0">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i as 0 | 1 | 2 | 3} className="border-t-2 border-mak-on-ink/20 px-2 py-8 text-center first:border-l-0">
                <Heading level="display" tone="inverse" as="p">
                  {stat.number}
                </Heading>
                <Text size="small" tone="inverse" className="mt-2 opacity-70">
                  {stat.label}
                </Text>
              </Reveal>
            ))}
          </RuleGrid>
        </Container>
      </Section>

      {/* CTA */}
      <Section tone="accent" spacing="default">
        <Container size="narrow" className="text-center">
          <Heading level="title" as="h2" className="mb-4 text-mak-on-accent">
            Experience MAK excellence
          </Heading>
          <Text tone="onAccent" className="mx-auto mb-8 max-w-xl opacity-85">
            Discover the current collection and find the timepiece that fits
            your wrist and your day.
          </Text>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <ButtonLink href="/shop" variant="inverse" size="lg">
              Explore the collection
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost" size="lg" className="text-mak-on-accent hover:text-mak-ink">
              Contact us
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Divider />
    </div>
  );
}
