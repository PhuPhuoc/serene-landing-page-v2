import { Link, Media } from "../utils/mapper";

// Shared
export type Tag = {
  label: string;
};

export type DayMoment = {
  label: string;
  title: string;
  description: string;
  image?: Media | null;
  cta: Link;
};

export enum BackgroundType {
  DEFAULT = "default",
  COLOR = "color",
  IMAGE = "image",
}

export type BackgroundBlock = {
  type: BackgroundType;
  hexColor?: string | null;
  image?: Media | null;
};

export enum ImagePositon {
  LEFT = "left",
  RIGHT = "right",
}

export enum CtaVariant {
  SOLID_DARK = "solid-dark",
  SOLID_LIGHT = "solid-light",
}

// Blocks
export type HeroBlock = {
  type: "hero";
  eyebrow?: string | null;
  headline: string;
  subheadline?: string | null;
  backgroundImage: Media;
  imageCaption?: string | null;
  primaryCta?: Link | null;
  secondaryCta?: Link | null;
};

export type IntroBlock = {
  type: "intro";
  eyebrow?: string | null;
  subtitle: string;
  content?: string | null;
  tags?: Tag[];
};

export type DayAt = {
  type: "day-at";
  eyebrow: string;
  heading?: string | null;
  moments: DayMoment[];
};

export type SimpleSection = {
  type: "simple-section";
  eyebrow: string;
  body: string;
  image?: Media | null;
  imageCaption?: string;
  imagePosition: ImagePositon;
  cta: Link;
  ctaVariant: CtaVariant;
  background: BackgroundBlock;
};

export type Visit = {
  type: "visit";
  id: number;
  eyebrow: string;
  heading: string;
  address?: string;
  phone?: string;
  zaloUrl?: string;
  email?: string;
  note?: string;
  directionsCta?: Link | null;
  pinTitle?: string;
  pinSubtitle?: string;
  latitude?: number;
  longitude?: number;
  mapEmbedUrl?: string;
  mapImage?: Media | null;
  newsletterText?: string;
  emailPlaceholder?: string;
  submitLabel?: string;
};

// Main Type
export type PageBlock = HeroBlock | IntroBlock | DayAt | SimpleSection | Visit;
