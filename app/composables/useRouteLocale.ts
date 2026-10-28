import type { ComputedRef } from "vue";

export type ContentLocale = "en" | "vi";

// Locale lấy từ route.path (không lấy từ useI18n().locale) để đổi cùng nhịp
// với slug => auto-key của useFetch chỉ đổi 1 lần khi navigate.
export function useRouteLocale(): ComputedRef<ContentLocale> {
  const route = useRoute();
  const { locales, defaultLocale } = useI18n();

  const localeCodes = computed<string[]>(() =>
    locales.value.map((l) => (typeof l === "string" ? l : l.code)),
  );

  return computed(() => {
    const first = route.path.split("/").find(Boolean);
    return (first && localeCodes.value.includes(first)
      ? first
      : defaultLocale || "en") as ContentLocale;
  });
}
