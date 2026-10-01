/**
 * server/utils/mappers.ts
 * ==================================================================
 * MỤC ĐÍCH: Các hàm "dịch" dữ liệu từ Strapi sang format cho frontend
 *
 * ==================================================================
 * MAPPER LÀ GÌ? TẠI SAO CẦN MAPPER?
 * ==================================================================
 * MAPPER = Pure functions (hàm thuần) nhận dữ liệu thô đầu vào,
 * trả về dữ liệu đã được "dịch" ở format phù hợp hơn.
 *
 * ĐẶC ĐIỂM CỦA PURE FUNCTION:
 * - Không gọi API
 * - Không đọc config
 * - Không có side effect (không mutate input, không log, không throw)
 * - Cùng input → cùng output (deterministic)
 *
 * LỢI ÍCH:
 * 1. Tách biệt concerns: API layer vs Presentation layer
 * 2. Dễ test: không cần mock network, chỉ cần pass input vào
 * 3. Dễ maintain: đổi Strapi schema → chỉ sửa mapper
 * 4. Tái sử dụng: nhiều endpoint có thể dùng cùng mapper
 *
 * ==================================================================
 * VẤN ĐỀ NẾU KHÔNG CÓ MAPPER
 * ==================================================================
 * Ví dụ: Frontend đọc trực tiếp từ Strapi response
 *
 * ❌ KHÔNG NÊN:
 *    {{ header.logoOnLight.url }}
 *    {{ header.navItems[0].link.page.slug }}
 *
 * → Frontend phụ thuộc vào cấu trúc Strapi
 * → Đổi field trong Strapi → sửa TẤT CẢ component dùng dữ liệu đó
 * → Không biết field nào bắt buộc, field nào optional
 *
 * ✅ NÊN (dùng mapper):
 *    {{ nav.logoOnLight.url }}
 *    {{ nav.navItems[0].to }}
 *
 * → Frontend chỉ biết shape đã được "dịch"
 * → Strapi đổi → chỉ sửa mapper.ts
 * → Type definitions rõ ràng
 * ==================================================================
 */
import type {
  StrapiMedia,
  StrapiNavItem,
  StrapiNavLink,
  StrapiPageRef,
} from "../types/strapi";

// ==================================================================
// PHẦN 1: MEDIA (Hình ảnh, Logo)
// ==================================================================

/**
 * ==================================================================
 * toAbsoluteUrl(strapiUrl, url)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * Chuyển URL tương đối của Strapi thành URL tuyệt đối
 *
 * NHẬN VÀO:
 *   @param strapiUrl - Base URL của Strapi (vd: "http://localhost:1337")
 *   @param url      - URL tương đối từ Strapi (vd: "/uploads/logo.svg")
 *                     Có thể undefined hoặc null
 *
 * RETURN:
 *   string - URL tuyệt đối hoàn chỉnh
 *            Nếu url là null/undefined → return ""
 *
 * VÍ DỤ:
 *   toAbsoluteUrl("http://localhost:1337", "/uploads/logo.svg")
 *   → "http://localhost:1337/uploads/logo.svg"
 *
 *   toAbsoluteUrl("http://localhost:1337", "https://cdn.example.com/img.png")
 *   → "https://cdn.example.com/img.png" (giữ nguyên vì đã là tuyệt đối)
 *
 * TẠI SAO URL CỦA STRAPI LÀ TƯƠNG ĐỐI?
 * Strapi không biết nó sẽ được truy cập từ domain nào:
 * - Local dev: http://localhost:1337
 * - Staging: https://staging.example.com
 * - Production: https://api.example.com
 * → Strapi chỉ lưu path: "/uploads/logo.svg"
 * → App phải tự ghép với base URL của mình
 *
 * TẠI SAO GIỮ NGUYÊN URL TUYỆT ĐỐI?
 * Nếu sau này chuyển sang CDN/S3:
 * - Strapi có thể configure trả URL tuyệt đối luôn
 * - Hoặc dùng Strapi provider khác (Cloudinary, AWS S3...)
 * → Code vẫn hoạt động vì đã check startsWith("http")
 * ==================================================================
 */
export function toAbsoluteUrl(strapiUrl: string, url?: string | null): string {
  // Handle null/undefined/empty string
  if (!url) return "";

  // Nếu đã là URL tuyệt đối (bắt đầu bằng http), giữ nguyên
  // Dùng startsWith thay vì regex vì:
  // - Nhanh hơn cho common case
  // - Đủ cho use case này (không cần validate URL hoàn chỉnh)
  return url.startsWith("http") ? url : `${strapiUrl}${url}`;
}

/**
 * ==================================================================
 * Media type
 * ==================================================================
 * Shape dữ liệu hình ảnh CHO FRONTEND
 *
 * SO SÁNH VỚI STRAPIMEDIA:
 * - Strapi: url, alternativeText, width, height, formats (thumbnail, small...)
 * - Frontend cần: url, alt, width, height
 *
 * RENAME:
 * - alternativeText → alt (ngắn gọn hơn, convention của HTML img)
 * - Bỏ formats: frontend tự quyết định size nào (hoặc dùng srcset)
 * ==================================================================
 */
export type Media = {
  /** URL đầy đủ, đã ghép với strapiUrl */
  url: string;
  /** Alt text cho accessibility (fallback: empty string) */
  alt: string;
  /** Chiều rộng ảnh (px) - optional vì có thể không có */
  width?: number;
  /** Chiều cao ảnh (px) - optional vì có thể không có */
  height?: number;
};

/**
 * ==================================================================
 * mapMedia(media, strapiUrl)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * "Dịch" StrapiMedia thành Media type cho frontend
 *
 * NHẬN VÀO:
 *   @param media     - Dữ liệu ảnh thô từ Strapi
 *   @param strapiUrl - Base URL của Strapi (để convert relative → absolute)
 *
 * RETURN:
 *   Media - Shape sạch cho frontend
 *
 * LƯU Ý:
 * - Hàm này THUẦN - không gọi API, không side effects
 * - Có thể test độc lập: mapMedia({url: "/a.png", ...}, "http://x.com")
 * ==================================================================
 */
export function mapMedia(media: StrapiMedia, strapiUrl: string): Media {
  return {
    // Chuyển url tương đối → tuyệt đối
    url: toAbsoluteUrl(strapiUrl, media.url),
    // alternativeText có thể là null → dùng ?? fallback thành ""
    // Dùng ?? (nullish) thay vì || vì:
    // - || "" sẽ fallback cả khi alt là "", 0, false
    // - ?? "" chỉ fallback khi alt là null hoặc undefined
    alt: media.alternativeText ?? "",
    width: media.width,
    height: media.height,
  };
}

// ==================================================================
// PHẦN 2: LINK / NAVIGATION LINK
// ==================================================================

/**
 * ==================================================================
 * NavLink type
 * ==================================================================
 * Shape dữ liệu link CHO FRONTEND
 *
 * SO SÁNH VỚI STRAPINAVLINK:
 * - Strapi: id, label, type ("internal"|"external"), url, page, openInNewTab
 * - Frontend cần: id, label, external, to, newTab
 *
 * RENAME/SIMPLIFY:
 * - type → external (boolean, đơn giản hơn)
 * - page.slug → to (đã resolve thành full path)
 * - openInNewTab → newTab (consistent naming)
 * ==================================================================
 */
export type NavLink = {
  /** ID của link trong Strapi (để track/debug) */
  id: number;
  /** Text hiển thị (ví dụ: "About Us", "Về chúng tôi") */
  label: string;
  /**
   * true = link ra ngoài website (external)
   * false = link nội bộ (internal page)
   *
   * Frontend dùng field này để quyết định:
   * - Dùng <a target="_blank"> hay <NuxtLink>
   * - Có cần thêm rel="noopener noreferrer" không
   */
  external: boolean;
  /**
   * Đường dẫn đầy đủ để gắn vào thẻ <a href=""> hoặc <NuxtLink to="">
   * - External: giá trị của url (ví dụ: "https://google.com")
   * - Internal: full path (ví dụ: "/en/about-us")
   */
  to: string;
  /** true = mở link trong tab mới (_blank) */
  newTab: boolean;
};

/**
 * ==================================================================
 * pageToPath(page)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * Chuyển Strapi page reference thành URL path hoàn chỉnh
 *
 * NHẬN VÀO:
 *   @param page - StrapiPageRef hoặc null
 *                 null có thể xảy ra nếu:
 *                 - Link type là "internal" nhưng chưa gắn page
 *                 - Data corruption trong Strapi
 *
 * RETURN:
 *   string - Full path dạng "/{locale}/{slug}"
 *            Ví dụ: "/en/about-us", "/vi/ve-chung-toi"
 *            Nếu page là null: return "#" (fallback)
 *
 * TẠI SAO FORMAT "/{locale}/{slug}"?
 * Ứng dụng dùng i18n routing của Nuxt:
 * - Mỗi page có locale riêng trong URL
 * - /en/about-us ≠ /vi/ve-chung-toi (có thể có nội dung khác nhau)
 *
 * TẠI SAO KHÔNG DÙNG "/" CHO HOMEPAGE?
 * Homepage sẽ có slug khác:
 * - /en hoặc /en/home
 * - /vi hoặc /vi/trang-chu
 * Việc "/" tự redirect đến homepage là ở tầng routing (middleware),
 * không phải việc của mapper
 *
 * TẠI SAO LẤY page.locale THAY VÌ TRUYỀN LOCALE TỪ NGOÀI?
 * - Strapi đã lưu locale của mỗi page
 * - Truyền từ ngoài vào → có thể sai nếu query locale khác với page.locale
 * - Lấy từ page.locale → đảm bảo đúng bản dịch
 * ==================================================================
 */
function pageToPath(page: StrapiPageRef | null): string {
  // Null guard: phòng trường hợp internal link nhưng chưa gắn page
  if (!page) return "#";

  // Format: /{locale}/{slug}
  // page.locale: "en" hoặc "vi"
  // page.slug: "about-us", "ve-chung-toi"
  return `/${page.locale}/${page.slug}`;
}

/**
 * ==================================================================
 * mapNavLink(link)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * "Dịch" StrapiNavLink thành NavLink cho frontend
 *
 * NHẬN VÀO:
 *   @param link - Dữ liệu link thô từ Strapi:
 *                 {
 *                   id: number,
 *                   label: string,
 *                   type: "internal" | "external",
 *                   url: string | null,       // chỉ có khi external
 *                   page: StrapiPageRef | null, // chỉ có khi internal
 *                   openInNewTab: boolean
 *                 }
 *
 * RETURN:
 *   NavLink - Shape gọn cho frontend
 *
 * LOGIC CHUYỂN ĐỔI:
 * 1. external = (link.type === "external")
 *    - Nếu type là "external" → external = true
 *    - Nếu type là "internal" → external = false
 *
 * 2. to:
 *    - external=true → dùng link.url
 *    - external=false → dùng pageToPath(link.page)
 *
 * 3. url null handling:
 *    - Nếu external nhưng url là null → fallback "#"
 *    - (Ít xảy ra nhưng phòng trường hợp data lỗi)
 * ==================================================================
 */
export function mapNavLink(link: StrapiNavLink): NavLink {
  // Xác định link có phải external không
  const external = link.type === "external";

  return {
    id: link.id,
    label: link.label,
    external,
    // Ternary: external → url, internal → pageToPath
    // Dùng ?? "#" để handle null url (backup)
    to: external ? (link.url ?? "#") : pageToPath(link.page),
    newTab: link.openInNewTab,
  };
}

// ==================================================================
// PHẦN 3: NAV ITEM (Mục menu có thể có submenu)
// ==================================================================

/**
 * ==================================================================
 * NavItem type
 * ==================================================================
 * Shape dữ liệu mục menu CHO FRONTEND
 *
 * NavItem = NavLink + children
 * Nghĩa là: mỗi mục menu có thể có submenu (children)
 *
 * Ví dụ cấu trúc menu:
 * - About Us (NavItem)
 *   - Our Story (NavLink - child)
 *   - Team (NavLink - child)
 *   - Careers (NavLink - child)
 * - Contact (NavLink - không có children)
 * ==================================================================
 */
export type NavItem = NavLink & {
  /**
   * Danh sách các mục con (submenu/dropdown)
   * - Type: NavLink[] (mảng NavLink, không phải NavItem[])
   * - Nghĩa là: submenu KHÔNG có submenu thêm (1 cấp)
   *
   * Empty array [] nếu không có submenu
   */
  children: NavLink[];
};

/**
 * ==================================================================
 * mapNavItem(item)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * "Dịch" StrapiNavItem thành NavItem cho frontend
 *
 * NHẬN VÀO:
 *   @param item - Dữ liệu mục menu thô từ Strapi:
 *                 {
 *                   id: number,
 *                   link: StrapiNavLink,    // link chính của mục
 *                   children: StrapiNavLink[] // mảng link con (submenu)
 *                 }
 *
 * RETURN:
 *   NavItem - Shape gọn cho frontend:
 *             {
 *               id: number,
 *               label: string,
 *               external: boolean,
 *               to: string,
 *               newTab: boolean,
 *               children: NavLink[]
 *             }
 *
 * CẤU TRÚC STRAPI VS OUTPUT:
 * Strapi:   { link: {...}, children: [...] }
 * Output:   { ...link, children: [...] }
 *
 * → Spread operator (...) để flatten cấu trúc
 * → Frontend chỉ cần đọc properties trực tiếp, không cần .link.xxx
 *
 * NOTE VỀ children:
 * - Strapi children là mảng PHẲNG (không có nested object .link)
 * - mapNavLink() xử lý từng item trong array
 * - Dùng item.children ?? [] để handle null/undefined
 * ==================================================================
 */
export function mapNavItem(item: StrapiNavItem): NavItem {
  return {
    // Spread link properties vào đây
    // Tương đương: id: item.link.id, label: item.link.label, ...
    ...mapNavLink(item.link),
    // Map từng child thành NavLink
    // Dùng ?? [] để handle trường hợp children là null/undefined
    children: (item.children ?? []).map(mapNavLink),
  };
}
