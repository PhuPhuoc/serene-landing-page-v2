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

// Modal CTA: key khớp giá trị `modalKey` trong Strapi. Dùng const object thay
// cho enum để giá trị literal (từ CMS) gán thẳng vào type mà không cần cast.
export const ModalKey = {
  CONTACT_US: "contactUs",
  JOIN_MEMBERSHIP: "joinMembership",
} as const;

export type ModalKey = (typeof ModalKey)[keyof typeof ModalKey];

export const MODAL_KEYS: ModalKey[] = Object.values(ModalKey);

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
  modalKey?: ModalKey;
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

export type Exhibition = {
  id: number;
  title: string;
  artistName: string;
  startDate: Date;
  endDate: Date;
  description: string;
  curatorialNote: string;
  coverImage: Media[];
  cta: Link;
};

export type ArtAndCulture = {
  type: "art-and-culture";
  id: number;
  eyebrow: string;
  exhibition: Exhibition | null;
  cta: Link;
  background: Background | null;
};

export type Stay = {
  type: "stay";
  id: number;
  eyebrow: string;
  heading: string;
  description?: string | null;
  includesTitle?: string | null;
  yourStayLabel?: string | null;
  cta: Link;
  background: Background | null;
};

// Modal / enquiry
// `area` = vị trí CTA trên trang, để team sale biết khách quan tâm mục nào.
// Mỗi block/CTA mới phải thêm một giá trị vào mảng này (server dùng lại để
// validate).
export const CTA_SOURCE_AREAS = [
  "navbar",
  "navbar-drawer",
  "hero",
  "day-at",
  "simple-section",
  "visit",
  "membership",
  "tier",
  "club-event",
  "private-event",
  "wine-and-dine",
  "art-and-culture",
  "stay",
] as const;

export type CtaSourceArea = (typeof CTA_SOURCE_AREAS)[number];

// Vị trí khách đang đứng lúc bấm CTA: page (kèm prefix locale) + locale +
// khu vực + id block (nếu CTA nằm trong block) + nhãn CTA.
export type ModalSource = {
  area: CtaSourceArea;
  label: string;
  blockId?: number;
  page: string;
  locale: string;
};

// Payload gửi sale (tạm log console, sau này chuyển qua API/email).
// Validate ở form đảm bảo email hoặc mobile luôn có ít nhất một giá trị.
export type ModalSubmission = {
  modalKey: ModalKey;
  name: string;
  email: string | null;
  mobile: string | null;
  note: string | null;
  source: ModalSource;
  submittedAt: string; // ISO 8601
};

// Payload client gửi lên `/api/enquiry`; server tự gắn `submittedAt` phía
// server để thời gian không phụ thuộc đồng hồ/múi giờ của khách.
export type ModalEnquiry = Omit<ModalSubmission, "submittedAt">;

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
  | WellnessAndLeisure
  | ArtAndCulture
  | Stay;

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

export type Residence = {
  id: number;
  name: string;
  shortName: string;
  description: string;
  gallery: Media[];
  size: number;
  bed: string;
  view: string;
  includes: string[];
};

export type ResidenceResponse = {
  residences: Residence[];
};

// Journal listing (single type `journal`) — copy trả về của /api/journal
export type JournalSortOption = "latest" | "oldest" | "a-z label";

export type JournalPageResponse = {
  eyebrow: string;
  heading: string;
  searchPlaceholder: string | null;
  sortLabel: string | null;
  sortOptions: JournalSortOption;
  emptyStateText: string | null;
  backLinkLabel: string | null;
};

// Journal posts (collection `posts`) — shape trả về của /api/posts
export type JournalAuthorRef = {
  documentId: string;
  name: string;
  slug: string;
};

export type JournalAuthor = JournalAuthorRef & {
  role: string | null;
  bio: string | null;
  avatar: Media | null;
};

export type JournalPostSummary = {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  cover: Media | null;
  coverAlt: string;
  publishedDate: string | null;
  author: JournalAuthorRef | null;
};

export type JournalPostsResponse = {
  posts: JournalPostSummary[];
};

// Rich text (Strapi Blocks) đã chuẩn hoá: text node mang mảng marks,
// list gom về `items`, code gom về `text` để component chỉ cần switch type.
export type JournalInlineMark =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code";

export type JournalTextNode = {
  type: "text";
  text: string;
  marks: JournalInlineMark[];
};

export type JournalLinkNode = {
  type: "link";
  url: string;
  children: JournalTextNode[];
};

export type JournalInlineNode = JournalTextNode | JournalLinkNode;

export type JournalListItem = {
  children: JournalInlineNode[];
};

export type JournalRichTextNode =
  | { type: "paragraph"; children: JournalInlineNode[] }
  | { type: "heading"; level: 2 | 3 | 4; children: JournalInlineNode[] }
  | {
      type: "list";
      format: "ordered" | "unordered";
      items: JournalListItem[];
    }
  | { type: "quote"; children: JournalInlineNode[] }
  | { type: "code"; language: string | null; text: string }
  | { type: "image"; image: Media; caption: string | null };

// Blocks của post (dynamic zone `journal.*`)
export type JournalRichTextBlock = {
  type: "rich-text";
  id: number;
  nodes: JournalRichTextNode[];
  fontSize: number | null;
};

export type JournalImageBlock = {
  type: "image";
  id: number;
  image: Media;
  caption: string | null;
};

export type JournalGalleryLayout = "carousel" | "masonry-2" | "masonry-3";

export type JournalGalleryBlock = {
  type: "gallery";
  id: number;
  images: Media[];
  caption: string | null;
  layout: JournalGalleryLayout;
};

export type JournalVideoBlock = {
  type: "video";
  id: number;
  src: string | null;
  externalUrl: string | null;
  caption: string | null;
};

export type JournalTwoColumnBlock = {
  type: "two-column";
  id: number;
  image: Media;
  nodes: JournalRichTextNode[];
  imagePosition: "left" | "right";
};

export type JournalBlock =
  | JournalRichTextBlock
  | JournalImageBlock
  | JournalGalleryBlock
  | JournalVideoBlock
  | JournalTwoColumnBlock;

export type JournalSeo = {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: Media | null;
  noIndex: boolean;
};

export type JournalPost = {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  cover: Media | null;
  coverAlt: string;
  publishedDate: string | null;
  author: JournalAuthor | null;
  seo: JournalSeo | null;
  blocks: JournalBlock[];
  relatedPosts: JournalPostSummary[];
};

export type JournalPostResponse = {
  post: JournalPost;
};
