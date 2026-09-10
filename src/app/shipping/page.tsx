import type { Metadata } from "next";
import { Text, Heading } from "@/design-system";
import {
  PolicyPage,
  PolicySection,
  PolicyCard,
  PolicyCallout,
  PolicyStat,
  PolicyContact,
  MAK_CONTACT,
} from "@/components/marketing/policy";

export const metadata: Metadata = {
  title: "Shipping Information",
  description:
    "Delivery timelines, shipping charges, and order tracking for MAK Watches orders across India.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Shipping Policy"
      title="Reliable delivery, every order."
      subtitle="How we get your timepiece from us to your doorstep."
    >
      <PolicySection number={1} title="Shipping Overview">
        <Text tone="muted">
          <strong className="text-mak-ink">MAK Watches</strong> ensures safe and timely
          delivery of your orders through trusted shipping partners.
        </Text>
        <PolicyCallout>
          We work with registered courier companies and postal services to deliver your
          precious timepieces safely to your doorstep.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={2} title="Shipping Methods">
        <div>
          <Heading level="subheading" as="h3" className="mb-3">
            Domestic shipping
          </Heading>
          <PolicyCard>
            For domestic buyers, orders are shipped through registered domestic courier
            companies and/or speed post only.
          </PolicyCard>
        </div>
      </PolicySection>

      <PolicySection number={3} title="Processing & Delivery Time">
        <PolicyStat
          value="6-8"
          label="Business Days"
          caption="Standard shipping timeframe"
        />
        <PolicyCard title="Standard shipping timeline">
          Orders are shipped within 6-8 days or as per the delivery date agreed at the time
          of order confirmation.
        </PolicyCard>
        <PolicyCard title="Delivery subject to courier norms">
          Actual delivery of the shipment is subject to courier company / post office norms
          and operational schedules.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={4} title="Our Guarantee">
        <PolicyCallout tone="success" title="MAK Watches guarantee">
          MAK Watches guarantees to hand over the consignment to the courier company or
          postal authorities within 6-8 days from the date of the order and payment or as
          per the delivery date agreed at the time of order confirmation.
        </PolicyCallout>
        <PolicyCallout title="Important notice">
          MAK Watches is not liable for any delay in delivery by the courier company /
          postal authorities once the shipment has been handed over to them.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={5} title="Delivery Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <PolicyCard title="Physical delivery">
            Delivery of all orders will be made to the address provided by the buyer during
            checkout.
          </PolicyCard>
          <PolicyCard title="Service confirmation">
            Delivery of our services will be confirmed on your mail ID as specified during
            registration.
          </PolicyCard>
        </div>
        <PolicyCallout title="Verify your address">
          Please ensure that the delivery address provided is accurate and complete. We
          cannot be held responsible for deliveries made to incorrect addresses provided by
          the buyer.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={6} title="Need Help?">
        <Text tone="muted">
          For any issues in utilizing our services or tracking your shipment, you may
          contact our helpdesk:
        </Text>
        <PolicyContact />
        <Text size="small" tone="subtle">
          Store location: {MAK_CONTACT.address.join(", ")}.
        </Text>
      </PolicySection>
    </PolicyPage>
  );
}
