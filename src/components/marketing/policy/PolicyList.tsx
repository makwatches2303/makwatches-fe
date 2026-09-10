import { Text } from "@/design-system";
import type { ReactNode } from "react";

/**
 * A simple list of short points -- "what to include", or an ordered sequence
 * of steps. `numbered` swaps the bullet for a step numeral; pass it when
 * order matters (a real 1-then-2 procedure), not for decoration.
 */
export function PolicyList({
  items,
  numbered = false,
}: {
  items: ReactNode[];
  numbered?: boolean;
}) {
  const Tag = numbered ? "ol" : "ul";
  return (
    <Tag className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          {numbered ? (
            <span
              aria-hidden="true"
              className="font-display text-mak-small font-extrabold text-mak-accent"
            >
              {i + 1}.
            </span>
          ) : (
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 bg-mak-accent" />
          )}
          <Text size="small" tone="muted">
            {item}
          </Text>
        </li>
      ))}
    </Tag>
  );
}
