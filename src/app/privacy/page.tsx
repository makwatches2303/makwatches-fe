import type { Metadata } from "next";
import Link from "next/link";
import { Text } from "@/design-system";
import {
  PolicyPage,
  PolicySection,
  PolicyCard,
  PolicyCallout,
  PolicyContact,
  MAK_CONTACT,
} from "@/components/marketing/policy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MAK Watches collects, uses, and protects your personal information when you shop with us.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy Policy"
      title="Your trust, protected."
      subtitle="How we collect, use, and safeguard your information."
    >
      <PolicySection number={1} title="Introduction">
        <Text tone="muted">
          This privacy policy sets out how <strong className="text-mak-ink">MAK Watches</strong>{" "}
          uses and protects any information that you give us when you visit our website
          and/or agree to purchase from us.
        </Text>
        <Text tone="muted">
          MAK Watches is committed to ensuring that your privacy is protected. Should we ask
          you to provide certain information by which you can be identified when using this
          website, you can be assured that it will only be used in accordance with this
          privacy statement.
        </Text>
        <PolicyCallout>
          MAK Watches may change this policy from time to time by updating this page. You
          should check this page from time to time to ensure that you adhere to these
          changes.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={2} title="Information We Collect">
        <Text tone="muted">We may collect the following information:</Text>
        <div className="grid gap-4 sm:grid-cols-2">
          <PolicyCard title="Name">
            Your full name for identification and personalization.
          </PolicyCard>
          <PolicyCard title="Contact information">
            Email address and other contact details.
          </PolicyCard>
          <PolicyCard title="Demographic information">
            Postcode, preferences and interests, if required.
          </PolicyCard>
          <PolicyCard title="Survey information">
            Information relevant to customer surveys and offers.
          </PolicyCard>
        </div>
      </PolicySection>

      <PolicySection number={3} title="What We Do With Your Information">
        <Text tone="muted">
          We require this information to understand your needs and provide you with a
          better service, and in particular for the following reasons:
        </Text>
        <div className="grid gap-4 sm:grid-cols-2">
          <PolicyCard>Internal record keeping.</PolicyCard>
          <PolicyCard>Improving our products and services.</PolicyCard>
          <PolicyCard>
            Sending promotional emails about new products, special offers or other
            information.
          </PolicyCard>
          <PolicyCard>
            Contacting you for market research purposes via email, phone, or mail.
          </PolicyCard>
          <PolicyCard>Customizing the website according to your interests.</PolicyCard>
        </div>
      </PolicySection>

      <PolicySection number={4} title="Security">
        <Text tone="muted">
          We are committed to ensuring that your information is secure. In order to prevent
          unauthorised access or disclosure, we have put in place suitable physical,
          electronic and managerial procedures to safeguard and secure the information we
          collect online.
        </Text>
        <PolicyCard title="Payments & card data">
          Online payments are processed by secure third-party payment gateways such as
          Razorpay. We do not store your full card details on our systems. Your payment
          information is handled by the payment provider in accordance with their security
          standards and privacy policy.
        </PolicyCard>
      </PolicySection>

      <PolicySection number={5} title="How We Use Cookies">
        <Text tone="muted">
          A cookie is a small file which asks permission to be placed on your computer&apos;s
          hard drive. Once you agree, the file is added and the cookie helps analyze web
          traffic or lets you know when you visit a particular site.
        </Text>
        <Text tone="muted">
          Cookies allow web applications to respond to you as an individual. The web
          application can tailor its operations to your needs, likes and dislikes by
          gathering and remembering information about your preferences.
        </Text>
        <PolicyCard title="Traffic log cookies">
          We use traffic log cookies to identify which pages are being used. This helps us
          analyze data about webpage traffic and improve our website in order to tailor it
          to customer needs. We only use this information for statistical analysis purposes
          and then the data is removed from the system.
        </PolicyCard>
        <PolicyCallout title="Your choice">
          You can choose to accept or decline cookies. Most web browsers automatically
          accept cookies, but you can usually modify your browser setting to decline cookies
          if you prefer. This may prevent you from taking full advantage of the website.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={6} title="Controlling Your Personal Information">
        <Text tone="muted">
          You may choose to restrict the collection or use of your personal information in
          the following ways:
        </Text>
        <PolicyCard>
          Whenever you are asked to fill in a form on the website, look for the box that you
          can click to indicate that you do not want the information to be used by anybody
          for direct marketing purposes.
        </PolicyCard>
        <PolicyCard>
          If you have previously agreed to us using your personal information for direct
          marketing purposes, you may change your mind at any time by writing to or emailing
          us at{" "}
          <Link href={`mailto:${MAK_CONTACT.email}`} className="text-mak-accent underline">
            {MAK_CONTACT.email}
          </Link>
          .
        </PolicyCard>
        <PolicyCard title="Third party information">
          We will not sell, distribute or lease your personal information to third parties
          unless we have your permission or are required by law to do so. We may use your
          personal information to send you promotional information about third parties
          which we think you may find interesting if you tell us that you wish this to
          happen.
        </PolicyCard>
        <PolicyCallout title="Corrections">
          If you believe that any information we are holding on you is incorrect or
          incomplete, please contact us as soon as possible. We will promptly correct any
          information found to be incorrect.
        </PolicyCallout>
      </PolicySection>

      <PolicySection number={7} title="Contact Us">
        <Text tone="muted">
          If you have any questions about this Privacy Policy or wish to exercise your
          rights, please contact us:
        </Text>
        <PolicyContact />
      </PolicySection>
    </PolicyPage>
  );
}
