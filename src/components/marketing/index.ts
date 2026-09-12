/**
 * Marketing sections.
 *
 * Every component here takes its copy and imagery as typed props and has no
 * default content. That is deliberate: these are the surfaces that carry brand
 * and product claims, and a component default would be an invented claim.
 * Rendering one with no content yields nothing rather than placeholder text.
 */

export { Hero, type HeroProps, type HeroPlaque } from "./Hero";
export { TrustStrip, type TrustStripProps, type TrustItem } from "./TrustStrip";
export {
  CategoryTiles,
  type CategoryTilesProps,
  type CategoryTile,
} from "./CategoryTiles";
export { StoryBlock, type StoryBlockProps } from "./StoryBlock";
export {
  CraftScroller,
  type CraftScrollerProps,
  type CraftPanel,
} from "./CraftScroller";
export { StatGrid, type StatGridProps, type Stat } from "./StatGrid";
export { PosterCTA, type PosterCTAProps } from "./PosterCTA";
export { Newsletter, type NewsletterProps } from "./Newsletter";
export {
  EditorialGallery,
  type EditorialGalleryProps,
} from "./EditorialGallery";
export {
  AdminSectionMarkup,
  AdminPreviewToolbar,
  type AdminSectionMarkupProps,
} from "./AdminSectionMarkup";
