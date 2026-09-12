import type { Metadata } from "next";

import { Container, ErrorState, Marquee, Section } from "@/design-system";
import {
  AdminPreviewToolbar,
  AdminSectionMarkup,
  CraftScroller,
  EditorialGallery,
  StatGrid,
  StoryBlock,
  TrustStrip,
} from "@/components/marketing";
import { isRenderableHero } from "@/lib/api/home-content";
import {
  fetchCategories,
  fetchCategoryCounts,
  fetchCategoryFallbackImages,
  fetchHomeContent,
  fetchProductById,
  fetchRailProducts,
  fetchStorefront,
  isApiConfigured,
} from "@/lib/api/server";
import { toMediaRef } from "@/lib/media";

import { HomeHero } from "./(home)/HomeHero";
import { HomeCategories } from "./(home)/HomeCategories";
import { HomeStory } from "./(home)/HomeStory";
import { HomeNewsletter } from "./(home)/HomeNewsletter";
import { CollectionSection } from "./(home)/CollectionSection";
import { ProductSection } from "./(home)/ProductSection";

/**
 * The MAK Watches homepage.
 *
 * Nothing on this page is hard-wired to the current catalogue. Which sections
 * appear, what they say, and which slice of the catalogue each product rail
 * shows all come from the admin-managed storefront document
 * (GET /api/v1/storefront). Rails name a selection *rule* — "latest",
 * "category: Men" — never a fixed list of product ids, so they keep showing the
 * right thing as stock turns over.
 *
 * A server component. The only client JavaScript comes from the interactive
 * islands the components carry themselves.
 */

export const metadata: Metadata = {
  title: "MAK Watches — Premium Timepieces",
  description:
    "Explore the MAK Watches collection. Browse timepieces for men and women across leather, metal, gold and silver.",
  alternates: { canonical: "/" },
};

export const revalidate = 0;

export default async function HomePage() {
  if (!isApiConfigured()) {
    return (
      <div className="mak bg-mak-bg">
        <Section spacing="loose">
          <Container>
            <ErrorState
              title="The storefront is not configured."
              description="NEXT_PUBLIC_API_BASE_URL is not set, so the catalog cannot be reached. Set it in .env.local and restart."
            />
          </Container>
        </Section>
      </div>
    );
  }

  // The storefront config decides what to fetch, so it is read first.
  const storefront = await fetchStorefront();

  const [homeContent, categories, ...railPages] = await Promise.all([
    fetchHomeContent(),
    fetchCategories(),
    ...storefront.rails.map((rail) => fetchRailProducts(rail)),
  ]);

  // Subcategories the admin has not given an image: borrow one from a product
  // in that subcategory so the tile shows the goods rather than the branded
  // "no image" placeholder. Only requested for the ones that need it.
  const imagelessSubcategories = categories.flatMap((category) =>
    (category.subcategories ?? [])
      .filter((sub) => sub.name?.trim() && !sub.imageUrl)
      .map((sub) => ({
        mainCategory: category.name,
        subcategory: sub.name.trim(),
      }))
  );

  const [counts, categoryFallbackImages] = await Promise.all([
    fetchCategoryCounts(categories.map((c) => c.name)),
    fetchCategoryFallbackImages(imagelessSubcategories),
  ]);

  const [heroSlide, ...remainingSlides] = homeContent.heroSlides;

  // The CMS holds several slides that share a subtitle across different
  // products, so the first remaining slide often repeats the hero's headline.
  const heroHeadline = (heroSlide?.subtitle || heroSlide?.title || "")
    .trim()
    .toLowerCase();
  const storySlide = remainingSlides.find((slide) => {
    const headline = (slide.subtitle || slide.title || "").trim().toLowerCase();
    return headline && headline !== heroHeadline;
  });

  const heroProduct = heroSlide?.productId
    ? await fetchProductById(heroSlide.productId)
    : null;

  // Marquee vocabulary: live category names when the admin wants it to track
  // the catalogue, otherwise their own terms. Deduplicated case-insensitively —
  // several subcategory names exist under both Men and Women.
  const categoryTerms = Array.from(
    new Map(
      categories
        .flatMap((category) => (category.subcategories ?? []).map((s) => s.name))
        .filter((name): name is string => Boolean(name?.trim()))
        .map((name) => [name.trim().toLowerCase(), name.trim()] as const)
    ).values()
  );
  const marqueeTerms = storefront.marquee.useCategoryNames
    ? categoryTerms
    : storefront.marquee.terms;

  const totalPieces = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const heroProvidesHeading =
    storefront.hero.enabled &&
    (isRenderableHero(heroSlide) || storefront.hero.headlineLines.length > 0);

  const craftImages = homeContent.gallery
    .map((image) => toMediaRef(image.url, ""))
    .filter((media): media is NonNullable<typeof media> => media !== null);

  return (
    <div className="mak bg-mak-bg">
      {!heroProvidesHeading ? (
        <h1 className="sr-only">MAK Watches — premium timepieces</h1>
      ) : null}

      {storefront.hero.enabled ? (
        <AdminSectionMarkup
          sectionId="hero"
          sectionNumber="01"
          title="Top Hero · Main Watch Carousel & Banner"
          locationBadge="Screen 1 · Above Fold"
        >
          <HomeHero
            content={storefront.hero}
            trust={storefront.trust}
            slide={heroSlide}
            linkedProduct={heroProduct}
          />
        </AdminSectionMarkup>
      ) : null}

      {storefront.marquee.enabled && marqueeTerms.length > 0 ? (
        <AdminSectionMarkup
          sectionId="marquee"
          sectionNumber="02"
          title="Ticker Tape · Announcement Marquee"
          locationBadge="Screen 1.5 · Under Hero"
        >
          <Marquee duration={storefront.marquee.durationSeconds}>
            {marqueeTerms.map((term) => (
              <span key={term}>{term.toUpperCase()} ·</span>
            ))}
          </Marquee>
        </AdminSectionMarkup>
      ) : null}

      {storefront.stats.enabled && storefront.stats.items.length > 0 ? (
        <AdminSectionMarkup
          sectionId="stats"
          sectionNumber="03"
          title="Milestone Counter · Brand Figures"
          locationBadge="Screen 2 · Trust Numbers"
        >
          <Section spacing="default">
            <Container>
              <StatGrid stats={storefront.stats.items} />
            </Container>
          </Section>
        </AdminSectionMarkup>
      ) : null}

      {storefront.trust.enabled && storefront.trust.items.length > 0 ? (
        <AdminSectionMarkup
          sectionId="trust"
          sectionNumber="04"
          title="Guarantee Strip · Buyer Protection"
          locationBadge="Screen 2.5 · Protection Badges"
        >
          <Section spacing="tight">
            <TrustStrip
              items={storefront.trust.items.map((title) => ({ title }))}
              variant="bare"
            />
          </Section>
        </AdminSectionMarkup>
      ) : null}

      <AdminSectionMarkup
        sectionId="categories"
        sectionNumber="05"
        title="Category Hub · Men, Women & Types"
        locationBadge="Screen 3 · Main Categories"
      >
        <HomeCategories
          content={storefront.categoryTiles}
          categories={categories}
          counts={counts}
          fallbackImages={categoryFallbackImages}
        />
      </AdminSectionMarkup>

      {/*
        Product rails, in the admin's configured order. The first is rendered
        with filter chips when marked filterable, matching the reference's
        collection band; the rest are plain grids.
      */}
      <AdminSectionMarkup
        sectionId="rails"
        sectionNumber="06"
        title="Watch Rails · Trending & Bestsellers"
        locationBadge="Screen 4 · Main Shopping Rows"
      >
        {storefront.rails.map((rail, index) => {
          const page = railPages[index];
          if (!page) return null;

          return rail.filterable ? (
            <CollectionSection
              key={rail.id}
              eyebrow={rail.eyebrow}
              title={rail.title}
              products={page.items}
              failed={page.failed}
              total={totalPieces || page.meta?.total}
              viewAll={rail.viewAll.href ? rail.viewAll : undefined}
              priorityCount={index === 0 ? 4 : 0}
            />
          ) : (
            <ProductSection
              key={rail.id}
              eyebrow={rail.eyebrow}
              title={rail.title}
              products={page.items}
              failed={page.failed}
              total={page.meta?.total}
              viewAll={rail.viewAll.href ? rail.viewAll : undefined}
              priorityCount={index === 0 ? 4 : 0}
              tone={rail.tone === "surface" ? "surface" : "default"}
            />
          );
        })}
      </AdminSectionMarkup>

      {storefront.craft.enabled && storefront.craft.panels.length > 0 ? (
        <AdminSectionMarkup
          sectionId="craft"
          sectionNumber="07"
          title="Story 1 · Watchmaking Craft & Specs"
          locationBadge="Screen 5 · Mid-Page Feature"
        >
          <CraftScroller
            panels={storefront.craft.panels.map((panel, index) => ({
              number: panel.number,
              title: panel.title,
              body: panel.body,
              specs: panel.specs,
              image:
                toMediaRef(panel.image, "") ??
                craftImages[index] ??
                craftImages[0] ??
                null,
            }))}
          />
        </AdminSectionMarkup>
      ) : null}

      <AdminSectionMarkup
        sectionId="house"
        sectionNumber="08"
        title="Story 2 · The House of MAK Banner"
        locationBadge="Screen 6 · Brand Editorial"
      >
        {storefront.house.enabled && storefront.house.title.trim() ? (
          <StoryBlock
            eyebrow={storefront.house.eyebrow}
            headline={storefront.house.title}
            body={storefront.house.body}
            cta={
              storefront.house.cta.label.trim() && storefront.house.cta.href.trim()
                ? storefront.house.cta
                : undefined
            }
            image={toMediaRef(storefront.house.image, "") ?? craftImages[0] ?? null}
            imageAlt=""
          />
        ) : (
          <HomeStory
            feature={homeContent.collections[0]}
            fallbackSlide={storySlide}
          />
        )}
      </AdminSectionMarkup>

      <AdminSectionMarkup
        sectionId="gallery"
        sectionNumber="09"
        title="Lookbook · Instagram & Lifestyle Wall"
        locationBadge="Screen 7 · Photo Wall"
      >
        <EditorialGallery
          images={homeContent.gallery
            .filter((image) => image.url)
            .map((image) => ({ url: image.url!, alt: image.alt }))}
        />
      </AdminSectionMarkup>

      {storefront.poster.enabled ? (
        <AdminSectionMarkup
          sectionId="poster"
          sectionNumber="11"
          title="Bottom Card · VIP Club & Newsletter"
          locationBadge="Screen 9 · Above Footer"
        >
          <HomeNewsletter content={storefront.poster} />
        </AdminSectionMarkup>
      ) : null}

      <AdminPreviewToolbar />
    </div>
  );
}
