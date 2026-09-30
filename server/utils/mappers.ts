/**
 * server/utils/mappers.ts
 * ------------------------------------------------------------------
 * MAPPER LÀ GÌ?
 * Là các hàm THUẦN (pure function): nhận dữ liệu thô từ Strapi, trả
 * về dữ liệu gọn cho frontend. Không gọi API, không đọc config, không
 * side-effect — chỉ input -> output. Nhờ vậy dễ đọc, dễ test độc lập
 * (không cần mock network để test mapper).
 *
 * Vì sao cần "dịch" thay vì trả thẳng dữ liệu Strapi cho client?
 * 1. Cấu trúc Strapi có nhiều field nội bộ (hash, mime, size,
 *    provider, createdAt...) mà frontend không bao giờ dùng tới.
 * 2. Tên field / cách lồng dữ liệu của Strapi có thể đổi khi CMS
 *    thay đổi (đổi field, đổi component...) — nếu component Vue
 *    "đọc thẳng" cấu trúc Strapi ở nhiều nơi, mỗi lần CMS đổi là phải
 *    sửa rất nhiều chỗ. Có 1 lớp mapper ở giữa: chỉ cần sửa TẠI ĐÂY.
 * ------------------------------------------------------------------
 */
import type {
  StrapiMedia,
  StrapiNavItem,
  StrapiNavLink,
  StrapiPageRef,
} from "../types/strapi";

// ============================================================
// 1) MEDIA — chuyển url tương đối -> tuyệt đối
// ============================================================

/**
 * Strapi trả url ảnh dạng TƯƠNG ĐỐI, vd "/uploads/logo_brown_xxx.svg"
 * — vì Strapi không biết domain của nó sẽ được truy cập từ đâu.
 * Muốn browser tải được ảnh, ta phải tự nối với domain của Strapi
 * (`strapiUrl`, đọc từ runtimeConfig) để ra url tuyệt đối, vd:
 * "http://localhost:1337/uploads/logo_brown_xxx.svg".
 *
 * Nếu url đã là tuyệt đối sẵn (bắt đầu bằng "http") thì giữ nguyên —
 * phòng trường hợp sau này đổi sang CDN/S3 (Strapi có thể trả url
 * tuyệt đối luôn nếu dùng provider khác "local").
 */
export function toAbsoluteUrl(strapiUrl: string, url?: string | null): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `${strapiUrl}${url}`;
}

export type Media = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export function mapMedia(media: StrapiMedia, strapiUrl: string): Media {
  return {
    url: toAbsoluteUrl(strapiUrl, media.url),
    alt: media.alternativeText ?? "",
    width: media.width,
    height: media.height,
  };
}

// ============================================================
// 2) LINK — quyết định link trỏ đi đâu (nội bộ hay ra ngoài)
// ============================================================
export type NavLink = {
  id: number;
  label: string;
  /** true nếu là link ra ngoài site (mở tab mới thường đi kèm true). */
  external: boolean;
  /** href thật sự để gắn vào thẻ <a>/<NuxtLink>. */
  to: string;
  newTab: boolean;
};

/**
 * Mỗi locale có route riêng, dạng "/{locale}/{slug}" — vd
 * "/en/the-club", "/vi/ve-serene". Không có "trang chủ" nào map về
 * "/" ở tầng này: việc root của 1 locale ("/en") tự chuyển tới trang
 * nào là chuyện REDIRECT ở tầng routing (Nuxt middleware/nuxt.config),
 * không phải việc của mapper — mapper chỉ dịch đúng dữ liệu Strapi
 * thành đường dẫn thật của trang đó.
 *
 * Lấy `page.locale` (locale của CHÍNH page đó, Strapi đã trả sẵn)
 * thay vì phải truyền thêm tham số locale vào từ ngoài — vừa gọn,
 * vừa đảm bảo luôn đúng bản dịch tương ứng với page này.
 */
function pageToPath(page: StrapiPageRef | null): string {
  if (!page) return "#"; // phòng hờ dữ liệu thiếu (link internal nhưng chưa gắn page)
  return `/${page.locale}/${page.slug}`;
}

/**
 * Input:  StrapiNavLink thô — có field `type` ("internal"/"external")
 *         quyết định nên đọc `url` (external) hay `page.slug` (internal).
 * Output: NavLink gọn — component chỉ cần đọc `to`, không cần biết
 *         gì về "type" hay cấu trúc `page`.
 */
export function mapNavLink(link: StrapiNavLink): NavLink {
  const external = link.type === "external";

  return {
    id: link.id,
    label: link.label,
    external,
    to: external ? (link.url ?? "#") : pageToPath(link.page),
    newTab: link.openInNewTab,
  };
}

// ============================================================
// 3) NAV ITEM — 1 mục menu, có thể có menu con (children)
// ============================================================

export type NavItem = NavLink & {
  children: NavLink[];
};

/**
 * Input:  StrapiNavItem thô — { link: {...}, children: [...] }
 *         (nhắc lại: children là mảng link PHẲNG, không bọc `.link`).
 * Output: NavItem — "làm phẳng" thành 1 object NavLink kèm thêm
 *         `children`, để component chỉ cần v-for qua children mà
 *         không cần biết cấu trúc lồng gốc của Strapi.
 */
export function mapNavItem(item: StrapiNavItem): NavItem {
  return {
    ...mapNavLink(item.link),
    children: (item.children ?? []).map(mapNavLink),
  };
}
