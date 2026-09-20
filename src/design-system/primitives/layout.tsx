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
  /**
   * Close an incomplete last row with invisible filler cells. On by default.
   *
   * Pass false when the caller has already made every row complete at every
   * breakpoint -- for instance by hiding the products that would form a
   * partial row. Fillers are counted from the children, and a caller that
   * hides some of its own would otherwise get fillers for rows that no longer
   * exist.
   */
  fill?: boolean;
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
  fill = true,
  className,
  children,
  ...rest
}: RuleGridProps) {
  const { base = 1, sm, md = 2, lg = 3, xl } = cols ?? {};

  // An incomplete last row leaves empty grid tracks with no child to paint
  // .mak-rule-grid's own cell background over them, so the container's
  // divider-colored background shows through as a stray filled-in box --
  // most visibly as a grey square beside the last product in a 2-up mobile
  // grid with an odd number of products. Filler cells (invisible, no
  // content) close those gaps.
  //
  // Every breakpoint the grid defines needs its own count, including base:
  // a column count is only ever "always full" at 1-up, and the product grid
  // opens at 2-up.
  const count = Children.count(children);
  const needed = (columns: number | undefined) =>
    columns ? (columns - (count % columns)) % columns : 0;

  // Written out per breakpoint because Tailwind scans source text statically;
  // an interpolated `${prefix}block` would never be emitted.
  const steps = [
    { needed: needed(base), show: "block", hide: "hidden" },
    ...(sm ? [{ needed: needed(sm), show: "sm:block", hide: "sm:hidden" }] : []),
    { needed: needed(md), show: "md:block", hide: "md:hidden" },
    { needed: needed(lg), show: "lg:block", hide: "lg:hidden" },
    ...(xl ? [{ needed: needed(xl), show: "xl:block", hide: "xl:hidden" }] : []),
  ];

  const fillerCount = fill ? Math.max(...steps.map((step) => step.needed)) : 0;
  const fillers = Array.from({ length: fillerCount }, (_, i) => {
    // One display class per breakpoint at most, emitted only where the
    // filler's visibility actually changes. Naming both `md:block` and
    // `md:hidden` would be decided by the order Tailwind emits them, not by
    // the order they are written here, and `hidden` wins -- which silently
    // dropped fillers wherever two adjacent breakpoints both needed one.
    const classes: string[] = [];
    let visible: boolean | null = null;
    for (const step of steps) {
      const show = i < step.needed;
      if (show !== visible) classes.push(show ? step.show : step.hide);
      visible = show;
    }

    return <div key={`filler-${i}`} aria-hidden="true" className={cn(classes)} />;
  });

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
