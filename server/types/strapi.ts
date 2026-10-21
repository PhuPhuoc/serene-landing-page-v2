// server/types/strapi.ts
import type { Locale } from "../utils/locale.ts";
export type StrapiSingle<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type StrapiList<T> = {
  data: T[];
  meta?: Record<string, unknown>;
};

// Media
export type StrapiMediaFormat = {
  url: string;
  width?: number;
  height?: number;
};

export type StrapiMedia = {
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
  format?: Record<string, StrapiMedia> | null;
};

// Page
export type StrapiPageRef = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  locale: Locale;
  hidden: boolean;
  blocks?: StrapiPageBlock[];
};

// Link
export type StrapiLinkType = "internal" | "external" | "modal";
export type StrapiLinkModalKey = "contactUs" | "joinMembership";

export type StrapiLink = {
  id: number;
  label: string;
  type: StrapiLinkType;
  modalKey?: StrapiLinkModalKey;
  url: string;
  openInNewTab: boolean;
  page: StrapiPageRef | null;
};

// Navbar
export type StrapiNavItem = {
  id: number;
  link: StrapiLink;
  children: StrapiLink[];
};

// Header
export type StrapiHeader = {
  id: number;
  locale: Locale;
  logoOnLight: StrapiMedia;
  logoOnDark: StrapiMedia;
  navItems: StrapiNavItem[];
  utilityLink: StrapiLink;
  cta: StrapiLink;
};

// Footer
export type StrapiFooterColumns = {
  title: string;
  links: StrapiLink[];
};

export type StrapiFooter = {
  id: number;
  logo: StrapiMedia;
  address: string;
  phone: string;
  email: string;
  columns: StrapiFooterColumns[];
  copyright: string;
  legalLinks: StrapiLink[];
};

// Shared
export type StrapiTag = {
  id: number;
  label: string;
};

// Blocks:
export type StrapiHero = {
  __component: "block.hero";
  id: number;
  eyebrow?: string | null;
  headline: string;
  subheadline?: string | null;
  backgroundImage: StrapiMedia;
  imageCaption?: string | null;
  primaryCta?: StrapiLink | null;
  secondaryCta?: StrapiLink | null;
};

export type StrapiIntro = {
  __component: "block.intro";
  id: number;
  eyebrow?: string | null;
  subtitle: string;
  content?: string | null;
  tags?: StrapiTag[];
};

export type StrapiDayMoment = {
  id: number;
  label: string;
  title: string;
  description: string;
  image?: StrapiMedia | null;
  cta: StrapiLink;
};

export type StrapiDayAt = {
  __component: "block.day-at";
  id: number;
  eyebrow: string;
  heading?: string | null;
  moments: StrapiDayMoment[];
};

export type StrapiBackgroundType = "default" | "color" | "image";
export type StrapiBackground = {
  type: StrapiBackgroundType;
  hexColor?: string;
  image?: StrapiMedia;
};

export type StrapiImagePositon = "left" | "right";
export type StrapiCtaVariant = "solid-dark" | "solid-light";
export type StrapiSimpleSection = {
  __component: "block.simple-section";
  id: number;
  eyebrow: string;
  heading: string;
  body: string;
  image: StrapiMedia;
  imageCaption: string;
  imagePosition: StrapiImagePositon;
  cta: StrapiLink;
  ctaVariant: StrapiCtaVariant;
  background: StrapiBackground;
};

export type StrapiVisit = {
  __component: "block.visit";
  id: number;
  eyebrow: string;
  heading: string;
  address?: string;
  phone?: string;
  zaloUrl?: string;
  email?: string;
  note?: string;
  directionsCta?: StrapiLink | null;
  pinTitle?: string;
  pinSubtitle?: string;
  latitude?: number;
  longitude?: number;
  mapEmbedUrl?: string;
  mapImage?: StrapiMedia | null;
  newsletterText?: string;
  emailPlaceholder?: string;
  submitLabel?: string;
};

export type StrapiFeature = {
  id: number;
  title: string;
  description?: string;
};
export type StrapiMembership = {
  __component: "block.membership";
  id: number;
  eyebrow: string;
  heading: string;
  description?: string;
  primaryCta: StrapiLink;
  secondaryCta: StrapiLink;
  features: StrapiFeature[];
  background: StrapiBackground;
};

export type StrapiPricingTier = {
  id: number;
  name: string;
  price: string; // biginteger: Strapi serialize thành string
  priceLabel: string;
  description?: string | null;
  period?: string | null;
};
export type StrapiTier = {
  __component: "block.tier";
  id: number;
  eyebrow: string;
  heading: string;
  note?: string | null;
  primaryCta?: StrapiLink | null;
  secondaryCta?: StrapiLink | null;
  tiers?: StrapiPricingTier[];
  background?: StrapiBackground | null;
};

export type StrapiClubEvent = {
  __component: "block.club-event";
  id: number;
  eyebrow: string;
  heading: string;
  note?: string | null;
  limit?: number | 10;
  primaryCta?: StrapiLink | null;
  secondaryCta?: StrapiLink | null;
  background?: StrapiBackground | null;
};

// Club events (collection `club-events`)
export type StrapiVenue = {
  id: number;
  documentId: string;
  name: string;
};

export type StrapiCategory = {
  id: number;
  documentId: string;
  name: string;
};

export type StrapiClubEventItem = {
  id: number;
  documentId: string;
  locale: Locale;
  title: string;
  description?: string | null;
  date: string; // Strapi datetime → ISO 8601 string
  venues?: StrapiVenue | null;
  categories?: StrapiCategory[] | null;
};

// Event venues (collection `event-venues`)
export type StrapiEventVenue = {
  id: number;
  documentId: string;
  locale: Locale;
  name: string;
  spaceType: "indoor" | "outdoor";
  description?: string | null;
  area?: number | null;
  areaLabel?: string | null;
  capacity?: number | null;
  capacityLabel?: string | null;
  stockPhoto?: StrapiMedia[] | null;
};

export type StrapiPrivateEvent = {
  __component: "block.private-event";
  id: number;
  eyebrow: string;
  heading: string;
  description?: string | null;
  primaryCta?: StrapiLink | null;
  secondaryCta?: StrapiLink | null;
  background?: StrapiBackground | null;
};

export type StrapiPageBlock =
  | StrapiHero
  | StrapiIntro
  | StrapiDayAt
  | StrapiSimpleSection
  | StrapiVisit
  | StrapiMembership
  | StrapiTier
  | StrapiClubEvent
  | StrapiPrivateEvent;
