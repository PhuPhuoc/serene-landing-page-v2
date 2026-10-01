/**
 * server/utils/strapi.ts
 * ==================================================================
 * MỤC ĐÍCH: Đây là NƠI DUY NHẤT trong toàn bộ ứng dụng biết cách
 * "nói chuyện" với Strapi CMS. Tất cả các route handlers muốn lấy
 * dữ liệu từ Strapi đều phải đi qua hàm này.
 *
 * TẠI SAO CẦN FILE NÀY?
 * - Gom logic gọi API vào 1 chỗ: build URL, gắn token xác thực,
 *   serialize query params đúng format Strapi yêu cầu
 * - Token bí mật (strapiToken) chỉ đọc được ở SERVER, không bị
 *   lộ ra browser (nếu import vào client code, token sẽ nằm
 *   trong bundle JS và ai cũng đọc được!)
 *
 * CÁCH ĐỌC FILE:
 *   1. strapiFetch() - hàm chính, gọi Strapi API
 *   2. Phần còn lại là logic xử lý bên trong strapiFetch()
 * ==================================================================
 */
import qs from "qs";

/**
 * ==================================================================
 * strapiFetch<T>(path, params)
 * ==================================================================
 * HÀM NÀY LÀM GÌ?
 * Gửi request đến Strapi REST API và trả về dữ liệu đã parse JSON.
 *
 * NHẬN VÀO:
 *   @param path  - Đường dẫn sau "/api", ví dụ: "/header", "/pages/123"
 *                  Strapi REST API có dạng: {strapiUrl}/api/{path}
 *   @param params - Object chứa các query params như:
 *                  - locale: ngôn ngữ ("en", "vi")
 *                  - populate: object chỉ định field cần lấy (nested)
 *                  - filters: điều kiện lọc
 *                  Object này sẽ được `qs.stringify` chuyển thành
 *                  query string dạng Strapi yêu cầu:
 *                  `populate[logoOnLight]=true&populate[navItems][populate]=...`
 *
 * RETURN:
 *   Promise<T> - Dữ liệu JSON từ Strapi, được ép kiểu thành T
 *               (TypeScript type assertion - không có runtime validation)
 *
 * LƯU Ý QUAN TRỌNG:
 *   - Hàm này KHÔNG tự bắt lỗi - nơi gọi phải try/catch
 *   - Nếu Strapi trả lỗi (4xx, 5xx), $fetch sẽ throw exception
 *   - Việc xử lý lỗi thế nào là do nơi gọi quyết định (xem errors.ts)
 * ==================================================================
 */
export async function strapiFetch<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  // -----------------------------------------------------------
  // Bước 1: Đọc cấu hình Strapi từ runtimeConfig
  // -----------------------------------------------------------
  // useRuntimeConfig() là hàm của Nuxt, đọc config từ nuxt.config.ts
  // và biến môi trường (.env). Chỉ chạy được ở SERVER.
  const { strapiUrl, strapiToken } = useRuntimeConfig();

  // -----------------------------------------------------------
  // Bước 2: Serialize params thành query string
  // -----------------------------------------------------------
  // qs (query-string) library chuyển object lồng nhau thành
  // bracket notation mà Strapi yêu cầu:
  // Input:  { populate: { logo: true, nav: { populate: { items: true } } } }
  // Output: "populate[logo]=true&populate[nav][populate][items]=true"
  //
  // encodeValuesOnly: true = chỉ encode giá trị, không encode key
  // (Strapi thường không parse đúng nếu key bị encode)
  const query = qs.stringify(params, { encodeValuesOnly: true });

  // -----------------------------------------------------------
  // Bước 3: Build URL hoàn chỉnh
  // -----------------------------------------------------------
  // Ghép: {strapiUrl}/api/{path} + ?{query}
  // Ví dụ: "http://localhost:1337/api/header?locale=en&populate[logoOnLight]=true"
  const url = `${strapiUrl}/api${path}${query ? `?${query}` : ""}`;

  // -----------------------------------------------------------
  // Bước 4: Gọi API
  // -----------------------------------------------------------
  // $fetch của Nitro/ofetch:
  // - Tự parse JSON response thành object
  // - Tự throw error nếu status code không phải 2xx
  // - KHÁC với fetch() gốc: fetch() không throw, phải check .ok
  //
  // Authorization header: gắn Bearer token để Strapi xác thực
  // Strapi sẽ reject request nếu token sai hoặc hết hạn
  const res = await $fetch(url, {
    headers: { Authorization: `Bearer ${strapiToken}` },
  });

  // console.log("res:", JSON.stringify(res, null, 2));

  // -----------------------------------------------------------
  // Bước 5: Return với type assertion
  // -----------------------------------------------------------
  // `as T` là TypeScript assertion, không phải runtime validation
  //
  // TẠI SAO DÙNG `as T` THAY VÌ `$fetch<T>()`?
  // Nuxt có "typed API routes" - nếu viết $fetch<T>(url, ...):
  // TypeScript sẽ suy ra kiểu là TypedInternalResponse<..., T, "get">
  // thay vì đơn giản là T. Vì T là generic tự do, TS không đảm bảo
  // 2 kiểu này khớp nhau -> lỗi "could be instantiated with
  // an arbitrary type".
  //
  // GIẢI PHÁP: để $fetch tự suy kiểu (vì url là string ghép động,
  // không khớp route nào đã biết -> kiểu lỏng lẻo), rồi `as T`
  //
  // HẠN CHẾ: nếu Strapi đổi schema (đổi tên field, xóa field...),
  // lỗi sẽ không phát hiện ngay mà đến khi code truy cập field
  // không tồn tại mới biết (rất khó trace).
  //
  // NÂNG CẤP TRONG TƯƠNG LAI: dùng Zod để validate runtime
  return res as T;
}
