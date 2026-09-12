import { Children, type ElementType, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Layout primitives.
 *
 * Server components: none of these need interactivity, so none carry a
 * "use client" boundary.
 */

// ── Container ───────────────────────────────────────────────────────────────

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `default` is the 1400px editorial measure from the reference.
   * `narrow` is for long-form copy, `wide` for full-bleed-adjacent sections.
   */
  size?: "narrow" | "default" | "wide" | "full";
  as?: ElementType;
  children?: ReactNode;
}

const CONTAINER_SIZES = {
  narrow: "max-w-3xl",
  default: "max-w-[1400px]",
  wide: "max-w-[1720px]",
  full: "max-w-none",
} as const;

/** Horizontal measure with the system's responsive gutters. */
export function Container({
  size = "default",
  as: Tag = "div",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        CONTAINER_SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Vertical rhythm. The reference alternates dense and generous sections. */
  spacing?: "none" | "tight" | "default" | "loose";
  /**
   * Ground. `ink` is the dark storytelling ground; `accent` is the poster
   * treatment and should be used sparingly -- at most once per page.
   */
  tone?: "default" | "surface" | "ink" | "accent";
  /** Draw the 2px rule above the section. */
  ruled?: boolean;
  as?: ElementType;
  children?: ReactNode;
}

const SECTION_SPACING = {
  none: "",
  tight: "py-10 md:py-14",
  default: "py-16 md:py-24",
  loose: "py-24 md:py-36",
} as const;

const SECTION_TONE = {
  default: "bg-mak-bg text-mak-ink",
  surface: "bg-mak-surface text-mak-ink",
  ink: "bg-mak-ink text-mak-on-ink",
  accent: "bg-mak-accent text-mak-on-accent",
} as const;

/** A full-width horizontal band. Pair with Container for the inner measure. */
export function Section({
  spacing = "default",
  tone = "default",
  ruled = false,
  as: Tag = "section",
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <Tag
      className={cn(
        SECTION_SPACING[spacing],
        SECTION_TONE[tone],
        ruled && "border-t-2 border-mak-line",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────────

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** `rule` is the structural 2px line; `hairline` is the subtler divider. */
  weight?: "rule" | "hairline";
  tone?: "ink" | "inverse";
}

/** A horizontal rule. Never soften this into a 1px light-grey line. */
export function Divider({
  weight = "rule",
  tone = "ink",
  className,
  ...rest
}: DividerProps) {
  return (
    <hr
      className={cn(
        "w-full border-0",
        weight === "rule" ? "h-0.5" : "h-px",
        tone === "ink"
          ? weight === "rule"
            ? "bg-mak-line"
            : "bg-mak-divider"
          : "bg-mak-on-ink/40",
        className
      )}
      {...rest}
    />
  );
}

// ── RuleGrid ────────────────────────────────────────────────────────────────

export interface RuleGridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Columns per breakpoint. Defaults follow the approved responsive strategy:
   * 1-up mobile, 2-up tablet, 3-up desktop.
   */
  cols?: {
    base?: 1 | 2 | 3 | 4;
    sm?: 1 | 2 | 3 | 4;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  /** Drop the outer 2px border, for grids that sit inside another ruled box. */
  bordered?: boolean;
  children?: ReactNode;
}

/*
 * Column classes are written out in full rather than interpolated. Tailwind
 * scans source text statically, so a template literal like `grid-cols-${n}`
 * would never be emitted.
 */
const BASE_COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

const SM_COLS = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
} as const;

const MD_COLS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
} as const;

const LG_COLS = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
} as const;

const XL_COLS = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
} as const;

/**
 * The signature hairline grid.
 *
 * The 2px gap *is* the rule: the grid paints the divider color, each cell
 * repaints the ground on top, and the gap shows through as a crisp line. The
 * `.mak-rule-grid` class in the token layer handles the cell background, so
 * children need no background of their own.
 *
 * This is the structural motif of the whole system -- stat rows, category
 * tiles, product grids and spec tables are all this component.
 */
export function RuleGrid({
  cols,
  bordered = true,
  className,
  children,
  ...rest
}: RuleGridProps) {
  const { base = 1, sm, md = 2, lg = 3, xl } = cols ?? {};

  // An incomplete last row leaves empty grid tracks with no child to paint
  // .mak-rule-grid's own cell background over them, so the container's
  // divider-colored background shows through as a stray filled-in box.
  // Filler cells (invisible, no content) close those gaps. base=1 never
  // has this problem -- a single column is always "full" -- so fillers
  // only ever need to render from md upward.
  const count = Children.count(children);
  const neededAtSm = sm ? (sm - (count % sm)) % sm : 0;
  const neededAtMd = md ? (md - (count % md)) % md : 0;
  const neededAtLg = lg ? (lg - (count % lg)) % lg : 0;
  const neededAtXl = xl ? (xl - (count % xl)) % xl : 0;
  const fillerCount = Math.max(neededAtSm, neededAtMd, neededAtLg, neededAtXl);
  const fillers = Array.from({ length: fillerCount }, (_, i) => (
    <div
      key={`filler-${i}`}
      aria-hidden="true"
      className={cn(
        "hidden",
        Boolean(sm) && i < neededAtSm && "sm:block md:hidden",
        i < neededAtMd && "md:block lg:hidden",
        i < neededAtLg && (Boolean(xl) ? "lg:block xl:hidden" : "lg:block"),
        Boolean(xl) && i < neededAtXl && "xl:block"
      )}
    />
  ));

  return (
    <div
      className={cn(
        "mak-rule-grid",
        BASE_COLS[base],
        sm && SM_COLS[sm],
        MD_COLS[md],
        LG_COLS[lg],
        xl && XL_COLS[xl],
        !bordered && "border-0",
        className
      )}
      {...rest}
    >
      {children}
      {fillers}
    </div>
  );
}

/** One cell of a RuleGrid. Optional -- any element works as a child. */
export function RuleGridCell({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 md:p-8", className)} {...rest}>
      {children}
    </div>
  );
}
