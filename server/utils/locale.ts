/**
 * server/utils/locale.ts
 * ==================================================================
 * MỤC ĐÍCH: Quản lý ngôn ngữ (i18n) tập trung cho toàn bộ server
 *
 * VẤN ĐỀ TRƯỚC ĐÂY:
 * Logic "locale === 'vi' ? 'vi' : 'en'" bị lặp lại y hệt ở:
 * - navigation.get.ts
 * - [slug].get.ts
 * → Nếu thêm ngôn ngữ mới (ví dụ "fr"), phải nhớ sửa TẤT CẢ các chỗ đó
 * → Dễ bị sót, khó maintain
 *
 * GIẢI PHÁP:
 * - SUPPORTED_LOCALES: 1 nguồn sự thật duy nhất về danh sách ngôn ngữ
 * - resolveLocale(): hàm dùng chung, thay thế ternary rải rác
 * - Chỉ cần sửa 1 nơi khi thêm/bớt ngôn ngữ
 *
 * TẠI SAO TÁCH RIÊNG FILE NÀY?
 * 1. Tái sử dụng: nhiều endpoint cùng cần resolve locale
 * 2. Dễ test: hàm thuần, không side effect
 * 3. Type safety: TypeScript tự highlight nếu dùng sai locale
 * ==================================================================
 */
import type { H3Event } from "h3";

/**
 * ==================================================================
 * SUPPORTED_LOCALES
 * ==================================================================
 * DANH SÁCH NGÔN NGỮ ĐƯỢC HỖ TRỢ
 *
 * `as const` là TypeScript assertion:
 * - Không có: type Locale = string[]
 * - Có as const: type Locale = "en" | "vi" (literal types)
 * → TypeScript sẽ báo lỗi nếu dùng locale không có trong list
 *
 * CẤU HÌNH HIỆN TẠI:
 * - "en" (English) - mặc định
 * - "vi" (Vietnamese)
 *
 * MUỐN THÊM NGÔN NGỮ MỚI?
 * Chỉ cần thêm vào array này:
 *   export const SUPPORTED_LOCALES = ["en", "vi", "fr"] as const;
 * → TypeScript tự cập nhật type Locale
 * → Tất cả code dùng Locale type sẽ tự highlight lỗi nếu chưa xử lý ngôn ngữ mới
 * ==================================================================
 */
export const SUPPORTED_LOCALES = ["en", "vi"] as const;

/**
 * ==================================================================
 * Locale type
 * ==================================================================
 * TYPE CHO NGÔN NGỮ
 *
 * Derived type từ SUPPORTED_LOCALES:
 *   (typeof SUPPORTED_LOCALES)[number]
 * → Trích xuất type từ array literal
 *
 * KẾT QUẢ:
 *   type Locale = "en" | "vi"
 *
 * LỢI ÍCH:
 * - TypeScript autocomplete gợi ý đúng các giá trị hợp lệ
 * - Báo lỗi compile time nếu dùng giá trị không hợp lệ
 * ==================================================================
 */
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * ==================================================================
 * DEFAULT_LOCALE
 * ==================================================================
 * NGÔN NGỮ MẶC ĐỊNH
 *
 * Fallback khi:
 * - Query string không có locale
 * - Locale trong query không hợp lệ (không có trong SUPPORTED_LOCALES)
 *
 * TẠI SAO TÁCH RA CONSTANT?
 * 1. Tường minh: đọc code thấy rõ default là gì
 * 2. Dùng lại: nhiều chỗ cần refer đến default
 * 3. 1 nguồn sự thật: đổi 1 chỗ, áp dụng toàn bộ
 * ==================================================================
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * ==================================================================
 * isSupportedLocale(value)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * Kiểm tra xem một giá trị có phải locale hợp lệ không
 *
 * NHẬN VÀO:
 *   @param value - Giá trị bất kỳ (unknown type)
 *                  Thường là giá trị từ query string (?locale=xxx)
 *
 * RETURN:
 *   boolean - true nếu value là một trong SUPPORTED_LOCALES
 *
 * TYPE GUARD:
 * Hàm này là "type guard" - khi return true, TypeScript hiểu:
 * "Sau dòng này, value có type Locale, không phải unknown nữa"
 *
 * Ví dụ:
 *   const raw = getQuery(event).locale; // type: unknown
 *   if (isSupportedLocale(raw)) {
 *     // Trong if block: raw có type Locale
 *     // TypeScript cho phép dùng raw như Locale
 *   }
 * ==================================================================
 */
function isSupportedLocale(value: unknown): value is Locale {
  // includes() trên array literal cần cast vì:
  // - SUPPORTED_LOCALES là readonly tuple ["en", "vi"]
  // - Array.prototype.includes() nhận type unknown[]
  // - Ta cast value sang Locale để TypeScript hiểu đang so sánh đúng type
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * ==================================================================
 * resolveLocale(event)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * Đọc locale từ query string của request, validate, và return
 *
 * NHẬN VÀO:
 *   @param event - H3Event object từ route handler
 *                  Chứa request info: query params, headers, cookies...
 *
 * RETURN:
 *   Locale - Một trong ["en", "vi"]
 *           Đảm bảo luôn hợp lệ (fallback về DEFAULT_LOCALE nếu không)
 *
 * LUỒNG XỬ LÝ:
 *   1. getQuery(event) → lấy object query string
 *      Ví dụ: GET /api/navigation?locale=vi
 *      → getQuery(event) = { locale: "vi" }
 *
 *   2. .locale → lấy giá trị locale
 *      Type: unknown (vì query string có thể là bất cứ thứ gì)
 *
 *   3. isSupportedLocale(raw) → kiểm tra
 *      - "vi" → true → return "vi"
 *      - "en" → true → return "en"
 *      - "fr" → false → fall through
 *      - undefined → false → fall through
 *      - 123 → false → fall through
 *
 *   4. Fallback: DEFAULT_LOCALE ("en")
 *      Nếu không hợp lệ, trả về mặc định
 *
 * TẠI SAO NHẬN event THAY VÌ locale?
 * - Nhận event → gọi getQuery(event) bên trong
 * - Nếu nhận sẵn giá trị → mỗi endpoint phải tự gọi getQuery
 * → Nhận event gọn hơn cho nơi gọi
 * ==================================================================
 */
export function resolveLocale(event: H3Event): Locale {
  // getQuery() là hàm của H3 framework
  // Trả về object chứa tất cả query parameters
  const raw = getQuery(event).locale;

  // Ternary: nếu hợp lệ thì dùng, không thì fallback
  return isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
}

/**
 * ==================================================================
 * otherLocales(current)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * Trả về danh sách các locale TRỪ locale hiện tại
 *
 * NHẬN VÀO:
 *   @param current - Locale hiện tại (đã validate)
 *
 * RETURN:
 *   Locale[] - Array chứa các locale còn lại
 *              Ví dụ: current = "en" → ["vi"]
 *                     current = "vi" → ["en"]
 *
 * USE CASE:
 * Language Switcher trong UI:
 * - User đang xem trang tiếng Anh
 * - Muốn hiển thị nút chuyển sang tiếng Việt
 * → Dùng otherLocales("en") để lấy ["vi"] → hiển thị flag/name
 * ==================================================================
 */
export function otherLocales(current: Locale): Locale[] {
  // filter() giữ lại items thỏa điều kiện
  // Ở đây: giữ lại locale KHÁC với current
  return SUPPORTED_LOCALES.filter((l) => l !== current);
}
