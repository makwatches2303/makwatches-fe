import {
  Accordion,
  Breadcrumbs,
  Container,
  Divider,
  Eyebrow,
  Heading,
  RuleGrid,
  Section,
  SectionHeader,
  Text,
  type Crumb,
} from "@/design-system";
import { ProductGallery, ProductGrid, VariantPicker } from "@/components/commerce";
import { presentSpecs } from "@/lib/specs";
import { resolveProductImages } from "@/lib/media";
import {
  fetchProductReviews,
  fetchRelatedProducts,
  fetchProductVariants,
} from "@/lib/api/server";
import type { Product } from "@/lib/api/types";
import {
  enabledPolicyPanels,
  type PoliciesContent,
} from "@/lib/api/storefront";

import { PurchasePanel, StickyPurchaseBar } from "./PurchasePanel";
import { ProductJsonLd } from "./ProductJsonLd";

/**
 * The product detail page.
 *
 * A server component: gallery, copy, specifications, reviews and related
 * products are all rendered on the server. Only the purchase controls and the
 * gallery's viewer carry a client boundary.
 *
 * Every section is conditional on real data. A product with no recorded
 * specifications shows no specification table; a catalogue with no shipping
 * policy configured shows no shipping panel. Nothing is filled in with a
 * plausible-looking default — policy copy is admin-managed.
 */

export interface ProductDetailProps {
  product: Product;
  /** Admin-managed shipping / returns / warranty / box-contents copy. */
  policies: PoliciesContent;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** The trail from home to this product, built from its real category path. */
function buildCrumbs(product: Product): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];

  const main = product.mainCategory?.trim();
  // mainCategory sometimes holds the full composite path; take the leading
  // segment so the crumb reads "Men" rather than "Men — Leather watch".
  const topLevel = main?.split("—")[0].trim();

  if (topLevel === "Men" || topLevel === "Women") {
    crumbs.push({ label: topLevel, href: `/${topLevel.toLowerCase()}` });
  } else {
    crumbs.push({ label: "Shop", href: "/shop" });
  }

  const sub = product.subcategory?.trim();
  if (sub) {
    const href =
      topLevel === "Men" || topLevel === "Women"
        ? `/category/${slugify(sub)}?mainCategory=${encodeURIComponent(topLevel)}`
        : `/category/${slugify(sub)}`;
    crumbs.push({ label: sub, href });
  }

  crumbs.push({ label: product.name });
  return crumbs;
}

export async function ProductDetail({ product, policies }: ProductDetailProps) {
  const [reviewSummary, related, variants] = await Promise.all([
    fetchProductReviews(product.id),
    fetchRelatedProducts(product, 4),
    product.variantGroupId
      ? fetchProductVariants(product.variantGroupId, product.id)
      : Promise.resolve([]),
  ]);

  const images = resolveProductImages(product);
  const specs = presentSpecs(product.specs);
  const crumbs = buildCrumbs(product);
  const panels = enabledPolicyPanels(policies);

  // The product's own box contents win over the catalogue-wide default.
  const boxContents =
    product.specs?.boxContents?.length
      ? product.specs.boxContents
      : policies.boxContents.enabled
        ? policies.boxContents.items
        : [];

  return (
    <>
      <ProductJsonLd product={product} crumbs={crumbs} reviews={reviewSummary} />

      <Section spacing="none" className="pt-6">
        <Container>
          <Breadcrumbs items={crumbs} />
        </Container>
      </Section>

      {/* Gallery + purchase */}
      <Section spacing="tight">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery images={images} productName={product.name} />

            <div className="flex min-w-0 flex-col">
              {product.brand ? (
                <Eyebrow className="mb-3">{product.brand}</Eyebrow>
              ) : null}

              <Heading level="title" as="h1" className="break-words">
                {product.name}
              </Heading>

              {product.shortDescription ? (
                <Text size="lead" tone="muted" className="mt-4">
                  {product.shortDescription}
                </Text>
              ) : null}

              {variants.length > 0 ? (
                <VariantPicker current={product} variants={variants} className="mb-1 mt-6" />
              ) : null}

              <Divider weight="hairline" className="my-7" />

              <PurchasePanel product={product} />

              {product.description &&
              product.description !== product.shortDescription ? (
                <>
                  <Divider weight="hairline" className="my-7" />
                  <Text size="body" tone="muted" className="whitespace-pre-line">
                    {product.description}
                  </Text>
                </>
              ) : null}

              {/*
                Specifications render only where the product records them. There
                is deliberately no fallback row: an unknown movement is absent,
                not "—" and not a guess.
              */}
              {specs.length > 0 ? (
                <>
                  <Divider weight="hairline" className="my-7" />
                  <Text size="label" tone="ink" className="mb-4">
                    Specifications
                  </Text>
                  <RuleGrid cols={{ base: 1, md: 2, lg: 2 }} className="border-[1.5px]">
                    {specs.map((spec) => (
                      <div key={spec.label} className="p-4">
                        <dt className="text-mak-micro uppercase tracking-[0.12em] text-mak-subtle">
                          {spec.label}
                        </dt>
                        <dd className="mt-1 font-display text-mak-small font-extrabold text-mak-ink">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </RuleGrid>
                </>
              ) : null}

              {boxContents.length > 0 ? (
                <>
                  <Divider weight="hairline" className="my-7" />
                  <Text size="label" tone="ink" className="mb-3">
                    {policies.boxContents.title}
                  </Text>
                  <ul className="flex flex-col gap-2">
                    {boxContents.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-mak-small text-mak-muted"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 bg-mak-accent"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {panels.length > 0 ? (
                <Accordion
                  items={panels.map((panel) => ({
                    id: panel.title,
                    title: panel.title,
                    content: panel.body,
                  }))}
                  className="mt-8"
                />
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* Reviews */}
      <Section spacing="default" tone="surface">
        <Container>
          <SectionHeader
            eyebrow="Owner reviews"
            title={
              reviewSummary.average !== null
                ? `${reviewSummary.average.toFixed(1)} from ${reviewSummary.total} ${
                    reviewSummary.total === 1 ? "review" : "reviews"
                  }`
                : "No reviews yet."
            }
            headingAs="h2"
            className="mb-8"
          />

          {reviewSummary.reviews.length === 0 ? (
            <Text size="small" tone="muted">
              This piece has not been reviewed yet. Reviews appear here once
              verified owners leave them.
            </Text>
          ) : (
            <ul className="flex flex-col">
              {reviewSummary.reviews.map((review) => (
                <li
                  key={review.id}
                  className="border-b-[1.5px] border-mak-divider py-5 last:border-b-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-mak-small font-extrabold text-mak-ink">
                      {review.title || review.userName || "Verified owner"}
                    </span>
                    <span className="text-mak-micro uppercase tracking-[0.12em] text-mak-subtle">
                      {review.rating}/5
                    </span>
                  </div>
                  {review.comment ? (
                    <Text size="small" tone="muted" className="mt-2">
                      {review.comment}
                    </Text>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      {/* Related */}
      {related.length > 0 ? (
        <Section spacing="default">
          <Container>
            <SectionHeader
              eyebrow="You may also like"
              title="Related pieces."
              headingAs="h2"
              className="mb-9"
            />
            <ProductGrid products={related} />
          </Container>
        </Section>
      ) : null}

      {/* Leaves room for the sticky bar so it never covers the footer. */}
      <div aria-hidden="true" className="h-24 lg:hidden" />
      <StickyPurchaseBar product={product} />
    </>
  );
}
