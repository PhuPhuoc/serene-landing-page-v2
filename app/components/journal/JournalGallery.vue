<script setup lang="ts">
import type { JournalGalleryLayout, Media } from "../../../types";

const props = withDefaults(
  defineProps<{
    images: Media[];
    layout?: JournalGalleryLayout;
    caption?: string | null;
  }>(),
  {
    layout: "carousel",
    caption: null,
  },
);

const locale = useRouteLocale();

const masonryClass = computed(() =>
  props.layout === "masonry-3"
    ? "columns-1 gap-3 sm:columns-2 lg:columns-3"
    : "columns-1 gap-3 sm:columns-2",
);

const openLabel = computed(() =>
  locale.value === "vi" ? "Mở ảnh gốc" : "Open full-size photo",
);
</script>

<template>
  <div class="journal-gallery">
    <!-- Carousel: dùng lại Gallery (ảnh lớn + thumbnail + slideshow toàn màn
         hình). Tắt autoplay vì đây là nội dung đọc, không phải banner. -->
    <Gallery
      v-if="layout === 'carousel'"
      :images="images"
      :label="caption ?? ''"
      :autoplay="false"
    />

    <!-- Masonry 2/3 cột: mobile luôn 1 cột để không vỡ layout -->
    <div v-else class="journal-gallery-masonry" :class="masonryClass">
      <a
        v-for="(image, index) in images"
        :key="`${image.url}-${index}`"
        :href="image.url"
        target="_blank"
        rel="noopener noreferrer"
        class="journal-gallery-item"
        :aria-label="image.alt || openLabel"
      >
        <img
          :src="image.url"
          :alt="image.alt"
          :width="image.width"
          :height="image.height"
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>

    <p v-if="caption" class="journal-gallery-caption">{{ caption }}</p>
  </div>
</template>

<style scoped>
.journal-gallery {
  @apply flex flex-col gap-3;
}
.journal-gallery-masonry {
  @apply [column-fill:balance];
}
.journal-gallery-item {
  @apply mb-3 block break-inside-avoid overflow-hidden bg-warm-300;
}
.journal-gallery-item img {
  @apply h-auto w-full transition-transform duration-700 ease-out hover:scale-[1.02];
}
.journal-gallery-caption {
  @apply text-center text-xs leading-relaxed text-warm-900;
}
</style>
