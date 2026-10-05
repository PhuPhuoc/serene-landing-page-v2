// Shared
export type Tag = {
  label: string;
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

// Main Type
export type PageBlock = HeroBlock | IntroBlock;
