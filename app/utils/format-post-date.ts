import type { ContentLocale } from "~/composables/useRouteLocale";

const DATE_LOCALES: Record<ContentLocale, string> = {
  en: "en-GB",
  vi: "vi-VN",
};

// `publishedDate` của Strapi là date-only ("2026-10-28"). Parse ở UTC rồi
// format ở UTC để server/client không lệch nhau một ngày theo timezone.
export function formatPostDate(
  value: string | null | undefined,
  locale: ContentLocale,
): string {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
