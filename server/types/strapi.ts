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
};

// Link
export type StrapiLinkType = "internal" | "external" | "modal";
export type StrapiLinkModalKey = "contactUs" | "joinMembership";

export type StrapiNavLink = {
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
  link: StrapiNavLink;
  children: StrapiNavLink[];
};

// Header
export type StrapiHeader = {
  id: number;
  locale: Locale;
  logoOnLight: StrapiMedia;
  logoOnDark: StrapiMedia;
  navItems: StrapiNavItem[];
  utilityLink: StrapiNavLink;
  cta: StrapiNavLink;
};
