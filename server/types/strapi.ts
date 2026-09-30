/**
 * server/types/strapi.ts
 * ------------------------------------------------------------------
 * Nguyên tắc: chỉ khai báo field mà app THỰC SỰ dùng tới. Strapi trả
 * về rất nhiều field nội bộ (hash, mime, size, provider, createdAt,
 * publishedAt...) — copy nguyên hết vào type chỉ làm rối, và khiến
 * type "giả vờ" quan trọng những field không ai đọc tới.
 * ------------------------------------------------------------------
 */

// ---- Generic response wrapper ------------------------------------------
// Strapi luôn bọc data trong { data, meta } dù là single-type hay
// collection. Định nghĩa 1 lần, dùng lại thay vì viết `{ data: X }`
// rải rác ở từng nơi gọi strapiFetch.
export type StrapiSingle<T> = { data: T; meta?: Record<string, unknown> };
export type StrapiList<T> = { data: T[]; meta?: Record<string, unknown> };

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
  formats?: Record<string, StrapiMediaFormat | null>;
};

export type StrapiPageRef = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  locale: string;
  hidden: boolean;
  // block: undefined;
};

export type StrapiLinkType = "internal" | "external";

export type StrapiNavLink = {
  id: number;
  label: string;
  type: StrapiLinkType;
  /** Chỉ có giá trị khi type === "external". */
  url: string | null;
  openInNewTab: boolean;
  /** Chỉ có giá trị khi type === "internal". */
  page: StrapiPageRef | null;
};

export type StrapiNavItem = {
  id: number;
  link: StrapiNavLink;
  children: StrapiNavLink[];
};

export type StrapiHeader = {
  id: number;
  documentId: string;
  locale: string;
  logoOnLight: StrapiMedia;
  logoOnDark: StrapiMedia;
  navItems: StrapiNavItem[];
  utilityLink: StrapiNavLink;
  cta: StrapiNavLink;
};
