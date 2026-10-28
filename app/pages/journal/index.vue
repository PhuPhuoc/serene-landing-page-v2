<script setup lang="ts">
import type {
  JournalPageResponse,
  JournalSortOption,
} from "../../../types";
import type { ContentLocale } from "~/composables/useRouteLocale";

defineI18nRoute({
  paths: { en: "/journal", vi: "/tap-chi" },
});

const locale = useRouteLocale();

const { data, error } = await useFetch<JournalPageResponse>("/api/journal", {
  query: { locale },
});

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 500,
    statusMessage: error.value?.statusMessage ?? "Unable to fetch journal",
    fatal: true,
  });
}

const copy = computed(() => data.value!);

const searchTerm = ref("");
const sortOrder = ref<JournalSortOption>(copy.value.sortOptions);

// Strapi chỉ trả enum `sortOptions` (không có label cho từng lựa chọn),
// nên nhãn hiển thị của select nằm ở UI, theo locale.
const SORT_LABELS: Record<
  ContentLocale,
  Record<JournalSortOption, string>
> = {
  en: {
    latest: "Latest first",
    oldest: "Oldest first",
    "a-z label": "A–Z",
  },
  vi: {
    latest: "Mới nhất",
    oldest: "Cũ nhất",
    "a-z label": "A–Z",
  },
};

const sortOptions = computed(() =>
  (Object.keys(SORT_LABELS[locale.value]) as JournalSortOption[]).map(
    (value) => ({
      value,
      label: SORT_LABELS[locale.value][value],
    }),
  ),
);

useSeoMeta({
  title: () => copy.value.heading,
});
</script>

<template>
  <main class="journal">
    <section class="journal-inner" aria-labelledby="journal-heading">
      <div class="journal-head">
        <div class="journal-head-lead">
          <p class="journal-eyebrow">{{ copy.eyebrow }}</p>
          <h1 id="journal-heading" class="journal-heading">
            {{ copy.heading }}
          </h1>
        </div>

        <div class="journal-controls">
          <label class="journal-search">
            <span class="sr-only">{{ copy.searchPlaceholder }}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              v-model="searchTerm"
              type="search"
              :placeholder="copy.searchPlaceholder ?? undefined"
            />
          </label>

          <label class="journal-sort">
            <span class="journal-sort-label">{{ copy.sortLabel }}</span>
            <select v-model="sortOrder">
              <option
                v-for="option in sortOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <!-- Danh sách bài viết chưa có trong CMS; khi có dữ liệu thì phần grid
           + pagination sẽ nối vào đây. Hiện chỉ hiển thị copy empty từ CMS. -->
      <p v-if="copy.emptyStateText" class="journal-empty">
        {{ copy.emptyStateText }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.journal {
  @apply bg-cream text-dark;
}
.journal-inner {
  @apply mx-auto w-full max-w-content px-6 pb-24 pt-16 sm:px-10 sm:pt-20 lg:pb-32 xl:px-16;
}
.journal-head {
  @apply flex flex-col gap-6 border-b border-warm-600 pb-5 lg:flex-row lg:items-end lg:justify-between;
}
.journal-head-lead {
  @apply flex flex-col gap-2;
}
.journal-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-muted;
}
.journal-heading {
  @apply font-serif text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.005em];
}
.journal-controls {
  @apply flex flex-wrap items-center gap-4;
}
.journal-search {
  @apply relative flex h-[42px] w-[320px] max-w-full items-center;
}
.journal-search svg {
  @apply pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-muted;
}
.journal-search input {
  @apply h-full w-full border border-warm-600 bg-warm-50 pr-3.5 pl-[42px] text-sm text-dark outline-none focus:border-primary;
}
.journal-sort {
  @apply flex items-center gap-3;
}
.journal-sort-label {
  @apply text-[11px] font-medium uppercase tracking-label text-muted;
}
.journal-sort select {
  @apply h-[42px] border border-warm-600 bg-warm-50 px-3 text-sm text-dark outline-none focus:border-primary;
}
.journal-empty {
  @apply py-12 text-[17px] text-warm-900;
}
</style>
