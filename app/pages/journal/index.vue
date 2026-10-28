<script setup lang="ts">
import PostCard from "~/components/journal/PostCard.vue";
import type {
  JournalPageResponse,
  JournalPostsResponse,
  JournalSortOption,
} from "../../../types";
import type { ContentLocale } from "~/composables/useRouteLocale";

defineI18nRoute({
  paths: { en: "/journal", vi: "/tap-chi" },
});

const locale = useRouteLocale();

// Gộp copy + posts vào một lần fetch để cả trang fail/succeed cùng nhau; key
// theo locale để chuyển ngôn ngữ trên client luôn lấy đúng bản dịch, không
// dính cache của locale cũ.
const { data, error } = await useAsyncData(
  () => `journal-index-${locale.value}`,
  async () => {
    const [copy, posts] = await Promise.all([
      $fetch<JournalPageResponse>("/api/journal", {
        query: { locale: locale.value },
      }),
      $fetch<JournalPostsResponse>("/api/posts", {
        query: { locale: locale.value },
      }),
    ]);

    return { copy, posts: posts.posts };
  },
);

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 500,
    statusMessage: error.value?.statusMessage ?? "Unable to fetch journal",
    fatal: true,
  });
}

const copy = computed(() => data.value!.copy);

const searchTerm = ref("");
const sortOrder = ref<JournalSortOption>(copy.value.sortOptions);

type JournalUiCopy = {
  empty: string;
  emptyAll: string;
  clear: string;
  loadMore: string;
  count: (total: number) => string;
};

// Nhãn UI (không có trong CMS), theo locale — cùng cách với SORT_LABELS.
const UI_COPY: Record<ContentLocale, JournalUiCopy> = {
  en: {
    empty: "No journal entries match your search.",
    emptyAll: "The journal is being written. Please check back soon.",
    clear: "Clear search",
    loadMore: "Load more",
    count: (total) => `${total} ${total === 1 ? "entry" : "entries"}`,
  },
  vi: {
    empty: "Không tìm thấy bài viết phù hợp.",
    emptyAll: "Tạp chí đang được viết. Hãy quay lại sau nhé.",
    clear: "Xoá tìm kiếm",
    loadMore: "Xem thêm",
    count: (total) => `${total} bài viết`,
  },
};

const SORT_LABELS: Record<ContentLocale, Record<JournalSortOption, string>> = {
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

const ui = computed(() => UI_COPY[locale.value]);

// Tab/meta title của trang danh sách luôn là tên mục, không dùng heading CMS;
// chỉ trang chi tiết mới lấy title của bài post.
const pageTitle = computed(() =>
  locale.value === "vi" ? "Tạp chí" : "Journal",
);

const sortOptions = computed(() =>
  (Object.keys(SORT_LABELS[locale.value]) as JournalSortOption[]).map(
    (value) => ({ value, label: SORT_LABELS[locale.value][value] }),
  ),
);

// Bỏ dấu tiếng Việt để gõ "tran phu phuoc" vẫn tìm ra "Trần Phủ Phước".
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");

const posts = computed(() => {
  const query = normalize(searchTerm.value.trim());

  return data
    .value!.posts.filter((post) => {
      if (!query) return true;

      return (
        normalize(post.title).includes(query) ||
        normalize(post.author?.name ?? "").includes(query)
      );
    })
    .sort((a, b) => {
      if (sortOrder.value === "a-z label") {
        return a.title.localeCompare(b.title, locale.value);
      }

      const byDate = (a.publishedDate ?? "").localeCompare(
        b.publishedDate ?? "",
      );
      return sortOrder.value === "latest" ? -byDate : byDate;
    });
});

const hasSearch = computed(() => !!searchTerm.value.trim());

const PAGE_SIZE = 6;
const visibleCount = ref(PAGE_SIZE);
const loadMoreTarget = ref<HTMLElement | null>(null);
let loadMoreObserver: IntersectionObserver | null = null;

// CMS trả toàn bộ posts; chỉ cắt dần ở client để không render hàng trăm card
// cùng lúc. Search/sort vẫn chạy trên toàn bộ danh sách trước khi cắt.
const visiblePosts = computed(() => posts.value.slice(0, visibleCount.value));
const hasMore = computed(() => visibleCount.value < posts.value.length);

function loadMore() {
  if (!hasMore.value) return;

  visibleCount.value = Math.min(
    visibleCount.value + PAGE_SIZE,
    posts.value.length,
  );

  // Màn hình cao có thể vẫn thấy sentinel sau khi render; load tiếp để trang
  // luôn có nội dung cuộn tới, không phải bấm nút nhiều lần.
  nextTick(() => {
    const el = loadMoreTarget.value;
    if (!el || !hasMore.value) return;
    if (el.getBoundingClientRect().top <= window.innerHeight + 320) {
      loadMore();
    }
  });
}

function observeLoadMore(el: HTMLElement | null) {
  loadMoreObserver?.disconnect();
  loadMoreObserver = null;

  if (!el || typeof IntersectionObserver === "undefined") return;

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore();
    },
    { rootMargin: "320px 0px" },
  );
  loadMoreObserver.observe(el);
}

watch(loadMoreTarget, observeLoadMore, { flush: "post" });
onBeforeUnmount(() => loadMoreObserver?.disconnect());

// Đổi từ khoá / kiểu sort / locale thì quay về lô đầu tiên.
watch([searchTerm, sortOrder, locale], () => {
  visibleCount.value = PAGE_SIZE;
});

const countLabel = computed(() => ui.value.count(posts.value.length));

const emptyMessage = computed(() =>
  copy.value.emptyStateText
    ? copy.value.emptyStateText
    : hasSearch.value
      ? ui.value.empty
      : ui.value.emptyAll,
);

function clearSearch() {
  searchTerm.value = "";
}

useSeoMeta({
  title: () => pageTitle.value,
  ogTitle: () => copy.value.heading,
});
</script>

<template>
  <main class="journal">
    <section class="journal-inner" aria-labelledby="journal-heading">
      <header class="journal-head">
        <div class="journal-head-lead">
          <p class="journal-eyebrow">{{ copy.eyebrow }}</p>
          <h1 id="journal-heading" class="journal-heading">
            {{ copy.heading }}
          </h1>
        </div>

        <div class="journal-controls">
          <label class="journal-search">
            <span class="sr-only">
              {{ copy.searchPlaceholder ?? "Search the journal" }}
            </span>
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
              :aria-label="copy.searchPlaceholder ?? 'Search the journal'"
            />
          </label>

          <select
            v-model="sortOrder"
            class="journal-select"
            :aria-label="copy.sortLabel ?? 'Sort'"
          >
            <option
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </header>

      <div class="journal-resultbar">
        <p class="journal-count">{{ countLabel }}</p>
        <button
          v-if="hasSearch"
          type="button"
          class="journal-clear"
          @click="clearSearch"
        >
          {{ ui.clear }}
        </button>
      </div>

      <template v-if="posts.length">
        <div id="journal-grid" class="journal-grid">
          <PostCard
            v-for="post in visiblePosts"
            :key="post.documentId"
            :post="post"
            heading-level="h2"
          />
        </div>

        <div v-if="hasMore" ref="loadMoreTarget" class="journal-more">
          <button
            type="button"
            class="journal-load-more"
            aria-controls="journal-grid"
            @click="loadMore"
          >
            {{ ui.loadMore }}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </template>

      <div v-else class="journal-empty">
        <p>{{ emptyMessage }}</p>
        <button
          v-if="hasSearch"
          type="button"
          class="journal-clear"
          @click="clearSearch"
        >
          {{ ui.clear }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.journal {
  @apply bg-cream text-dark;
}
.journal-inner {
  @apply mx-auto w-full max-w-content px-6 pb-24 pt-10 sm:px-10 sm:pt-14 lg:pb-32 lg:pt-10 xl:px-12;
}
.journal-head {
  @apply flex flex-col gap-8 border-b border-warm-600 pb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12;
}
.journal-head-lead {
  @apply flex max-w-[640px] flex-col gap-3;
}
.journal-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-muted;
}
.journal-heading {
  @apply font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.005em] text-dark;
  text-wrap: balance;
}
.journal-controls {
  @apply flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-nowrap lg:justify-end;
}
.journal-search {
  @apply relative flex h-[46px] w-full items-center sm:w-[280px] lg:w-[320px];
}
.journal-search svg {
  @apply pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-muted;
}
.journal-search input {
  @apply h-full w-full border border-warm-600 bg-warm-50 pl-[42px] pr-3.5 text-sm text-dark outline-none transition-colors placeholder:text-muted focus:border-primary;
}
.journal-select {
  @apply h-[46px] w-full min-w-0 border border-warm-600 bg-warm-50 px-3 text-sm text-dark outline-none transition-colors focus:border-primary sm:w-[170px];
}
.journal-resultbar {
  @apply mt-5 flex min-h-6 items-center justify-between gap-4;
}
.journal-count {
  @apply text-[11px] font-medium uppercase tracking-label text-muted;
}
.journal-clear {
  @apply text-xs font-medium text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline;
}
.journal-grid {
  @apply mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-y-16;
}
.journal-more {
  @apply mt-12 flex justify-center lg:mt-16;
}
.journal-load-more {
  @apply inline-flex items-center gap-2 border border-warm-600 bg-warm-50 px-6 py-3 text-xs font-medium uppercase tracking-label text-primary transition-colors hover:border-primary hover:bg-primary hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary;
}
.journal-load-more svg {
  @apply h-4 w-4 transition-transform duration-200;
}
.journal-load-more:hover svg {
  @apply translate-y-0.5;
}
.journal-empty {
  @apply flex flex-col items-start gap-4 py-16 text-base text-warm-900;
}
</style>
