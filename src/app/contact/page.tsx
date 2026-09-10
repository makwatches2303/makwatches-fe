import type { Metadata } from "next";
import { Mail, Phone, MapPin, Building2, type LucideIcon } from "lucide-react";
import {
  Container,
  Section,
  Eyebrow,
  Heading,
  Text,
  RuleGrid,
  RuleGridCell,
  Reveal,
} from "@/design-system";
import { MAK_CONTACT } from "@/components/marketing/policy";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach MAK Watches by phone, email, or post -- we're here to help with your timepiece needs.",
  alternates: { canonical: "/contact" },
};

function ContactMethod({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="mt-0.5 size-6 shrink-0 text-mak-accent" aria-hidden="true" />
      <div>
        <Heading level="subheading" as="h3" className="mb-1.5">
          {label}
        </Heading>
        <Text tone="muted">{children}</Text>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="mak">
      <Section tone="ink" spacing="loose">
        <Container size="narrow" className="text-center">
          <Reveal>
            <Eyebrow tone="accent" className="justify-center">
              Get in Touch
            </Eyebrow>
            <Heading level="hero" tone="inverse" className="mt-4">
              Contact us
            </Heading>
            <Text size="lead" tone="inverse" className="mx-auto mt-6 max-w-xl opacity-70">
              We&apos;re here to help with your timepiece needs. Reach out through any of the
              channels below.
            </Text>
          </Reveal>
        </Container>
      </Section>

      <Section spacing="loose">
        <Container size="narrow">
          <Reveal>
            <RuleGrid cols={{ base: 1, md: 2, lg: 2 }}>
              <RuleGridCell>
                <ContactMethod icon={Phone} label="Phone">
                  <a href={`tel:${MAK_CONTACT.phone}`} className="text-mak-accent hover:underline">
                    {MAK_CONTACT.phoneDisplay}
                  </a>
                </ContactMethod>
              </RuleGridCell>

              <RuleGridCell>
                <ContactMethod icon={Mail} label="Email">
                  <a
                    href={`mailto:${MAK_CONTACT.email}`}
                    className="break-all text-mak-accent hover:underline"
                  >
                    {MAK_CONTACT.email}
                  </a>
                </ContactMethod>
              </RuleGridCell>

              <RuleGridCell>
                <ContactMethod icon={Building2} label="Legal entity">
                  MAK Watches
                </ContactMethod>
              </RuleGridCell>

              <RuleGridCell>
                <ContactMethod icon={MapPin} label="Address">
                  {MAK_CONTACT.address.map((line, i) => (
                    <span key={line}>
                      {line}
                      {i < MAK_CONTACT.address.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </ContactMethod>
              </RuleGridCell>
            </RuleGrid>
          </Reveal>
        </Container>
      </Section>
    </div>
  );
}
