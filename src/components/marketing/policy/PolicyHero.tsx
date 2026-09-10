import { Container, Section, Eyebrow, Heading, Text, Reveal } from "@/design-system";
import type { ReactNode } from "react";

export function PolicyHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}) {
  return (
    <Section tone="ink" spacing="loose">
      <Container size="narrow" className="text-center">
        <Reveal>
          <Eyebrow tone="accent" className="justify-center">
            {eyebrow}
          </Eyebrow>
          <Heading level="hero" tone="inverse" className="mt-4">
            {title}
          </Heading>
          <Text size="lead" tone="inverse" className="mx-auto mt-6 max-w-xl opacity-70">
            {subtitle}
          </Text>
        </Reveal>
      </Container>
    </Section>
  );
}
