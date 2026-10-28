import type { ContentLocale } from "~/composables/useRouteLocale";

// Đường dẫn tới Journal theo locale: EN /journal, VI /tap-chi.
// `localePath(...)` bên ngoài sẽ thêm prefix ngôn ngữ.
export function journalPath(
  locale: ContentLocale,
  slug?: string | null,
): string {
  const base = locale === "vi" ? "/tap-chi" : "/journal";

  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
}
