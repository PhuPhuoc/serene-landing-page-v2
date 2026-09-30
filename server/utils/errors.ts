/**
 * server/utils/errors.ts
 * ------------------------------------------------------------------
 * Trước đây navigation.get.ts KHÔNG có try/catch, còn [slug].get.ts
 * CÓ — nghĩa là khi Strapi lỗi, 2 endpoint trả về response khác nhau
 * (một cái do Nitro tự tạo lỗi 500 mặc định, một cái có statusMessage
 * rõ ràng). Với người dùng API (frontend, hoặc bên thứ 3), đây là
 * hành vi không nhất quán và khó xử lý.
 *
 * `handleStrapiError` chuẩn hóa: luôn log chi tiết lỗi thật ở server
 * (để debug), nhưng chỉ trả về client một message chung chung — vừa
 * nhất quán, vừa không rò rỉ chi tiết hạ tầng (vd "Strapi fetch failed"
 * tiết lộ rằng backend đang dùng Strapi).
 * ------------------------------------------------------------------
 */

type FetchError = {
  statusCode?: number;
  data?: unknown;
  message?: string;
};

/**
 * Luôn `throw` (kiểu trả về `never` để TypeScript biết hàm này không
 * bao giờ return bình thường — gọi xong là dừng luôn, khỏi cần `return`
 * hay `else` sau đó ở nơi gọi).
 */
export function handleStrapiError(err: unknown, context: string): never {
  const e = err as FetchError;

  // Log đầy đủ chi tiết — CHỈ hiện trong log server, không gửi cho client.
  console.error(`[Strapi] ${context}:`, e?.data ?? e?.message ?? err);

  throw createError({
    // Giữ nguyên statusCode gốc nếu Strapi trả về (vd 404, 400),
    // chỉ fallback 500 khi thật sự không xác định được.
    statusCode: e?.statusCode ?? 500,
    statusMessage: "Unable to fetch content",
  });
}
