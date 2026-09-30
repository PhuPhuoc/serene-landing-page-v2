/**
 * server/utils/locale.ts
 * ------------------------------------------------------------------
 * Trước đây logic "locale === 'vi' ? 'vi' : 'en'" bị lặp lại y hệt
 * ở navigation.get.ts và [slug].get.ts. Nếu sau này thêm ngôn ngữ
 * thứ 3 (vd "fr"), phải nhớ sửa ở TẤT CẢ các chỗ đó — dễ sót.
 *
 * Gom về 1 nguồn sự thật (SUPPORTED_LOCALES) + 1 hàm resolveLocale()
 * dùng chung, để chỉ cần sửa 1 nơi khi thêm/bớt ngôn ngữ.
 * ------------------------------------------------------------------
 */
import type { H3Event } from "h3";

export const SUPPORTED_LOCALES = ["en", "vi"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

function isSupportedLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * Đọc query `?locale=` từ request, whitelist theo SUPPORTED_LOCALES,
 * fallback về DEFAULT_LOCALE nếu thiếu hoặc không hợp lệ.
 *
 * Nhận `event` (thay vì nhận sẵn giá trị query) để mỗi endpoint chỉ
 * cần gọi `resolveLocale(event)` — không phải tự viết lại getQuery + ternary.
 */
export function resolveLocale(event: H3Event): Locale {
  const raw = getQuery(event).locale;
  return isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** Các locale còn lại ngoài locale hiện tại — dùng cho language switcher. */
export function otherLocales(current: Locale): Locale[] {
  return SUPPORTED_LOCALES.filter((l) => l !== current);
}
