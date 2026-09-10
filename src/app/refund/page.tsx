import type { Metadata } from "next";
import { Text, Heading } from "@/design-system";
import {
  PolicyPage,
  PolicySection,
  PolicyCard,
  PolicyCallout,
  PolicyStat,
  PolicyList,
  PolicyContact,
} from "@/components/marketing/policy";

export const metadata: Metadata = {
  title: "Refund & Return Policy",
  description:
    "MAK Watches' policy on returns, exchanges, and refunds for luxury watch purchases.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <PolicyPage
      eyebrow="Cancellation & Refund"
      title="Your satisfaction, our commitment."
      subtitle="How cancellations, refunds, and replacements work."
    >
      <PolicySection number={1} title="Our Commitment">
        <Text tone="muted">
          <strong className="text-mak-ink">MAK Watches</strong> believes in helping its
          customers as far as possible, and has therefore a liberal cancellation policy.
        </Text>
        <PolicyCallout>
          We strive to provide maximum flexibility while ensuring fair business practices.
          Your satisfaction is our top priority.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={2} title="Cancellation Policy">
        <PolicyCallout tone="success" title="3-5 day window">
          Cancellations will be considered only if the request is made within 3-5 days of
          placing the order.
        </PolicyCallout>
        <PolicyCard title="Important notice">
          The cancellation request may not be entertained if the orders have been
          communicated to the vendors/merchants and they have initiated the process of
          shipping them.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={3} title="Refund & Replacement">
        <Text tone="muted">
          We ensure quality products, but in certain circumstances, refunds or replacements
          may be provided.
        </Text>

        <div>
          <Heading level="subheading" as="h3" className="mb-3">
            Quality-related refunds
          </Heading>
          <PolicyCard>
            Refund/replacement can be made if the customer establishes that the quality of
            product delivered is not good.
          </PolicyCard>
        </div>

        <div>
          <Heading level="subheading" as="h3" className="mb-3">
            Damaged or defective items
          </Heading>
          <PolicyCallout title="Report within 3-5 days">
            In case of receiving damaged or defective items, please report the same to our
            Customer Service team within 3-5 days of receiving the products.
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
            within 3-5 days of receiving the product. The Customer Service Team, after
            looking into your complaint, will take an appropriate decision.
          </PolicyCard>
        </div>
      </PolicySection>

      <PolicySection number={4} title="Manufacturer Warranty">
        <PolicyCard title="Products with manufacturer warranty">
          In case of complaints regarding products that come with a warranty from
          manufacturers, please refer the issue to them directly.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={5} title="Refund Processing Time">
        <Text tone="muted">
          Once your refund is approved by MAK Watches, we process it as quickly as possible.
        </Text>
        <PolicyStat
          value="6-8"
          label="Business Days"
          caption="For the refund to be processed to the end customer"
        />
        <PolicyCallout>
          The actual credit to your account may take additional time depending on your bank
          or payment provider. If you paid using a third-party payment gateway such as
          Razorpay, the refund will be routed back via the same method, subject to the
          gateway/bank&apos;s policies and timelines. We do not issue cash refunds for
          online payments.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={6} title="How to Request Cancellation or Refund">
        <PolicyContact />
        <div>
          <Heading level="subheading" as="h4" className="mb-3">
            Information to include
          </Heading>
          <PolicyList
            items={[
              "Order number and date.",
              "Product details.",
              "Reason for cancellation or refund.",
              "Photos (if applicable for damaged items).",
            ]}
          />
        </div>
      </PolicySection>
    </PolicyPage>
  );
}
