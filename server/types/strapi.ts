// server/types/strapi.ts
import { Locale } from "../utils/locale.ts";
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
export type StrapiHeroBlock = {
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

export type StrapiIntroBlock = {
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

export type StrapiPageBlock = StrapiHeroBlock | StrapiIntroBlock;
