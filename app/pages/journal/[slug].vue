<script setup lang="ts">
import PostBody from "~/components/journal/PostBody.vue";
import PostCard from "~/components/journal/PostCard.vue";
import type {
  JournalPageResponse,
  JournalPostResponse,
} from "../../../types";
import type { ContentLocale } from "~/composables/useRouteLocale";

defineI18nRoute({
  paths: { en: "/journal/[slug]", vi: "/tap-chi/[slug]" },
});

const route = useRoute();
const locale = useRouteLocale();
const localePath = useLocalePath();

const slug = computed(() => {
  const raw = route.params.slug;
  return Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "");
});

// Key theo locale + slug để đổi ngôn ngữ / sang bài khác luôn là dữ liệu mới.
const { data, error } = await useAsyncData(
  () => `journal-post-${locale.value}-${slug.value}`,
  async () => {
    const [post, copy] = await Promise.all([
      $fetch<JournalPostResponse>(
        `/api/posts/${encodeURIComponent(slug.value)}`,
        { query: { locale: locale.value } },
      ),
      $fetch<JournalPageResponse>("/api/journal", {
        query: { locale: locale.value },
      }),
    ]);

    return { post: post.post, copy };
  },
);

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: error.value?.statusMessage ?? "Post not found",
    fatal: true,
  });
}

const post = computed(() => data.value!.post);
const copy = computed(() => data.value!.copy);

const date = computed(() => formatPostDate(post.value.publishedDate, locale.value));
const backTo = computed(() => localePath(journalPath(locale.value)));

const UI_COPY: Record<ContentLocale, { back: string; more: string }> = {
  en: {
    back: "All journal entries",
    more: "More from the Journal",
  },
  vi: {
    back: "Tất cả bài viết",
    more: "Bài viết khác",
  },
};

const ui = computed(() => UI_COPY[locale.value]);
const backLabel = computed(() => copy.value.backLinkLabel ?? ui.value.back);

useSeoMeta({
  title: () => post.value.seo?.metaTitle || post.value.title,
  description: () => post.value.seo?.metaDescription ?? undefined,
  ogTitle: () => post.value.seo?.metaTitle || post.value.title,
  ogDescription: () => post.value.seo?.metaDescription ?? undefined,
  ogImage: () =>
    post.value.seo?.ogImage?.url || post.value.cover?.url || undefined,
  ogType: "article",
  robots: () => (post.value.seo?.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <main class="post">
    <article class="post-article">
      <div class="post-head-wrap">
        <NuxtLink :to="backTo" class="post-back">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M11 18l-6-6 6-6" />
          </svg>
          <span>{{ backLabel }}</span>
        </NuxtLink>

        <header class="post-header">
          <p class="post-eyebrow">{{ copy.eyebrow }}</p>
          <h1 class="post-title">{{ post.title }}</h1>

          <div class="post-meta">
            <img
              v-if="post.author?.avatar"
              :src="post.author.avatar.url"
              :alt="post.author.avatar.alt || post.author.name"
              :width="post.author.avatar.width"
              :height="post.author.avatar.height"
              class="post-meta-avatar"
              decoding="async"
            />
            <span v-if="post.author">{{ post.author.name }}</span>
            <span
              v-if="post.author && date"
              class="post-dot"
              aria-hidden="true"
            />
            <time v-if="date" :datetime="post.publishedDate ?? undefined">
              {{ date }}
            </time>
          </div>
        </header>
      </div>

      <figure v-if="post.cover" class="post-cover">
        <img
          :src="post.cover.url"
          :alt="post.cover.alt || post.coverAlt"
          :width="post.cover.width"
          :height="post.cover.height"
          decoding="async"
        />
      </figure>

      <PostBody :blocks="post.blocks" class="post-content" />

      <footer class="post-footer">
        <div v-if="post.author" class="post-author-card">
          <div class="post-author-avatar">
            <img
              v-if="post.author.avatar"
              :src="post.author.avatar.url"
              :alt="post.author.avatar.alt || post.author.name"
              :width="post.author.avatar.width"
              :height="post.author.avatar.height"
              loading="lazy"
              decoding="async"
            />
            <span v-else aria-hidden="true">
              {{ post.author.name.charAt(0) }}
            </span>
          </div>

          <div class="post-author-info">
            <p class="post-author-name">{{ post.author.name }}</p>
            <p v-if="post.author.role" class="post-author-role">
              {{ post.author.role }}
            </p>
            <p v-if="post.author.bio" class="post-author-bio">
              {{ post.author.bio }}
            </p>
          </div>
        </div>

        <section
          v-if="post.relatedPosts.length"
          class="post-related"
          aria-labelledby="post-related-heading"
        >
          <div class="post-related-head">
            <p class="post-eyebrow">{{ copy.eyebrow }}</p>
            <h2 id="post-related-heading" class="post-related-heading">
              {{ ui.more }}
            </h2>
          </div>

          <div class="post-related-grid">
            <PostCard
              v-for="related in post.relatedPosts"
              :key="related.documentId"
              :post="related"
            />
          </div>
        </section>
      </footer>
    </article>
  </main>
</template>

<style scoped>
.post {
  @apply bg-cream text-dark;
}
.post-article {
  @apply pb-24 pt-14 sm:pt-16 lg:pb-32 lg:pt-20;
}
.post-head-wrap {
  @apply mx-auto flex w-full max-w-[760px] flex-col gap-8 px-6 sm:px-10;
}
.post-back {
  @apply inline-flex items-center gap-2 self-start text-xs font-medium tracking-wide text-primary transition-colors hover:text-primary-hover;
}
.post-back svg {
  @apply h-4 w-4;
}
.post-header {
  @apply flex flex-col gap-4;
}
.post-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-muted;
}
.post-title {
  @apply font-serif text-[clamp(2.25rem,5.5vw,3.75rem)] font-light leading-[1.05] tracking-[-0.005em] text-dark;
  text-wrap: pretty;
}
.post-meta {
  @apply flex flex-wrap items-center gap-x-2.5 gap-y-2 pt-1 text-sm text-warm-900;
}
.post-meta-avatar {
  @apply h-6 w-6 shrink-0 rounded-full object-cover;
}
.post-dot {
  @apply h-[3px] w-[3px] shrink-0 bg-muted;
}
.post-cover {
  @apply mx-auto mt-8 w-full max-w-[1120px] px-6 sm:mt-10 sm:px-10 xl:px-16;
}
.post-cover img {
  @apply aspect-[4/3] h-auto w-full bg-warm-300 object-cover sm:aspect-[16/9];
}
.post-content {
  @apply mt-12 sm:mt-14 lg:mt-16;
}
.post-footer {
  @apply mt-16 flex flex-col gap-16 sm:mt-20;
}
.post-author-card {
  @apply mx-auto flex w-full max-w-[680px] flex-col gap-5 border-t border-warm-600 px-6 pt-8 sm:flex-row sm:items-start sm:px-10;
}
.post-author-avatar {
  @apply flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm-300 font-serif text-2xl text-primary;
}
.post-author-avatar img {
  @apply h-full w-full object-cover;
}
.post-author-info {
  @apply flex flex-col gap-1;
}
.post-author-name {
  @apply font-serif text-xl font-normal leading-tight text-dark;
}
.post-author-role {
  @apply text-[11px] font-medium uppercase tracking-label text-muted;
}
.post-author-bio {
  @apply pt-1 text-sm leading-relaxed text-warm-900;
  text-wrap: pretty;
}
.post-related {
  @apply mx-auto w-full max-w-[1120px] px-6 sm:px-10 xl:px-16;
}
.post-related-head {
  @apply flex flex-col gap-2 border-t border-warm-600 pt-8;
}
.post-related-heading {
  @apply font-serif text-3xl font-light leading-[1.1] text-dark;
}
.post-related-grid {
  @apply mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3;
}
</style>
