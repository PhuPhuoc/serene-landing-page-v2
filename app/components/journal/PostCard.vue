<script setup lang="ts">
import type { JournalPostSummary } from "../../../types";

const props = withDefaults(
  defineProps<{
    post: JournalPostSummary;
    // List page dùng h2 (dưới h1 của trang); related posts dùng h3 (dưới h2
    // của section "More from the Journal").
    headingLevel?: "h2" | "h3";
  }>(),
  { headingLevel: "h3" },
);

const locale = useRouteLocale();
const localePath = useLocalePath();

const date = computed(() => formatPostDate(props.post.publishedDate, locale.value));
const titleId = computed(() => `post-card-${props.post.documentId}`);
</script>

<template>
  <article class="post-card">
    <NuxtLink
      :to="localePath(journalPath(locale, post.slug))"
      class="post-card-link group"
      :aria-labelledby="titleId"
    >
      <div class="post-card-media">
        <img
          v-if="post.cover"
          :src="post.cover.url"
          :alt="post.cover.alt || post.coverAlt"
          :width="post.cover.width"
          :height="post.cover.height"
          class="post-card-img"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="post-card-placeholder" aria-hidden="true" />
      </div>

      <div class="post-card-body">
        <component :is="headingLevel" :id="titleId" class="post-card-title">
          {{ post.title }}
        </component>

        <p class="post-card-meta">
          <span v-if="post.author">{{ post.author.name }}</span>
          <span
            v-if="post.author && date"
            class="post-card-dot"
            aria-hidden="true"
          />
          <time v-if="date" :datetime="post.publishedDate ?? undefined">
            {{ date }}
          </time>
        </p>
      </div>
    </NuxtLink>
  </article>
</template>

<style scoped>
.post-card-link {
  @apply flex flex-col gap-5;
}
.post-card-media {
  @apply relative aspect-[4/3] overflow-hidden bg-warm-300;
}
.post-card-img {
  @apply h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03];
}
.post-card-placeholder {
  @apply h-full w-full;
  background-image: repeating-linear-gradient(
    135deg,
    #e3d3ba 0,
    #e3d3ba 14px,
    #f4e1da 14px,
    #f4e1da 15px
  );
}
.post-card-body {
  @apply flex flex-col gap-2.5;
}
.post-card-title {
  @apply font-serif text-xl font-normal leading-[1.3] text-dark transition-colors duration-300 group-hover:text-primary-hover;
  text-wrap: pretty;
}
.post-card-meta {
  @apply flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs leading-relaxed text-warm-900;
}
.post-card-dot {
  @apply h-[3px] w-[3px] shrink-0 bg-muted;
}
</style>
