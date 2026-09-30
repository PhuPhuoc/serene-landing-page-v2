/**
 * server/utils/strapi.ts
 * ------------------------------------------------------------------
 * Nơi DUY NHẤT trong app biết cách "nói chuyện" với Strapi:
 * build URL, gắn token bí mật, serialize query dạng bracket-notation.
 *
 * Lưu ý quan trọng: file này chỉ chạy được trong server/ vì nó dùng
 * useRuntimeConfig() để đọc `strapiToken` — nếu copy hàm này sang
 * code chạy ở client, token sẽ bị lộ trong bundle JS.
 * ------------------------------------------------------------------
 */
import qs from "qs";

/**
 * Gọi REST API của Strapi.
 *
 * @param path   Đường dẫn sau `/api`, vd "/header", "/pages/123"
 * @param params Object filter/populate/locale... sẽ được `qs` serialize
 *               thành query string dạng `populate[blocks][populate]=...`
 *               — đúng cú pháp Strapi yêu cầu cho query lồng nhau.
 *
 * Không tự bắt lỗi ở đây — để nơi gọi (route handler) quyết định xử lý
 * lỗi thế nào (xem utils/errors.ts::handleStrapiError), tránh việc
 * hàm dùng chung tự ý nuốt lỗi hoặc trả về giá trị "giả" khi thất bại.
 */
export async function strapiFetch<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { strapiUrl, strapiToken } = useRuntimeConfig();

  const query = qs.stringify(params, { encodeValuesOnly: true });
  const url = `${strapiUrl}/api${path}${query ? `?${query}` : ""}`;

  // $fetch (Nitro/ofetch) tự parse JSON và tự throw khi status không phải 2xx
  // — khác với fetch() gốc vốn im lặng trả response lỗi và cần check `res.ok`
  // thủ công. Nhờ vậy nơi gọi chỉ cần try/catch là đủ.
  //
  // CỐ TÌNH không viết `$fetch<T>(url, ...)`: Nuxt có cơ chế "typed API
  // routes" — khi truyền generic thẳng vào $fetch, TypeScript sẽ tính
  // kiểu trả về thành `TypedInternalResponse<..., T, "get">` (dựa trên
  // chính chuỗi url) thay vì đơn giản là `T`, và vì `T` ở đây là generic
  // tự do (ai gọi strapiFetch<X>() cũng được) nên TS không đảm bảo được
  // 2 kiểu đó luôn khớp nhau -> lỗi "could be instantiated with an
  // arbitrary type". Để $fetch tự suy ra kiểu (url là chuỗi ghép động
  // nên nó không khớp route nào đã biết, tự suy ra kiểu lỏng lẻo), rồi
  // tự ép kiểu bằng `as T` ở bước gán — đây là ranh giới TIN TƯỞNG có
  // chủ đích: ta biết rõ Strapi trả về gì (theo type đã khai báo), chỉ
  // là TypeScript (qua lớp $fetch) không tự chứng minh được điều đó.
  const res = await $fetch(url, {
    headers: { Authorization: `Bearer ${strapiToken}` },
  });

  return res as T;

  // Ghi chú review: dòng `as T` trên KHÔNG có validate runtime — nếu
  // Strapi đổi schema (đổi tên field, xóa field...), lỗi sẽ không lộ ra
  // ở đây mà lộ ra muộn hơn, ở chỗ code cố truy cập field không tồn tại
  // (rất khó trace). Nếu muốn chắc chắn hơn, có thể validate bằng `zod`
  // (parse response qua z.object) trước khi return — đánh đổi là thêm 1
  // dependency + tốn thời gian viết schema. Với dự án nhỏ/MVP, cách hiện
  // tại (tin tưởng type) là chấp nhận được; nên nâng cấp khi dữ liệu
  // Strapi phức tạp/hay đổi.
}
