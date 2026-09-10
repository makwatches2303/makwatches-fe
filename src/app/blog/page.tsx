import type { Metadata } from "next";
import {
  Container,
  Section,
  Eyebrow,
  Heading,
  Text,
  ButtonLink,
  Reveal,
} from "@/design-system";
import { BlogExplorer } from "./BlogExplorer";
import { BLOG_POSTS, BLOG_CATEGORIES } from "./posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Watch care guides, style tips, and stories from MAK Watches.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="mak">
      <Section tone="ink" spacing="loose">
        <Container size="narrow" className="text-center">
          <Reveal>
            <Eyebrow tone="accent" className="justify-center">
              MAK Blog
            </Eyebrow>
            <Heading level="hero" tone="inverse" className="mt-4">
              Stories in time.
            </Heading>
            <Text size="lead" tone="inverse" className="mx-auto mt-6 max-w-xl opacity-70">
              Stories, insights, and inspiration from the world of horology.
            </Text>
          </Reveal>
        </Container>
      </Section>

      <Section spacing="loose">
        <Container>
          <BlogExplorer posts={BLOG_POSTS} categories={BLOG_CATEGORIES} />
        </Container>
      </Section>

      <Section tone="ink" spacing="default">
        <Container size="narrow" className="text-center">
          <Heading level="title" tone="inverse" as="h2" className="mb-4">
            Stay informed
          </Heading>
          <Text tone="inverse" className="mx-auto mb-8 max-w-xl opacity-70">
            Subscribe for the latest guides, stories, and updates from MAK Watches. (Coming
            soon.)
          </Text>
          <ButtonLink href="/shop" variant="inverse" size="lg">
            Explore the collection
          </ButtonLink>
        </Container>
      </Section>
    </div>
  );
}
