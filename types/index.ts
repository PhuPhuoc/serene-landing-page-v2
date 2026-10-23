// Shared types for both client and server

// Media
export type Media = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

// Link
export enum CtaBehavior {
  INTERNAL = "internal",
  EXTERNAL = "external",
  MODAL = "modal",
}

export enum CtaVariant {
  SOLID = "solid",
  UNDERLINE = "underline",
  OUTLINE = "outline",
  NONE = "none",
}

export type Link = {
  id: number;
  documentId: string;
  label: string;
  type: CtaBehavior;
  style: CtaVariant;
  withIcon?: boolean;
  to?: string;
  newTab?: boolean;
  modalKey?: string;
};

// Menu item
export type MenuItem = Link & { children?: Link[] };

// Shared block types
export type Tag = {
  label: string;
};

export type DayMoment = {
  id: number;
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

export type Background = {
  type: BackgroundType;
  hexColor?: string | null;
  image?: Media | null;
};

export enum ImagePositon {
  LEFT = "left",
  RIGHT = "right",
}

// Blocks
export type Hero = {
  type: "hero";
  id: number;
  eyebrow?: string | null;
  headline: string;
  subheadline?: string | null;
  backgroundImage: Media;
  imageCaption?: string | null;
  primaryCta?: Link | null;
  secondaryCta?: Link | null;
};

export type Intro = {
  type: "intro";
  id: number;
  eyebrow?: string | null;
  subtitle: string;
  content?: string | null;
  tags?: Tag[];
};

export type DayAt = {
  type: "day-at";
  id: number;
  eyebrow: string;
  heading?: string | null;
  moments: DayMoment[];
};

export type SimpleSection = {
  type: "simple-section";
  id: number;
  eyebrow: string;
  heading?: string | null;
  body: string;
  image?: Media | null;
  imageCaption?: string;
  imagePosition: ImagePositon;
  cta: Link;
  background: Background | null;
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

export type Feature = {
  id: number;
  title: string;
  description?: string;
};
export type Membership = {
  type: "membership";
  id: number;
  eyebrow: string;
  heading: string;
  description?: string;
  primaryCta: Link;
  secondaryCta: Link;
  features: Feature[];
  background: Background | null;
};

export type PricingTier = {
  id: number;
  name: string;
  price: string;
  priceLabel: string;
  description?: string | null;
  period?: string | null;
};

export type Tier = {
  type: "tier";
  id: number;
  eyebrow: string;
  heading: string;
  note?: string | null;
  primaryCta: Link;
  secondaryCta: Link;
  tiers: PricingTier[];
  background: Background | null;
};

export type ClubEvent = {
  type: "club-event";
  id: number;
  eyebrow: string;
  heading: string;
  note?: string | null;
  limit?: number | 10;
  primaryCta: Link;
  secondaryCta: Link;
  background: Background | null;
};

export type PrivateEvent = {
  type: "private-event";
  id: number;
  eyebrow: string;
  heading: string;
  description?: string | null;
  primaryCta: Link;
  secondaryCta: Link;
  background: Background | null;
};

export type Card = {
  id: number;
  heading: string;
  description: string;
  cta: Link;
  image?: Media | null;
  imageCaption?: string | "";
};

export type WineAndDine = {
  type: "wine-and-dine";
  id: number;
  eyebrow: string;
  heading: string;
  venues: Card[];
  background: Background | null;
};

export type Bento = {
  id: number;
  heading: string;
  description?: string | null;
  images: Media[];
  defaultHexColor?: string | null;
};

export type WellnessAndLeisure = {
  type: "wellness-and-leisure";
  id: number;
  eyebrow: string;
  heading: string;
  description?: string | null;
  bentos: Bento[];
  background: Background | null;
};

// Main Type
export type PageBlock =
  | Hero
  | Intro
  | DayAt
  | SimpleSection
  | Visit
  | Membership
  | Tier
  | ClubEvent
  | PrivateEvent
  | WineAndDine
  | WellnessAndLeisure;

export type PageReponse = {
  title: string;
  blocks: PageBlock[];
};

// Club events (collection `club-events`) — shape trả về của /api/club-events
export type ClubEventItem = {
  id: number;
  title: string;
  description: string | null;
  date: string; // ISO 8601 — component tự format theo locale
  venues: {
    name: string;
  } | null;
  categories: {
    name: string;
  }[];
};

// Response của `/api/club-events` (server trả, client đọc — dùng chung 1 type)
export type ClubEventsResponse = {
  events: ClubEventItem[];
};

// Event venues (collection `event-venues`) — shape trả về của /api/event-venues
export type SpaceType = "indoor" | "outdoor";

export type EventVenue = {
  id: number;
  name: string;
  spaceType: SpaceType;
  description: string;
  area: number | null;
  areaLabel: string;
  capacity: number | null;
  capacityLabel: string;
  photos: Media[];
};

export type EventVenuesResponse = {
  venues: EventVenue[];
};
