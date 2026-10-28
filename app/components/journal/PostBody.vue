<script setup lang="ts">
import JournalGallery from "~/components/journal/JournalGallery.vue";
import JournalRichText from "~/components/journal/JournalRichText.vue";
import type { JournalBlock } from "../../../types";

defineProps<{ blocks: JournalBlock[] }>();
</script>

<template>
  <div class="post-body">
    <template v-for="(block, index) in blocks" :key="`${block.type}-${block.id}`">
      <!-- Rich text: cột đọc 680px; block đầu tiên mở bằng lede serif -->
      <div
        v-if="block.type === 'rich-text'"
        class="post-block post-block--text"
      >
        <JournalRichText
          :nodes="block.nodes"
          :font-size="block.fontSize"
          :lede="index === 0"
        />
      </div>

      <!-- Ảnh đơn -->
      <figure
        v-else-if="block.type === 'image'"
        class="post-block post-block--wide post-figure"
      >
        <img
          :src="block.image.url"
          :alt="block.image.alt"
          :width="block.image.width"
          :height="block.image.height"
          loading="lazy"
          decoding="async"
        />
        <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
      </figure>

      <!-- Gallery: carousel dùng Gallery; masonry 2/3 cột -->
      <div v-else-if="block.type === 'gallery'" class="post-block post-block--wide">
        <JournalGallery
          :images="block.images"
          :layout="block.layout"
          :caption="block.caption"
        />
      </div>

      <!-- Video: file nội bộ hoặc nhúng YouTube/Vimeo -->
      <figure
        v-else-if="block.type === 'video'"
        class="post-block post-block--wide post-figure"
      >
        <div class="post-video">
          <iframe
            v-if="block.externalUrl && toEmbedUrl(block.externalUrl)"
            :src="toEmbedUrl(block.externalUrl) ?? undefined"
            :title="block.caption ?? 'Video'"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
          <video
            v-else-if="block.src"
            :src="block.src"
            controls
            playsinline
            preload="metadata"
          />
        </div>
        <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
      </figure>

      <!-- Hai cột: mobile luôn xếp ảnh trước, chữ sau -->
      <div
        v-else-if="block.type === 'two-column'"
        class="post-block post-block--two-col post-two-col"
      >
        <figure
          class="post-two-col-media order-1"
          :class="block.imagePosition === 'left' ? 'lg:order-1' : 'lg:order-2'"
        >
          <img
            :src="block.image.url"
            :alt="block.image.alt"
            :width="block.image.width"
            :height="block.image.height"
            loading="lazy"
            decoding="async"
          />
        </figure>

        <div
          class="post-two-col-text order-2"
          :class="block.imagePosition === 'left' ? 'lg:order-2' : 'lg:order-1'"
        >
          <JournalRichText :nodes="block.nodes" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post-body {
  @apply mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-6 sm:px-10 lg:gap-14 xl:px-16;
}
.post-block--text {
  @apply mx-auto w-full max-w-[680px];
}
.post-block--wide {
  @apply w-full;
}
.post-block--two-col {
  @apply mx-auto w-full max-w-[1000px];
}
.post-figure {
  @apply flex flex-col gap-3;
}
.post-figure > img {
  @apply h-auto w-full bg-warm-300;
}
.post-figure figcaption {
  @apply text-center text-xs leading-relaxed text-warm-900;
}
.post-video {
  @apply aspect-video w-full overflow-hidden bg-dark;
}
.post-video iframe,
.post-video video {
  @apply h-full w-full border-0;
}
.post-video video {
  @apply object-contain;
}
.post-two-col {
  @apply grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12;
}
.post-two-col-media {
  @apply overflow-hidden bg-warm-300;
}
.post-two-col-media img {
  @apply h-auto w-full;
}
</style>
