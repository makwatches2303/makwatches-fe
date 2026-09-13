"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  Container,
  IconButton,
  CloseIcon,
  LoadingState,
  SearchIcon,
  useDebouncedValue,
  useEscapeKey,
  useFocusTrap,
  useMounted,
  useScrollLock,
} from "@/design-system";
import { search as searchApi } from "@/lib/api/search";
import type { SearchResult } from "@/lib/api/types";
import { selectSearchOpen, useUIStore } from "@/store/ui";
import { trackSearch } from "@/lib/analytics";

import { SearchSuggestions } from "./SearchSuggestions";

const EMPTY_RESULT: SearchResult = {
  query: "",
  products: [],
  collections: [],
  categories: [],
  total: 0,
};

const RECENT_KEY = "mak-recent-searches";
const MAX_RECENT = 6;

/** Read recent searches, tolerating unavailable storage. */
function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeRecent(queries: string[]): void {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(queries));
  } catch {
    // Private mode, or storage disabled. Recent searches are a convenience.
  }
}

/**
 * The full-width search overlay.
 *
 * Drops from the top of the viewport rather than opening a separate page, so
 * the shopper never loses their place. Searches as you type against
 * /api/v1/search, debounced.
 *
 * Every request is sequenced: a slow response for an earlier query can no
 * longer land after a faster response for a later one and overwrite it.
 */
export function SearchOverlay() {
  const open = useUIStore(selectSearchOpen);
  const close = useUIStore((state) => state.close);
  const router = useRouter();
  const mounted = useMounted();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  const requestId = useRef(0);

  const debouncedQuery = useDebouncedValue(query, 250);

  useScrollLock(open);
  useEscapeKey(open, close);

  // Load recent searches once the overlay is first opened.
  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  // Focus the field when the overlay opens; clear when it closes.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setResult(EMPTY_RESULT);
      setFailed(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const term = debouncedQuery.trim();
    if (!term) {
      setResult(EMPTY_RESULT);
      setLoading(false);
      setFailed(false);
      return;
    }

    // Monotonic id: only the newest in-flight request may commit its result.
    requestId.current += 1;
    const id = requestId.current;

    setLoading(true);
    setFailed(false);

    searchApi(term)
      .then((next) => {
        if (id !== requestId.current) return;
        setResult(next);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setFailed(true);
        setResult({ ...EMPTY_RESULT, query: term });
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });
  }, [debouncedQuery, open]);

  const rememberQuery = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    const next = [trimmed, ...readRecent().filter((q) => q !== trimmed)].slice(
      0,
      MAX_RECENT
    );
    writeRecent(next);
    setRecent(next);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;

    trackSearch(term, result.total);
    rememberQuery(term);
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  if (!mounted) return null;

  return (
    <div
      className={cn("mak fixed inset-0 z-100", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "absolute inset-0 bg-mak-ink/50 transition-opacity duration-300 ease-mak",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto overscroll-contain",
          "border-b-2 border-mak-line bg-mak-bg",
          "transition-transform duration-[350ms] ease-mak",
          open ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <Container className="py-5">
          <form onSubmit={submit} role="search" className="flex items-center gap-4">
            <SearchIcon size={22} className="shrink-0 text-mak-accent" />

            <label htmlFor="mak-search-input" className="sr-only">
              Search timepieces and collections
            </label>
            <input
              id="mak-search-input"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search timepieces, collections…"
              autoComplete="off"
              className={cn(
                "min-w-0 flex-1 border-0 bg-transparent outline-none",
                "font-display text-xl font-extrabold tracking-[-0.01em] text-mak-ink md:text-2xl",
                "placeholder:text-mak-subtle"
              )}
            />

            {query.trim() && !loading && (
              <span className="hidden shrink-0 text-mak-label uppercase tracking-[0.12em] text-mak-accent sm:block">
                {result.total} results
              </span>
            )}

            <IconButton label="Close search" onClick={close}>
              <CloseIcon />
            </IconButton>
          </form>

          {loading ? (
            <LoadingState label="Searching" className="py-12" />
          ) : failed ? (
            <p role="alert" className="py-10 text-center text-mak-small text-mak-error">
              Search is unavailable right now. Please try again.
            </p>
          ) : (
            <SearchSuggestions
              result={result}
              recentSearches={recent}
              onSelectRecent={(term) => setQuery(term)}
              onNavigate={() => {
                rememberQuery(query);
                close();
              }}
            />
          )}
        </Container>
      </div>
    </div>
  );
}
