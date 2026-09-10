import type { Metadata } from "next";
import { EmptyState, ButtonLink } from "@/design-system";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      action={
        <ButtonLink href="/" variant="primary" size="md">
          Back to home
        </ButtonLink>
      }
      className="min-h-[60vh]"
    />
  );
}
