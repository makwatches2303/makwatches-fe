import { Heading, Text } from "@/design-system";

/** A single figure worth calling out on its own -- "6-8 business days", etc. */
export function PolicyStat({
  value,
  label,
  caption,
}: {
  value: string;
  label: string;
  caption?: string;
}) {
  return (
    <div className="border-2 border-mak-ink bg-mak-ink px-8 py-10 text-center text-mak-on-ink">
      <Heading level="display" tone="inverse" as="p">
        {value}
      </Heading>
      <Text tone="inverse" className="mt-1 opacity-80">
        {label}
      </Text>
      {caption ? (
        <Text size="small" tone="inverse" className="mt-2 opacity-60">
          {caption}
        </Text>
      ) : null}
    </div>
  );
}
