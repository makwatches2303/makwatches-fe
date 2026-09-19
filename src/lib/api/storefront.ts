/**
 * The admin-managed storefront presentation layer.
 *
 * Mirrors makwatches-be/internal/models/storefront.go.
 *
 * This is the source of truth for what the storefront shows: hero copy, which
 * sections exist, and which slice of the catalogue each product rail displays.
 * Nothing here is hard-wired to today's data — a rail names a *rule*
 * ("latest", "category: Men"), never a fixed list of product ids, so it keeps
 * working as the catalogue turns over.
 */

export interface CtaLink {
  label: string;
  href: string;
}

export interface HeroContent {
  enabled: boolean;
  eyebrow: string;
  /** One entry per rendered line. */
  headlineLines: string[];
  supporting: string;
  /** Omits the "Priced from" clause when absent. */
  pricedFrom?: number | null;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
}

export interface TrustContent {
  enabled: boolean;
  items: string[];
}

export interface StatItem {
  value: string;
  label: string;
  countUp: boolean;
}

export interface StatsContent {
  enabled: boolean;
  items: StatItem[];
}

export interface SpecEntry {
  key: string;
  value: string;
}

export interface CraftPanelContent {
  number: string;
  title: string;
  body: string;
  specs: SpecEntry[];
  image?: string;
}

export interface CraftContent {
  enabled: boolean;
  eyebrow: string;
  panels: CraftPanelContent[];
}

export interface HouseContent {
  enabled: boolean;
  eyebrow: string;
  title: string;
  body: string;
  cta: CtaLink;
  image?: string;
}

export interface PosterContent {
  enabled: boolean;
  headlineLines: string[];
  body: string;
  emailLabel: string;
  submitLabel: string;
  note: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

/**
 * The optional 3D showroom.
 *
 * `source`/`value` name a selection rule, exactly as a product rail does, so
 * the showroom keeps up with the catalogue instead of pinning fixed ids.
 */
export interface BoutiqueContent {
  enabled: boolean;
  eyebrow: string;
  title: string;
  body: string;
  source: ProductRail["source"];
  value?: string;
  limit: number;
}

export interface FooterContent {
  tagline: string;
  social: SocialLink[];
}

export interface MarqueeContent {
  enabled: boolean;
  useCategoryNames: boolean;
  terms: string[];
  durationSeconds: number;
}

export interface PolicyPanel {
  enabled: boolean;
  title: string;
  body: string;
}

export interface BoxContentsPolicy {
  enabled: boolean;
  title: string;
  items: string[];
}

export interface PoliciesContent {
  shipping: PolicyPanel;
  returns: PolicyPanel;
  warranty: PolicyPanel;
  boxContents: BoxContentsPolicy;
}

/** How a rail selects its products. Names a rule, never fixed ids. */
export type RailSource =
  | "latest"
  | "featured"
  | "bestseller"
  | "newArrival"
  | "category"
  | "subcategory"
  | "collection";

export interface ProductRail {
  id: string;
  enabled: boolean;
  position: number;
  eyebrow: string;
  title: string;
  source: RailSource;
  /** Parameterises the sources that need it (a category or collection name). */
  value?: string;
  limit: number;
  /** Render the chip/sort controls, as the reference's collection band does. */
  filterable: boolean;
  viewAll: CtaLink;
  tone?: "default" | "surface";
}

/** What a nav item points at. Empty means a plain link. */
export type NavKind = "link" | "category" | "collection" | "external" | "promo";

/**
 * One entry in a navigation menu.
 *
 * Deliberately not a mega-menu schema. It carries what the storefront renders
 * today plus the fields a richer menu will need, so dropdowns and category
 * pickers become an admin-UI change rather than a schema migration.
 */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
  kind?: NavKind;
  value?: string;
  external?: boolean;
  badge?: string;
  /** Backs future dropdowns. Rendered flat today. */
  children?: NavItem[];
}

export interface FooterColumn {
  id: string;
  heading: string;
  enabled: boolean;
  order: number;
  items: NavItem[];
}

export interface NavigationContent {
  /** Header nav and the top of the mobile menu. */
  primary: NavItem[];
  /** Customer-care list in the mobile menu. */
  support: NavItem[];
  /** Footer link columns. */
  footer: FooterColumn[];
}

/** A category tile references the live tree; it never stores product ids. */
export type TileSource = "category" | "subcategory";

export interface CategoryTileConfig {
  id: string;
  enabled: boolean;
  order: number;
  source: TileSource;
  /** "Men", or "Men > Gold watch" for a subcategory. */
  value: string;
  /** Overrides; empty falls back to the live category's own values. */
  label?: string;
  subtitle?: string;
  image?: string;
  href?: string;
}

export interface CategoryTilesContent {
  enabled: boolean;
  eyebrow: string;
  title: string;
  /**
   * Derive one tile per subcategory from the live tree, in tree order.
   *
   * This is itself a configurable rule, not frontend logic: a fresh install
   * shows the whole catalogue without curation, and the section stays correct
   * as categories are added. Turning it off hands full control to `tiles`.
   */
  autoFromCategories: boolean;
  tiles: CategoryTileConfig[];
}

/**
 * The editorial header of one catalog listing page.
 *
 * Copy only. Which products the page shows is decided by the route's own
 * scope, which nothing here can widen -- `/men` stays the Men category tree
 * whatever an admin types above it.
 */
export interface ListingHeader {
  eyebrow: string;
  title: string;
  description: string;
}

/**
 * Header copy for the listing pages whose headings are editorial.
 *
 * /collections/[slug] and /category/[slug] are deliberately absent: they are
 * headed by the collection's and the category's own names, which come from the
 * catalogue itself.
 */
export interface ListingPagesContent {
  /** /shop -- the whole catalogue. */
  collection: ListingHeader;
  /** /collections -- the "shop by category" front doors. */
  categories: ListingHeader;
  men: ListingHeader;
  women: ListingHeader;
}

export interface StorefrontContent {
  navigation: NavigationContent;
  categoryTiles: CategoryTilesContent;
  listings: ListingPagesContent;
  hero: HeroContent;
  trust: TrustContent;
  stats: StatsContent;
  craft: CraftContent;
  house: HouseContent;
  poster: PosterContent;
  boutique: BoutiqueContent;
  footer: FooterContent;
  marquee: MarqueeContent;
  policies: PoliciesContent;
  rails: ProductRail[];
  updatedAt?: string;
}

/**
 * What the storefront renders before an admin has configured anything, and
 * whenever the settings endpoint cannot be reached.
 *
 * Mirrors models.DefaultStorefrontContent. Sections whose content would be a
 * factual claim about the business — service terms, statistics, manufacturing
 * specifications — default to disabled, so the storefront degrades to truthful
 * and incomplete rather than complete and invented.
 */
export const DEFAULT_STOREFRONT: StorefrontContent = {
  // The wording /shop, /men and /women used to hardcode, kept verbatim so
  // moving it into the admin changed nothing visible. Mirrors
  // models.DefaultStorefrontContent's Listings block.
  listings: {
    collection: {
      eyebrow: "The collection",
      title: "Every watch we make.",
      description:
        "The complete MAK catalogue. Filter by brand, price and availability.",
    },
    categories: {
      eyebrow: "Shop by category",
      title: "Shop by Category",
      description:
        "Find the right timepiece for every style, occasion and generation.",
    },
    men: { eyebrow: "For him", title: "The men's edit.", description: "" },
    women: { eyebrow: "For her", title: "The women's edit.", description: "" },
  },

  // Reproduces the reference navigation exactly, so moving it out of the
  // frontend loses no functionality. Mirrors models.DefaultStorefrontContent.
  navigation: {
    primary: [
      { id: "collection", label: "Collection", href: "/shop", enabled: true, order: 1 },
      { id: "categories", label: "Categories", href: "/collections", enabled: true, order: 2 },
      { id: "craft", label: "Craft", href: "/craft", enabled: false, order: 3 },
      { id: "house", label: "House", href: "/about", enabled: true, order: 4 },
      { id: "men", label: "Men", href: "/men", enabled: true, order: 5 },
      { id: "women", label: "Women", href: "/women", enabled: true, order: 6 },
    ],
    support: [
      { id: "shipping", label: "Shipping", href: "/shipping", enabled: true, order: 1 },
      { id: "returns", label: "Returns", href: "/refund", enabled: true, order: 2 },
      { id: "contact", label: "Contact", href: "/contact", enabled: true, order: 3 },
      { id: "track", label: "Track order", href: "/orders", enabled: true, order: 4 },
    ],
    footer: [
      { id: "shop", heading: "Shop", enabled: true, order: 1, items: [
        { id: "all", label: "All watches", href: "/shop", enabled: true, order: 1 },
        { id: "men", label: "Men", href: "/men", enabled: true, order: 2 },
        { id: "women", label: "Women", href: "/women", enabled: true, order: 3 },
        { id: "collections", label: "Collections", href: "/collections", enabled: true, order: 4 },
      ]},
      { id: "house", heading: "House", enabled: true, order: 2, items: [
        { id: "about", label: "About", href: "/about", enabled: true, order: 1 },
        { id: "blog", label: "Blog", href: "/blog", enabled: true, order: 2 },
        { id: "contact", label: "Contact", href: "/contact", enabled: true, order: 3 },
      ]},
      { id: "care", heading: "Care", enabled: true, order: 3, items: [
        { id: "shipping", label: "Shipping", href: "/shipping", enabled: true, order: 1 },
        { id: "returns", label: "Returns", href: "/refund", enabled: true, order: 2 },
        { id: "track", label: "Track order", href: "/orders", enabled: true, order: 3 },
      ]},
      { id: "legal", heading: "Legal", enabled: true, order: 4, items: [
        { id: "privacy", label: "Privacy", href: "/privacy", enabled: true, order: 1 },
        { id: "terms", label: "Terms", href: "/terms", enabled: true, order: 2 },
        { id: "refunds", label: "Refunds", href: "/refund", enabled: true, order: 3 },
      ]},
    ],
  },

  // Defaults to deriving tiles from the live category tree -- today's
  // behaviour, but as a rule the admin can turn off in favour of a curated,
  // ordered selection. No category name is baked in.
  categoryTiles: {
    enabled: true,
    eyebrow: "Shop by category",
    title: "Find your movement.",
    autoFromCategories: true,
    tiles: [],
  },

  hero: {
    enabled: true,
    eyebrow: "The precision house",
    headlineLines: ["Time,", "Engineered."],
    supporting:
      "A curated house of mechanical and quartz timepieces — from your first everyday watch to a collector's grail.",
    pricedFrom: null,
    primaryCta: { label: "Shop the collection", href: "/shop" },
    secondaryCta: { label: "Explore categories", href: "/collections" },
  },
  trust: { enabled: false, items: [] },
  stats: { enabled: false, items: [] },
  // ⚠️ REFERENCE DEMO VALUES, enabled at the client's explicit request so the
  // section matches the approved design out of the box. Every specification
  // here is carried over verbatim from the reference prototype, which describes
  // a fictional watch — NOT MAK's real figures. Replace them through the admin
  // before publishing. Mirrors models.DefaultStorefrontContent.
  craft: {
    enabled: true,
    eyebrow: "The craft",
    panels: [
      {
        number: "01",
        title: "A movement you can trust",
        body: "Regulated in five positions and timed to within seconds a day. Every calibre is run for a full week before it ships.",
        specs: [
          { key: "Accuracy", value: "±5s/day" },
          { key: "Reserve", value: "41 hours" },
        ],
      },
      {
        number: "02",
        title: "A case built to outlast you",
        body: "Brushed and polished steel, sapphire crystal, and a screw-down crown — sealed by hand and pressure-tested for water resistance.",
        specs: [
          { key: "Crystal", value: "Sapphire" },
          { key: "Water", value: "50–600m" },
        ],
      },
      {
        number: "03",
        title: "Finishing under a loupe",
        body: "Bevelled edges, brushed dials and applied indices, inspected under magnification before the piece earns the MAK mark.",
        specs: [
          { key: "Warranty", value: "5 years" },
          { key: "Made", value: "In-house" },
        ],
      },
    ],
  },
  house: {
    enabled: false,
    // Mirrors models.DefaultStorefrontContent: "About MAK Watches", not "The
    // MAK house" -- MAK is a retailer, and "house" reads as a claim to make the
    // watches. Only the default changes; a stored admin value still wins.
    eyebrow: "About MAK Watches",
    title: "",
    body: "",
    cta: { label: "Own one", href: "/shop" },
  },
  poster: {
    enabled: true,
    headlineLines: ["Join the", "list."],
    body: "Be first to hear when new pieces land.",
    emailLabel: "Your email",
    submitLabel: "Notify me",
    note: "We will only email you about new arrivals.",
  },
  // Shipped switched off, matching the Go defaults: an enhancement, never a
  // requirement for buying anything.
  boutique: {
    enabled: false,
    eyebrow: "The boutique",
    title: "Step inside.",
    body: "A room you can walk around. Every piece here is the same piece you can buy from any other page.",
    source: "latest",
    limit: 6,
  },
  footer: {
    tagline:
      "Precision timepieces, engineered for the people who measure their days.",
    social: [],
  },
  marquee: {
    enabled: true,
    useCategoryNames: true,
    terms: [],
    durationSeconds: 32,
  },
  policies: {
    shipping: { enabled: false, title: "Shipping", body: "" },
    returns: { enabled: false, title: "Returns", body: "" },
    warranty: { enabled: false, title: "Warranty", body: "" },
    boxContents: { enabled: false, title: "What's included", items: [] },
  },
  rails: [
    {
      id: "collection",
      enabled: true,
      position: 1,
      eyebrow: "The collection",
      title: "Every watch we make.",
      source: "latest",
      limit: 8,
      filterable: true,
      viewAll: { label: "View the full collection", href: "/shop" },
    },
    {
      id: "men",
      enabled: true,
      position: 2,
      eyebrow: "For him",
      title: "The men's edit.",
      source: "category",
      value: "Men",
      limit: 4,
      filterable: false,
      viewAll: { label: "Shop men's watches", href: "/men" },
    },
    {
      id: "women",
      enabled: true,
      position: 3,
      eyebrow: "For her",
      title: "The women's edit.",
      source: "category",
      value: "Women",
      limit: 4,
      filterable: false,
      viewAll: { label: "Shop women's watches", href: "/women" },
      tone: "surface",
    },
  ],
};

/**
 * Merge a partial payload over the defaults.
 *
 * The stored document may predate a field this build knows about — a section
 * added after the admin last saved. Filling from the defaults per section means
 * a new section appears with its shipped default rather than as `undefined`
 * crashing the render.
 */
/**
 * One listing header, with every empty field filled from the shipped default.
 *
 * Field by field, and treating whitespace as empty: an admin who clears the
 * headline gets the shipped headline back rather than a page with no heading,
 * and one who rewrites only the headline keeps the shipped eyebrow beside it.
 */
function listingHeader(
  raw: Partial<ListingHeader> | undefined,
  fallback: ListingHeader
): ListingHeader {
  const pick = (value: string | undefined, spare: string) =>
    typeof value === "string" && value.trim().length > 0 ? value : spare;

  return {
    eyebrow: pick(raw?.eyebrow, fallback.eyebrow),
    title: pick(raw?.title, fallback.title),
    description: pick(raw?.description, fallback.description),
  };
}

export function normalizeStorefront(raw: unknown): StorefrontContent {
  const data = (raw ?? {}) as Partial<StorefrontContent>;
  const d = DEFAULT_STOREFRONT;

  const rails = Array.isArray(data.rails) ? data.rails : d.rails;

  // A document written before these sections existed arrives without them.
  // Filling from the defaults keeps the storefront complete rather than
  // dropping its menus.
  const navigation = data.navigation ?? d.navigation;
  const categoryTiles = data.categoryTiles ?? d.categoryTiles;

  // The public API already filters and orders navigation, but this is the last
  // line before render: a stale cache or a direct call to the admin payload
  // must not put a disabled entry on the page.
  const usableNav = (items: NavItem[] | undefined): NavItem[] =>
    (items ?? [])
      .filter((item) => item?.enabled && item.href)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    navigation: {
      primary: usableNav(navigation.primary?.length ? navigation.primary : d.navigation.primary),
      support: usableNav(navigation.support?.length ? navigation.support : d.navigation.support),
      footer: (navigation.footer?.length ? navigation.footer : d.navigation.footer)
        .filter((column) => column?.enabled)
        .map((column) => ({ ...column, items: usableNav(column.items) }))
        .filter((column) => column.items.length > 0)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    },
    categoryTiles: { ...d.categoryTiles, ...categoryTiles },
    listings: {
      collection: listingHeader(data.listings?.collection, d.listings.collection),
      categories: listingHeader(data.listings?.categories, d.listings.categories),
      men: listingHeader(data.listings?.men, d.listings.men),
      women: listingHeader(data.listings?.women, d.listings.women),
    },
    hero: { ...d.hero, ...(data.hero ?? {}) },
    trust: { ...d.trust, ...(data.trust ?? {}) },
    stats: { ...d.stats, ...(data.stats ?? {}) },
    craft: { ...d.craft, ...(data.craft ?? {}) },
    house: { ...d.house, ...(data.house ?? {}) },
    poster: { ...d.poster, ...(data.poster ?? {}) },
    boutique: { ...d.boutique, ...(data.boutique ?? {}) },
    footer: { ...d.footer, ...(data.footer ?? {}) },
    marquee: { ...d.marquee, ...(data.marquee ?? {}) },
    policies: {
      shipping: { ...d.policies.shipping, ...(data.policies?.shipping ?? {}) },
      returns: { ...d.policies.returns, ...(data.policies?.returns ?? {}) },
      warranty: { ...d.policies.warranty, ...(data.policies?.warranty ?? {}) },
      boxContents: {
        ...d.policies.boxContents,
        ...(data.policies?.boxContents ?? {}),
      },
    },
    // Enabled rails only, in the admin's chosen order.
    rails: rails
      .filter((rail) => rail?.enabled)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    updatedAt: data.updatedAt,
  };
}

/** The panels that are configured and have body copy. */
export function enabledPolicyPanels(
  policies: PoliciesContent
): PolicyPanel[] {
  return [policies.shipping, policies.returns, policies.warranty].filter(
    (panel) => panel.enabled && panel.body.trim().length > 0
  );
}

/**
 * The shipped defaults, filtered the way the API filters a stored document.
 *
 * DEFAULT_STOREFRONT is the *authoring* baseline: it carries every section and
 * menu entry the admin can turn on, including the ones shipped switched off. It
 * must never be rendered as-is -- doing so puts disabled entries on the page
 * (the shipped "Craft" item, whose /craft route does not exist, is exactly that
 * trap). The Go handler runs PublicNavigation() before serving; this is the
 * same step for the paths that never reach the API.
 *
 * Use this anywhere the storefront config is needed but the API did not answer.
 */
export const FALLBACK_STOREFRONT: StorefrontContent =
  normalizeStorefront(DEFAULT_STOREFRONT);
