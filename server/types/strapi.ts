/**
 * server/types/strapi.ts
 * ==================================================================
 * MỤC ĐÍCH: Định nghĩa TypeScript types cho dữ liệu Strapi API trả về
 *
 * ==================================================================
 * NGUYÊN TẮC THIẾT KẾ
 * ==================================================================
 * CHỈ định nghĩa NHỮNG FIELD THỰC SỰ DÙNG.
 *
 * Strapi trả về RẤT NHIỀU field nội bộ:
 * - Media: hash, mime, size, provider, createdAt, updatedAt,
 *          related, fileName, alternativeText, width, height...
 * - Page: createdBy, updatedBy, publishedAt, visibility...
 *
 * KHÔNG nên copy nguyên hết vào type vì:
 * 1. Type "giả vờ" quan trọng những field không ai đọc tới
 * 2. Type dài dòng, khó đọc
 * 3. Khi Strapi đổi field không dùng, type không cần update
 *
 * THAY VÀO ĐÓ:
 * - Chỉ define field mà app THỰC SỰ dùng
 * - Tính tương thích: nếu Strapi trả thêm field, không sao
 *   (TypeScript ignore những field không khai báo)
 * ==================================================================
 */

// ==================================================================
// PHẦN 1: GENERIC RESPONSE WRAPPER
// ==================================================================

/**
 * ==================================================================
 * StrapiSingle<T> và StrapiList<T>
 * ==================================================================
 * STRAPI LUÔN bọc response trong { data, meta } wrapper:
 *
 * Single type (ví dụ: /header - chỉ có 1 record):
 *   { data: { id: 1, ... }, meta: { ... } }
 *
 * List type (ví dụ: /articles - nhiều records):
 *   { data: [{ id: 1, ... }, { id: 2, ... }], meta: { ... } }
 *
 * TẠI SAO CẦN WRAPPER TYPE?
 * Thay vì mỗi nơi gọi phải viết:
 *   { data: MyType }
 * Ta define 1 lần và reuse:
 *   StrapiSingle<MyType>
 *
 * LƯU Ý:
 * - `meta` là optional (?)
 * - meta thường chứa pagination info (page, pageSize, pageCount...)
 * - Các endpoint hiện tại không dùng meta
 * ==================================================================
 */
export type StrapiSingle<T> = {
  /** Dữ liệu chính - type T là type của record */
  data: T;
  /** Metadata - thường chứa pagination, timestamps */
  meta?: Record<string, unknown>;
};

export type StrapiList<T> = {
  /** Mảng dữ liệu */
  data: T[];
  /** Metadata */
  meta?: Record<string, unknown>;
};

// ==================================================================
// PHẦN 2: MEDIA TYPES
// ==================================================================

/**
 * ==================================================================
 * StrapiMediaFormat
 * ==================================================================
 * CÁC SIZE VARIANTS của ảnh trong Strapi
 *
 * Strapi tự động generate nhiều size từ 1 ảnh gốc:
 * - thumbnail: ~64x64
 * - small: ~480px
 * - medium: ~768px
 * - large: ~1280px
 * - ...(tùy configuration)
 *
 * Frontend có thể dùng size phù hợp với context:
 * - Thumbnail grid: dùng thumbnail
 * - Full width banner: dùng large
 * ==================================================================
 */
export type StrapiMediaFormat = {
  /** URL của size này */
  url: string;
  /** Chiều rộng (px) - optional vì có thể không resize */
  width?: number;
  /** Chiều cao (px) - optional vì có thể không resize */
  height?: number;
};

/**
 * ==================================================================
 * StrapiMedia
 * ==================================================================
 * Cấu trúc Media object từ Strapi
 *
 * STRAPI MEDIA UPLOAD:
 * Khi upload ảnh lên Strapi, Strapi tạo:
 * - 1 record trong upload_file_files table
 * - Các size variants (thumbnail, small, medium, large...)
 *
 * CÁC FIELD CHÚNG TA DÙNG:
 * - url: đường dẫn tương đối (/)
 * - alternativeText: mô tả ảnh cho accessibility
 * - width, height: kích thước ảnh gốc
 * - formats: các size variants
 *
 * CÁC FIELD CHÚNG TA BỎ QUA (không khai báo):
 * - hash: internal filename hash
 * - mime: MIME type (image/png, image/jpeg...)
 * - size: kích thước file (bytes)
 * - provider: storage provider (local, cloudinary, aws-s3...)
 * - createdAt, updatedAt: timestamps
 * - folderPath: internal folder structure
 * ==================================================================
 */
export type StrapiMedia = {
  /** URL tương đối (Strapi không biết domain) */
  url: string;
  /**
   * Alt text cho accessibility
   * Có thể là string hoặc null (Strapi cho phép empty)
   * Dùng string | null vì Strapi trả về chính xác như vậy
   */
  alternativeText?: string | null;
  /** Chiều rộng ảnh gốc (px) */
  width?: number;
  /** Chiều cao ảnh gốc (px) */
  height?: number;
  /**
   * Các size variants được Strapi generate tự động
   * Key là tên size: "thumbnail", "small", "medium", "large"
   * Value có thể là null (format không được generate)
   */
  formats?: Record<string, StrapiMediaFormat | null>;
};

// ==================================================================
// PHẦN 3: PAGE REFERENCE
// ==================================================================

/**
 * ==================================================================
 * StrapiPageRef
 * ==================================================================
 * THAM CHIẾU ĐẾN MỘT PAGE trong Strapi (dùng trong relations)
 *
 * Khi 1 component có relation đến Page (ví dụ: link.page = Page),
 * Strapi trả về object chứa THÔNG TIN CƠ BẢN của page đó
 *
 * LƯU Ý: ĐÂY KHÔNG PHẢI full page content!
 * Chỉ là reference (id, documentId, một số field cơ bản)
 *
 * CÁC FIELD CHÚNG TA DÙNG:
 * - id, documentId: identifiers
 * - title: tiêu đề page
 * - slug: URL slug
 * - locale: ngôn ngữ của page
 * - hidden: có hiển thị trên navigation không
 *
 * CÁC FIELD CHÚNG TA BỎ QUA:
 * - createdAt, updatedAt, publishedAt: timestamps
 * - createdBy, updatedBy: user info
 * - blocks: page content (dynamic zone) - RẤT NẶNG, không cần ở đây
 * ==================================================================
 */
export type StrapiPageRef = {
  /** Primary key */
  id: number;
  /** Unique document ID (dùng cho API v4+) */
  documentId: string;
  /** Tiêu đề page */
  title: string;
  /** URL slug - phần sau domain: "about-us", "ve-chung-toi" */
  slug: string;
  /** Ngôn ngữ của page này: "en" hoặc "vi" */
  locale: string;
  /** true = page bị ẩn (không hiển thị trong navigation) */
  hidden: boolean;
};

// ==================================================================
// PHẦN 4: LINK COMPONENT
// ==================================================================

/**
 * ==================================================================
 * StrapiLinkType
 * ==================================================================
 * LOẠI LINK trong Strapi
 *
 * Internal: link đến 1 page trong website (dùng page relation)
 * External: link ra ngoài website (dùng url field)
 *
 * Giá trị literal type để TypeScript báo lỗi nếu dùng sai
 * ==================================================================
 */
export type StrapiLinkType = "internal" | "external";

/**
 * ==================================================================
 * StrapiNavLink
 * ==================================================================
 * COMPONENT "NAV LINK" trong Strapi
 *
 * ĐÂY LÀ CONTENT TYPE/COMPONENT dùng cho:
 * - utilityLink (Login/Đăng nhập)
 * - cta (Book Now/Đặt bàn)
 * - navItems[X].link
 * - navItems[X].children[X]
 *
 * CẤU TRÚC:
 * - Dùng UNION TYPE cho type field:
 *   - type = "external" → dùng url
 *   - type = "internal" → dùng page relation
 *
 * CÁC FIELD:
 * - id: component instance ID
 * - label: text hiển thị
 * - type: "internal" hoặc "external"
 * - url: đường dẫn external (chỉ khi type = "external")
 * - openInNewTab: có mở tab mới không
 * - page: reference đến Page (chỉ khi type = "internal")
 * ==================================================================
 */
export type StrapiNavLink = {
  /** ID của component instance */
  id: number;
  /** Text hiển thị (ví dụ: "About Us", "Đặt bàn ngay") */
  label: string;
  /**
   * Loại link
   * - "internal": đến page trong website (đọc page.slug)
   * - "external": ra ngoài website (đọc url)
   */
  type: StrapiLinkType;
  /**
   * URL đầy đủ khi type = "external"
   * Ví dụ: "https://google.com", "https://facebook.com/page"
   * null khi type = "internal"
   */
  url: string | null;
  /** true = mở trong tab mới (target="_blank") */
  openInNewTab: boolean;
  /**
   * Reference đến Strapi Page khi type = "internal"
   * null khi type = "external"
   *
   * CẦN POPULATE ĐỂ CÓ DATA:
   * Trong strapiFetch, phải chỉ định populate:
   *   { populate: { page: true } }
   * Nếu không, Strapi chỉ trả { id: 123 }
   */
  page: StrapiPageRef | null;
};

// ==================================================================
// PHẦN 5: NAV ITEM (MENU ITEM)
// ==================================================================

/**
 * ==================================================================
 * StrapiNavItem
 * ==================================================================
 * COMPONENT "NAV ITEM" trong Strapi - MỘT MỤC TRONG MENU
 *
 * CẤU TRÚC:
 * - link: NavLink component (link chính của mục menu)
 * - children: Mảng NavLink[] (các mục con - submenu)
 *
 * VÍ DỤ MENU STRUCTURE:
 * - About Us (NavItem)
 *   ├── Our Story (children[0])
 *   ├── Team (children[1])
 *   └── Careers (children[2])
 * - Contact (NavItem, không có children)
 *
 * LƯU Ý QUAN TRỌNG:
 * children là MẢNG PHẲNG của StrapiNavLink
 * KHÔNG phải StrapiNavItem[] (không có nesting 2 cấp)
 *
 * TỨC LÀ:
 * Strapi trả về: { link: {...}, children: [{...}, {...}] }
 * KHÔNG PHẢI:   { link: {...}, children: [{ link: {...}, children: [...] }] }
 * ==================================================================
 */
export type StrapiNavItem = {
  /** ID của component instance */
  id: number;
  /** Link chính của mục menu */
  link: StrapiNavLink;
  /**
   * Mảng các mục con (submenu)
   * Type: StrapiNavLink[] (KHÔNG phải NavItem[])
   *
   * Empty array [] nếu không có submenu
   * Null có thể xảy ra nếu field chưa được set trong Strapi
   */
  children: StrapiNavLink[];
};

// ==================================================================
// PHẦN 6: HEADER (SINGLE TYPE)
// ==================================================================

/**
 * ==================================================================
 * StrapiHeader
 * ==================================================================
 * CONTENT TYPE "HEADER" trong Strapi (Single Type - chỉ có 1 record)
 *
 * ĐÂY LÀ ROOT OBJECT chứa toàn bộ navigation data:
 * - Logo (2 phiên bản: nền sáng và nền tối)
 * - Các mục menu chính
 * - Utility link (Login)
 * - CTA button
 *
 * STRAPI ENDPOINT: GET /header
 *
 * CẤU TRÚC TRONG STRAPI ADMIN:
 * Header (Collection Type / Single Type)
 * ├── logoOnLight (Media - logo cho nền sáng/trong suốt)
 * ├── logoOnDark (Media - logo cho nền tối/có background)
 * ├── navItems (Component - Dynamic Zone hoặc JSON)
 * │   └── [nhiều NavItem components]
 * ├── utilityLink (Component - NavLink)
 * └── cta (Component - NavLink)
 * ==================================================================
 */
export type StrapiHeader = {
  /** Primary key */
  id: number;
  /** Unique document ID (Strapi v4+) */
  documentId: string;
  /** Locale của header này (en, vi) */
  locale: string;
  /** Logo hiển thị trên nền sáng (transparent header) */
  logoOnLight: StrapiMedia;
  /** Logo hiển thị trên nền tối (solid background) */
  logoOnDark: StrapiMedia;
  /** Danh sách các mục menu chính */
  navItems: StrapiNavItem[];
  /** Link phụ (Login/Đăng nhập) */
  utilityLink: StrapiNavLink;
  /** Nút CTA chính (Book Now/Đặt bàn) */
  cta: StrapiNavLink;
};
