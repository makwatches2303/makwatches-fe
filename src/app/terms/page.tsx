import type { Metadata } from "next";
import { Text } from "@/design-system";
import {
  PolicyPage,
  PolicySection,
  PolicyCard,
  PolicyCallout,
  PolicyContact,
} from "@/components/marketing/policy";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing your use of the MAK Watches website and purchases.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms of Service"
      title="Your agreement with us."
      subtitle="The terms governing your use of this site and your purchases."
    >
      <PolicySection number={1} title="Definitions">
        <Text tone="muted">For the purpose of these Terms and Conditions:</Text>
        <PolicyCard>
          The terms &quot;we&quot;, &quot;us&quot;, &quot;our&quot; refer to{" "}
          <strong className="text-mak-ink">MAK Watches</strong>, whose registered/operational
          office is at Shree Ganesh Watch, Matwa Street, near Balaji Cineplex, Jetpur,
          Rajkot, Gujarat - 360370.
        </PolicyCard>
        <PolicyCard>
          The terms &quot;you&quot;, &quot;your&quot;, &quot;user&quot;, &quot;visitor&quot;
          shall mean any natural or legal person who is visiting our website and/or agreed
          to purchase from us.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={2} title="Acceptance of Terms">
        <PolicyCallout>
          Your use of the website and/or purchase from us are governed by the following
          Terms and Conditions. By accessing our website or making a purchase, you
          acknowledge that you have read, understood, and agree to be bound by these terms.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={3} title="Website Content">
        <Text tone="muted">
          The content of the pages of this website is subject to change without notice.
        </Text>
        <div className="grid gap-4 sm:grid-cols-2">
          <PolicyCard title="Warranty">
            While we strive to ensure that all information and materials on our website are
            accurate, up-to-date, and reliable, occasional variations or updates may occur.
            We recommend reviewing product details carefully to ensure they meet your
            personal preferences and requirements.
          </PolicyCard>
          <PolicyCard title="Acknowledgment">
            You acknowledge that such information and materials may contain inaccuracies or
            errors and we expressly exclude liability for any such inaccuracies or errors to
            the fullest extent permitted by law.
          </PolicyCard>
        </div>
      </PolicySection>

      <PolicySection number={4} title="Use at Your Own Risk">
        <PolicyCard>
          Your use of any information or materials on our website and/or product pages is
          entirely at your own risk, for which we shall not be liable. It shall be your own
          responsibility to ensure that any products, services or information available
          through our website and/or product pages meet your specific requirements.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={5} title="Intellectual Property">
        <Text tone="muted">
          Our website contains material which is owned by or licensed to us. This material
          includes, but is not limited to, design, layout, appearance, and graphics.
        </Text>
        <PolicyCallout title="Important">
          Reproduction is prohibited other than in accordance with the copyright notice,
          which forms part of these terms and conditions. All trademarks reproduced in our
          website which are not the property of, or licensed to, the operator are
          acknowledged on the website.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={6} title="Unauthorized Use">
        <PolicyCallout tone="error" title="Legal consequences">
          Unauthorized use of information provided by us shall give rise to a claim for
          damages and/or be a criminal offense.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={7} title="External Links">
        <PolicyCard>
          From time to time our website may include links to other websites. These links are
          provided for your convenience to provide further information.
        </PolicyCard>
        <PolicyCard title="Linking policy">
          You may not create a link to our website from another website or document without
          MAK Watches&apos;s prior written consent.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={8} title="Governing Law & Disputes">
        <PolicyCard>
          Any dispute arising out of use of our website and/or purchase with us and/or any
          engagement with us is subject to the laws of India.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={9} title="Payments, Security & Transaction Limits">
        <PolicyCard title="Accepted payment methods">
          We accept payments through secure third-party gateways such as Razorpay. Supported
          methods may include UPI, major credit/debit cards, netbanking, and popular wallets
          (availability may vary by issuer and location).
        </PolicyCard>
        <PolicyCallout>
          Payments are processed by the payment provider on their secure infrastructure. MAK
          Watches does not collect or store your full card details. Your use of a
          third-party payment method is also governed by that provider&apos;s terms and
          privacy policy.
        </PolicyCallout>
        <PolicyCard title="Order confirmation">
          Your order is confirmed only after we receive payment authorization/confirmation
          from the gateway. In case a payment is debited but not captured, it is usually
          reversed automatically by your issuing bank/gateway in line with their timelines.
        </PolicyCard>
        <PolicyCard title="Transaction limits & declines">
          We shall be under no liability whatsoever in respect of any loss or damage arising
          directly or indirectly out of the decline of authorization for any transaction,
          including where the cardholder has exceeded preset limits set by the bank or
          gateway or where risk checks fail.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={10} title="Contact Information">
        <Text tone="muted">
          If you have any questions about these Terms &amp; Conditions, please contact us:
        </Text>
        <PolicyContact />
      </PolicySection>
    </PolicyPage>
  );
}
