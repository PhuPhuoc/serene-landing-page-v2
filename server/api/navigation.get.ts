/**
 * server/api/navigation.get.ts
 * ==================================================================
 * ROUTE: GET /api/navigation?locale=en|vi
 *
 * MỤC ĐÍCH: API endpoint để frontend lấy dữ liệu header/navigation
 * từ Strapi CMS. Đây là "cánh cổng" duy nhất để frontend truy cập
 * navigation data.
 *
 * TẠI SAO CẦN BFF (Backend for Frontend)?
 * Thay vì frontend gọi trực tiếp Strapi, ta có server route này làm
 * lớp trung gian. Lợi ích:
 * - Ẩn token xác thực của Strapi (không lộ trong browser)
 * - Chuyển đổi cấu trúc dữ liệu phức tạp của Strapi thành shape
 *   đơn giản hơn cho frontend
 * - Tập trung xử lý lỗi ở một nơi
 *
 * LUỒNG XỬ LÝ (đọc theo thứ tự code chạy):
 *   1. resolveLocale(event) → lấy locale từ query string
 *   2. strapiFetch("/header", {...}) → gọi Strapi lấy content-type "header"
 *   3. Nếu lỗi → handleStrapiError (throw, không continue)
 *   4. mapMedia(), mapNavItem()... → chuyển dữ liệu thô → shape gọn
 *   5. return JSON cho frontend
 * ==================================================================
 */
import type { StrapiHeader, StrapiSingle } from "../types/strapi";
import { strapiFetch } from "../utils/strapi";
import {
  mapMedia,
  mapNavItem,
  mapNavLink,
  type Media,
  type NavItem,
  type NavLink,
} from "../utils/mappers";
import { resolveLocale } from "../utils/locale";
import { handleStrapiError } from "../utils/errors";

/**
 * ==================================================================
 * NavigationResponse
 * ==================================================================
 * Shape dữ liệu TRẢ VỀ cho frontend.
 *
 * TẠI SAO CẦN ĐỊNH NGHĨA TYPE NÀY?
 * 1. Frontend (Vue components) cần biết chính xác shape của response
 * 2. Tự động hoá type inference (IntelliSense, autocomplete)
 * 3. Catch lỗi sớm lúc compile thay vì runtime
 *
 * SO SÁNH VỚI STRAPI RESPONSE:
 * - Strapi trả: { data: { logoOnLight: { url: "/uploads/...", formats: {...} } } }
 * - Ta trả:     { logoOnLight: { url: "http://localhost:1337/uploads/...", alt: "..." } }
 * ==================================================================
 */
export type NavigationResponse = {
  /** Logo hiển thị trên nền sáng (thường dùng khi header trong suốt) */
  logoOnLight: Media;
  /** Logo hiển thị trên nền tối (thường dùng khi header có background) */
  logoOnDark: Media;
  /** Danh sách các mục menu chính (About, Our Story, ...) */
  navItems: NavItem[];
  /** Link "Đăng nhập" hoặc "Login" ở góc phải header */
  utilityLink: NavLink;
  /** Nút CTA chính như "Đặt bàn" hoặc "Book Now" */
  cta: NavLink;
};

/**
 * ==================================================================
 * defineEventHandler()
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * Đăng ký một HTTP route handler với Nitro server.
 * - Tên file: navigation.get.ts → route GET /api/navigation
 * - Tên file: [slug].get.ts → route GET /api/:slug
 *
 * NHẬN VÀO:
 *   event - H3Event object, chứa:
 *          - Query params (?locale=en)
 *          - Headers, cookies
 *          - Request body (nếu có)
 *
 * RETURN:
 *   Promise<NavigationResponse> - JSON response cho frontend
 * ==================================================================
 */
export default defineEventHandler(
  async (event): Promise<NavigationResponse> => {
    // -----------------------------------------------------------
    // Bước 1: Đọc cấu hình Strapi
    // -----------------------------------------------------------
    // useRuntimeConfig() đọc từ nuxt.config.ts
    // strapiUrl: base URL của Strapi (mặc định: http://localhost:1337)
    const { strapiUrl } = useRuntimeConfig();

    // -----------------------------------------------------------
    // Bước 2: Resolve locale từ query string
    // -----------------------------------------------------------
    // Input:  ?locale=en hoặc ?locale=vi hoặc không có query
    // Output: "en" hoặc "vi" (đã được validate theo SUPPORTED_LOCALES)
    // Fallback: "en" nếu không hợp lệ hoặc không có
    //
    // TẠI SAO CẦN HÀM RIÊNG resolveLocale()?
    // - Tránh lặp lại logic "locale === 'vi' ? 'vi' : 'en'" ở nhiều chỗ
    // - Nếu thêm ngôn ngữ mới (fr, ja...), chỉ sửa 1 nơi
    const locale = resolveLocale(event);

    // -----------------------------------------------------------
    // Bước 3: Khai báo biến để lưu dữ liệu từ Strapi
    // -----------------------------------------------------------
    // let thay vì const vì sẽ gán trong try block
    // TypeScript cần biết type trước để check ở dòng return
    let header: StrapiHeader;

    // -----------------------------------------------------------
    // Bước 4: Gọi Strapi API
    // -----------------------------------------------------------
    try {
      /**
       * strapiFetch<StrapiSingle<StrapiHeader>>("/header", {...})
       *
       * STRAPI CONTENT TYPE: "header" (single type)
       * STRAPI RESPONSE FORMAT: { data: {...}, meta: {...} }
       * → Định nghĩa trong StrapiSingle<T> type
       *
       * POPULATE OBJECT - giải thích:
       * Strapi mặc định không trả nested relations. Ta phải chỉ định
       * rõ ràng những field nào cần populate (lấy đầy đủ dữ liệu).
       *
       * Sau khi qua qs.stringify(), object này thành query string:
       *   populate[logoOnLight]=true
       *   populate[logoOnDark]=true
       *   populate[navItems][populate][link][populate][page]=true
       *   populate[navItems][populate][children][populate][page]=true
       *   populate[utilityLink][populate][page]=true
       *   populate[cta][populate][page]=true
       *
       * CẤU TRÚC NAVIGATION TRONG STRAPI:
       * - Header (1 single type, chứa toàn bộ header)
       *   ├── logoOnLight (media)
       *   ├── logoOnDark (media)
       *   ├── navItems (component, array)
       *   │   ├── link (component)
       *   │   │   ├── label
       *   │   │   ├── type ("internal" | "external")
       *   │   │   ├── url (nếu external)
       *   │   │   └── page (nếu internal - relation to Page)
       *   │   └── children (component, array - submenu items)
       *   ├── utilityLink (component)
       *   └── cta (component)
       */
      const response = await strapiFetch<StrapiSingle<StrapiHeader>>(
        "/header",
        {
          locale,
          populate: {
            // Logo trên nền sáng
            logoOnLight: true,
            // Logo trên nền tối
            logoOnDark: true,
            // Các mục menu chính
            navItems: {
              populate: {
                // Link của mỗi mục menu (có thể là internal hoặc external)
                link: { populate: { page: true } },
                // Các mục con (dropdown submenu)
                children: { populate: { page: true } },
              },
            },
            // Link phụ (Login/Đăng nhập)
            utilityLink: { populate: { page: true } },
            // Nút CTA chính (Book Now/Đặt bàn)
            cta: { populate: { page: true } },
          },
        },
      );

      // Trích xuất data từ wrapper { data: {...}, meta: {...} }
      header = response.data;

    } catch (err) {
      // -----------------------------------------------------------
      // Bước 5: Xử lý lỗi
      // -----------------------------------------------------------
      /**
       * handleStrapiError() LUÔN THROW (không bao giờ return bình thường)
       * Kiểu return là `never` để TypeScript hiểu điều này
       *
       * TẠI SAO DÙNG try/catch + throw TIẾP?
       * - catch bắt error từ strapiFetch
       * - handleStrapiError log chi tiết + throw error mới với format chuẩn
       *
       * SAU DÒNG throw, function DỪNG LẠI - không chạy tiếp xuống return
       */
      handleStrapiError(err, "GET /api/navigation");
      // TypeScript hiểu: nếu code còn chạy tiếp sau dòng trên,
      // thì header đã được gán ở try block phía trên
    }

    // -----------------------------------------------------------
    // Bước 6: Transform dữ liệu → response shape
    // -----------------------------------------------------------
    /**
     * TẠI SAO PHẢI "MAP" / CHUYỂN ĐỔI?
     *
     * 1. STRAPI URL LÀ TƯƠNG ĐỐI:
     *    Strapi trả: url: "/uploads/logo.svg"
     *    Browser cần: url: "http://localhost:1337/uploads/logo.svg"
     *    → Cần hàm toAbsoluteUrl() để ghép với strapiUrl
     *
     * 2. STRAPI CÓ QUÁ NHIỀU FIELD NỘI BỘ:
     *    media có: url, formats (thumbnail, small, medium, large), hash,
     *    mime, size, provider, createdAt, updatedAt...
     *    Frontend chỉ cần: url, alt, width, height
     *
     * 3. TÊN FIELD KHÔNG NHẤT QUÁN:
     *    Strapi: alternativeText, openInNewTab
     *    Frontend muốn: alt, newTab
     *    → Giữ nguyên hoặc rename tùy convention
     *
     * LỢI ÍCH CỦA MAPPER PATTERN:
     * - Nếu Strapi đổi cấu trúc, chỉ sửa mappers.ts, không sửa
     *   tất cả component Vue đang dùng dữ liệu này
     * - Dễ test độc lập (pure function, không mock network)
     */
    return {
      // Logo nền sáng: chuyển url tương đối → tuyệt đối
      logoOnLight: mapMedia(header.logoOnLight, strapiUrl),
      // Logo nền tối: chuyển url tương đối → tuyệt đối
      logoOnDark: mapMedia(header.logoOnDark, strapiUrl),
      // Các mục menu: map từng item, kèm children (submenu)
      navItems: header.navItems.map(mapNavItem),
      // Link phụ (Login)
      utilityLink: mapNavLink(header.utilityLink),
      // Nút CTA
      cta: mapNavLink(header.cta),
    };
  },
);
