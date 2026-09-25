import type { Metadata } from "next";
import { Text, Heading } from "@/design-system";
import {
  PolicyPage,
  PolicySection,
  PolicyCard,
  PolicyCallout,
  PolicyList,
  PolicyContact,
} from "@/components/marketing/policy";

export const metadata: Metadata = {
  title: "Replacement Policy",
  description:
    "How MAK Watches replaces damaged, defective or not-as-described pieces reported within 5 days of delivery.",
  alternates: { canonical: "/replacement" },
};

export default function ReplacementPage() {
  return (
    <PolicyPage
      eyebrow="Replacement Policy"
      title="Your satisfaction, our commitment."
      subtitle="How replacements work for damaged, defective or not-as-described pieces."
    >
      <PolicySection number={1} title="Replacement Window">
        <PolicyCallout tone="success" title="5-day window">
          Replacement requests are considered only if they are reported to our Customer
          Service team within 5 days of receiving the product.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={2} title="When a Replacement Applies">
        <Text tone="muted">
          We ensure quality products, but in the following circumstances a replacement may
          be provided.
        </Text>

        <div>
          <Heading level="subheading" as="h3" className="mb-3">
            Quality issues
          </Heading>
          <PolicyCard>
            A replacement can be made if the customer establishes that the quality of the
            product delivered is not good.
          </PolicyCard>
        </div>

        <div>
          <Heading level="subheading" as="h3" className="mb-3">
            Damaged or defective items
          </Heading>
          <PolicyCallout title="Report within 5 days">
            In case of receiving damaged or defective items, please report the same to our
            Customer Service team within 5 days of receiving the products.
          </PolicyCallout>
          <PolicyList
            numbered
            items={[
              "Contact our Customer Service team immediately upon discovering the issue.",
              "The merchant will check and determine the issue at their end before processing the request.",
            ]}
          />
        </div>

        <div>
          <Heading level="subheading" as="h3" className="mb-3">
            Product not as expected
          </Heading>
          <PolicyCard>
            In case you feel that the product received is not as shown on the site or as per
            your expectations, you must bring it to the notice of our customer service
            within 5 days of receiving the product. The Customer Service Team, after
            looking into your complaint, will take an appropriate decision.
          </PolicyCard>
        </div>
      </PolicySection>

      <PolicySection number={3} title="Manufacturer Warranty">
        <PolicyCard title="Products with manufacturer warranty">
          In case of complaints regarding products that come with a warranty from
          manufacturers, please refer the issue to them directly.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={4} title="How to Request a Replacement">
        <PolicyContact />
        <div>
          <Heading level="subheading" as="h4" className="mb-3">
            Information to include
          </Heading>
          <PolicyList
            items={[
              "Order number and date.",
              "Product details.",
              "Reason for replacement.",
              "Photos (if applicable for damaged items).",
            ]}
          />
        </div>
      </PolicySection>
    </PolicyPage>
  );
}
