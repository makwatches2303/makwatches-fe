"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { CloseIcon, SearchIcon, Text } from "@/design-system";

/**
 * In-listing search for a catalog page.
 *
 * Scoped by construction: it only ever writes `q` into the current URL, and
 * the listing that renders it already fetches with its own scope
 * (`mainCategory: "Men"`, a collection, a category path). So a search from the
 * men's page is `?q=…` *plus* that scope, and can never return a women's
 * piece -- there is no second search system and no unscoped catalogue query
 * behind this box.
 *
 * State lives in the URL, exactly like the filters and the sort in
 * ShopControls: a searched view is shareable, bookmarkable and
 * back-button-correct, and the results are rendered on the server.
 *
 * `router.replace` rather than `push` while typing, so a five-letter query
 * does not leave five entries in the history for the shopper to walk back
 * through. Navigation runs in a transition, so the current results stay on
 * screen while the next set streams in.
 */

export interface CatalogSearchProps {
  /** Accessible label for the field, e.g. "Search men's watches". */
  label: string;
  /** Visible placeholder. Falls back to the label. */
  placeholder?: string;
  /** How long to wait after the last keystroke before navigating, in ms. */
  debounceMs?: number;
  className?: string;
}

export function CatalogSearch({
  label,
  placeholder,
  debounceMs = 350,
  className,
}: CatalogSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const fieldId = useId();

  const urlQuery = useMemo(
    () => searchParams.get("q") ?? "",
    [searchParams]
  );

  const [value, setValue] = useState(urlQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The last term this component put into the URL. Used to tell our own
  // navigation apart from one that came from somewhere else.
  const committed = useRef<string | null>(null);

  // Re-seed from the URL when it changes underneath us -- the back button, a
  // filter reset, or a link into this listing with a query already on it.
  //
  // Never for a change we caused. Debounced navigation lands a few hundred
  // milliseconds after the keystroke that triggered it, by which time the
  // shopper has usually typed more; re-seeding then would rewind the field to
  // the term that is only now arriving in the URL and eat their next letters.
  useEffect(() => {
    if (committed.current !== null && committed.current === urlQuery) return;
    committed.current = null;
    setValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  /** Write `term` into the URL, preserving every other param. */
  const commit = useCallback(
    (term: string) => {
      const next = new URLSearchParams(searchParams.toString());
      const trimmed = term.trim();

      committed.current = trimmed;
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");

      // A different result set invalidates the page number, the same way a
      // filter change does.
      next.delete("page");

      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => commit(next), debounceMs);
    },
    [commit, debounceMs]
  );

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Enter means "now", so the pending debounce is dropped rather than
      // firing a second, identical navigation behind this one.
      if (timer.current) clearTimeout(timer.current);
      commit(value);
    },
    [commit, value]
  );

  const onClear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setValue("");
    commit("");
  }, [commit]);

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn("w-full", className)}
    >
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>

      <div
        className={cn(
          "relative flex w-full items-center border-2 border-mak-divider bg-mak-bg transition-colors",
          "focus-within:border-mak-line",
          pending && "opacity-70"
        )}
      >
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-3 text-mak-subtle"
          aria-hidden="true"
        />

        <input
          id={fieldId}
          type="search"
          name="q"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? label}
          autoComplete="off"
          // The browser's own clear affordance would sit beside ours, and it
          // does not fire a change event consistently across engines.
          className={cn(
            "min-h-11 w-full bg-transparent py-2 pl-10 pr-10 text-mak-body text-mak-ink",
            "placeholder:text-mak-subtle focus:outline-none",
            "[&::-webkit-search-cancel-button]:appearance-none"
          )}
        />

        {value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 inline-flex size-8 items-center justify-center text-mak-subtle transition-colors hover:text-mak-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mak-accent"
          >
            <CloseIcon size={16} />
          </button>
        ) : null}
      </div>

      {urlQuery ? (
        <Text size="small" tone="muted" className="mt-2">
          Showing results for &ldquo;{urlQuery}&rdquo; in this collection.
        </Text>
      ) : null}
    </form>
  );
}
