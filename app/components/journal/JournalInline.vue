<script setup lang="ts">
import type {
  JournalInlineMark,
  JournalInlineNode,
  JournalTextNode,
} from "../../../types";

defineOptions({ name: "JournalInline" });

defineProps<{ nodes: JournalInlineNode[] }>();

const localePath = useLocalePath();

const isInternal = (url: string) => url.startsWith("/");
const opensNewTab = (url: string) => /^https?:\/\//i.test(url);

const MARK_CLASSES: Record<JournalInlineMark, string> = {
  bold: "font-semibold",
  italic: "italic",
  underline: "underline underline-offset-2",
  strikethrough: "line-through",
  code: "rounded-sm bg-warm-300/70 px-[0.25em] py-[0.1em] font-mono text-[0.9em]",
};

function markClasses(node: JournalTextNode): string {
  return node.marks.map((mark) => MARK_CLASSES[mark]).join(" ");
}
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <NuxtLink
      v-if="node.type === 'link' && isInternal(node.url)"
      :to="localePath(node.url)"
      class="journal-link"
    >
      <JournalInline :nodes="node.children" />
    </NuxtLink>

    <a
      v-else-if="node.type === 'link'"
      :href="node.url"
      :target="opensNewTab(node.url) ? '_blank' : undefined"
      :rel="opensNewTab(node.url) ? 'noopener noreferrer' : undefined"
      class="journal-link"
    >
      <JournalInline :nodes="node.children" />
    </a>

    <span
      v-else
      class="whitespace-pre-line"
      :class="markClasses(node)"
    >{{ node.text }}</span>
  </template>
</template>

<style scoped>
.journal-link {
  @apply text-primary underline decoration-primary/40 decoration-1 underline-offset-[3px] transition-colors hover:text-primary-hover hover:decoration-primary-hover;
}
</style>
