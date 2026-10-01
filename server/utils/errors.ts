/**
 * server/utils/errors.ts
 * ==================================================================
 * MỤC ĐÍCH: Xử lý lỗi tập trung cho các endpoint gọi Strapi
 *
 * VẤN ĐỀ TRƯỚC ĐÂY:
 * - navigation.get.ts KHÔNG có try/catch
 * - [slug].get.ts CÓ try/catch riêng
 * → Khi Strapi lỗi, 2 endpoint trả response KHÁC NHAU:
 *   - navigation: lỗi 500 mặc định của Nitro
 *   - slug: có statusMessage rõ ràng từ handler riêng
 * → Không nhất quán, khó cho frontend xử lý
 *
 * GIẢI PHÁP:
 * - Gom xử lý lỗi vào 1 hàm dùng chung: handleStrapiError()
 * - Luôn log chi tiết ở server (để debug)
 * - Chỉ trả message chung chung cho client (bảo mật)
 *
 * TẠI SAO PHẢI BẢO MẬT MESSAGE?
 * Message lỗi như "Strapi fetch failed" tiết lộ:
 * - Hệ thống đang dùng Strapi CMS
 * - Cấu trúc internal (tên bảng, field...)
 * → Hacker có thể khai thác thông tin này
 * ==================================================================
 */

/**
 * Kiểu dữ liệu mà hàm xử lý lỗi mong đợi từ $fetch
 *
 * $fetch/ofetch throw error với structure:
 * {
 *   statusCode: number,    // 400, 401, 404, 500...
 *   data: unknown,         // response body (thường là error object)
 *   message: string        // mô tả lỗi
 * }
 *
 * Tuy nhiên error thực tế có thể là bất cứ thứ gì (unknown),
 * nên ta cast sang FetchError để truy cập các field
 */
type FetchError = {
  statusCode?: number;
  data?: unknown;
  message?: string;
};

/**
 * ==================================================================
 * handleStrapiError(err, context)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * 1. Log chi tiết lỗi ở server console (để developer debug)
 * 2. Throw error với format chuẩn cho client
 *
 * NHẬN VÀO:
 *   @param err     - Error object từ catch block (thường là FetchError)
 *   @param context - Chuỗi mô tả context, ví dụ: "GET /api/navigation"
 *                    Giúp phân biệt lỗi ở đâu khi đọc log
 *
 * RETURN:
 *   never - Hàm này KHÔNG BAO GIỜ return bình thường
 *          Nó LUÔN throw error mới
 *          TypeScript dùng `never` để báo: "hàm này không return"
 *
 * TẠI SAO DÙNG never?
 * - Giúp TypeScript hiểu: sau dòng gọi handleStrapiError(),
 *   code sẽ KHÔNG tiếp tục chạy (đã throw)
 * - Trong navigation.get.ts, sau khi gọi hàm này trong catch,
 *   TypeScript biết `header` đã được gán (vì nếu không throw,
 *   tức là lỗi xảy ra trong try, và header đã được gán)
 * ==================================================================
 */
export function handleStrapiError(err: unknown, context: string): never {
  // Cast err sang FetchError để truy cập các field cụ thể
  const e = err as FetchError;

  // -----------------------------------------------------------
  // Bước 1: Log chi tiết (CHỈ Ở SERVER, không gửi cho client)
  // -----------------------------------------------------------
  /**
   * console.error() in ra stderr, thường được capture bởi:
   * - Terminal (khi dev)
   * - Log aggregation service (khi production)
   *
   * Format log: "[Strapi] {context}: {chi tiết lỗi}"
   * Ví dụ: "[Strapi] GET /api/navigation: Invalid token"
   *
   * THỨ TỰ ƯU TIÊN LOG:
   * 1. e?.data - thường chứa thông tin chi tiết nhất từ Strapi
   * 2. e?.message - message từ $fetch
   * 3. err - fallback toàn bộ error object
   *
   * Dùng ?? (nullish coalescing) thay vì || vì:
   * - || sẽ dùng fallback nếu value là falsy (0, "", false)
   * - ?? chỉ dùng fallback nếu value là null hoặc undefined
   * → Giữ lại giá trị 0 hoặc "" nếu có ý nghĩa
   */
  console.error(`[Strapi] ${context}:`, e?.data ?? e?.message ?? err);

  // -----------------------------------------------------------
  // Bước 2: Throw error chuẩn cho client
  // -----------------------------------------------------------
  /**
   * createError() là hàm của Nitro/H3, tạo error response chuẩn
   * Response này sẽ được Nitro convert thành JSON error response:
   * {
   *   "statusCode": 500,
   *   "statusMessage": "Unable to fetch content",
   *   "message": "Unable to fetch content"
   * }
   */
  throw createError({
    statusCode: e?.statusCode ?? 500,
    statusMessage: "Unable to fetch content",
  });
}
