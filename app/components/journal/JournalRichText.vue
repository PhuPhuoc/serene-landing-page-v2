<script setup lang="ts">
import JournalInline from "~/components/journal/JournalInline.vue";
import type { JournalRichTextNode } from "../../../types";

const props = withDefaults(
  defineProps<{
    nodes?: JournalRichTextNode[];
    fontSize?: number | null;
    // Đoạn đầu của bài được set như lede (serif, lớn hơn) cho nhịp editorial.
    lede?: boolean;
  }>(),
  {
    nodes: () => [],
    fontSize: null,
    lede: false,
  },
);

const ledeIndex = computed(() =>
  props.lede ? props.nodes.findIndex((node) => node.type === "paragraph") : -1,
);
</script>

<template>
  <div
    class="journal-richtext"
    :style="fontSize ? { fontSize: `${fontSize}px` } : undefined"
  >
    <template v-for="(node, index) in nodes" :key="index">
      <h2
        v-if="node.type === 'heading' && node.level === 2"
        class="journal-richtext-h2"
      >
        <JournalInline :nodes="node.children" />
      </h2>

      <h3
        v-else-if="node.type === 'heading' && node.level === 3"
        class="journal-richtext-h3"
      >
        <JournalInline :nodes="node.children" />
      </h3>

      <h4 v-else-if="node.type === 'heading'" class="journal-richtext-h4">
        <JournalInline :nodes="node.children" />
      </h4>

      <p
        v-else-if="node.type === 'paragraph'"
        :class="{ 'journal-richtext-lede': index === ledeIndex }"
      >
        <JournalInline :nodes="node.children" />
      </p>

      <ul
        v-else-if="node.type === 'list' && node.format === 'unordered'"
        class="journal-richtext-list"
      >
        <li v-for="(item, itemIndex) in node.items" :key="itemIndex">
          <JournalInline :nodes="item.children" />
        </li>
      </ul>

      <ol v-else-if="node.type === 'list'" class="journal-richtext-list">
        <li v-for="(item, itemIndex) in node.items" :key="itemIndex">
          <JournalInline :nodes="item.children" />
        </li>
      </ol>

      <blockquote v-else-if="node.type === 'quote'">
        <JournalInline :nodes="node.children" />
      </blockquote>

      <pre v-else-if="node.type === 'code'"><code>{{ node.text }}</code></pre>

      <figure v-else-if="node.type === 'image'" class="journal-richtext-image">
        <img
          :src="node.image.url"
          :alt="node.image.alt"
          :width="node.image.width"
          :height="node.image.height"
          loading="lazy"
          decoding="async"
        />
        <figcaption v-if="node.caption">{{ node.caption }}</figcaption>
      </figure>
    </template>
  </div>
</template>

<style scoped>
.journal-richtext {
  @apply flex flex-col gap-6 text-base leading-[1.75] text-warm-900;
}
.journal-richtext-h2 {
  @apply font-serif text-3xl font-light leading-[1.15] tracking-[-0.005em] text-dark sm:text-4xl;
}
.journal-richtext-h3 {
  @apply pt-2 font-serif text-2xl font-light leading-[1.2] text-dark;
}
.journal-richtext-h4 {
  @apply pt-2 text-base font-semibold leading-snug text-dark;
}
.journal-richtext-lede {
  @apply font-serif text-[22px] font-light leading-[1.5] text-dark sm:text-[26px];
  text-wrap: pretty;
}
.journal-richtext p {
  text-wrap: pretty;
}
.journal-richtext-list {
  @apply space-y-2 pl-5;
}
.journal-richtext ul.journal-richtext-list {
  @apply list-disc;
}
.journal-richtext ol.journal-richtext-list {
  @apply list-decimal;
}
.journal-richtext-list li::marker {
  @apply text-primary;
}
.journal-richtext blockquote {
  @apply border-l border-primary/40 pl-5 font-serif text-xl font-light italic leading-[1.5] text-dark sm:pl-6;
  text-wrap: pretty;
}
.journal-richtext pre {
  @apply overflow-x-auto border border-warm-600 bg-warm-100 p-4 text-sm leading-relaxed text-dark;
}
.journal-richtext code {
  @apply font-mono;
}
.journal-richtext-image {
  @apply flex flex-col gap-3;
}
.journal-richtext-image img {
  @apply h-auto w-full bg-warm-300;
}
.journal-richtext-image figcaption {
  @apply text-center text-xs leading-relaxed text-warm-900;
}
</style>
