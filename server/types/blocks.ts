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

// Main Type
export type PageBlock = HeroBlock | IntroBlock | DayAt;
