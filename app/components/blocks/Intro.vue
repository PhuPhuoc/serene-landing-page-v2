<script setup lang="ts">
import { type Intro } from "../../../types";

const props = defineProps<Partial<Intro>>();
</script>

<template>
  <section class="intro">
    <div class="intro-inner">
      <!-- Cột nhãn (3 cột): eyebrow + câu dẫn, hơi lệch xuống so với khối chữ -->
      <div class="intro-aside">
        <p v-if="props.eyebrow" class="intro-eyebrow">{{ props.eyebrow }}</p>
        <p v-if="props.subtitle" class="intro-subtitle">
          {{ props.subtitle }}
        </p>
      </div>

      <!-- Cột nội dung (8 cột): đoạn dẫn lớn + dải tag dưới đường kẻ -->
      <div class="intro-body">
        <p v-if="props.content" class="intro-content">{{ props.content }}</p>

        <div v-if="props.tags?.length" class="intro-tags">
          <span v-for="tag in props.tags" :key="tag.label" class="intro-tag">
            {{ tag.label }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung: lưới 12 cột — cột nhãn 3 cột, cột chữ 8 cột === */
.intro {
  @apply bg-cream pt-24 pb-20 xl:pt-36 xl:pb-32;
}
/* Dưới xl là 1 cột căn giữa (flex, không dùng lưới 12 cột vì 11 rãnh 32px
   không lọt nổi màn hình hẹp); từ xl mới dựng lại lưới 12 cột của design. */
.intro-inner {
  @apply mx-auto flex w-full max-w-content flex-col gap-8 px-6 sm:px-10 xl:grid xl:grid-cols-12 xl:items-start xl:gap-x-8 xl:px-16;
}
.intro-aside {
  @apply flex flex-col gap-3.5 text-center xl:col-span-3 xl:pt-3.5 xl:text-left;
}
/* Khối chữ giới hạn bề ngang để dòng không quá dài khi căn giữa */
.intro-body {
  @apply mx-auto flex w-full max-w-[42rem] flex-col gap-8 text-center xl:col-span-8 xl:col-start-4 xl:mx-0 xl:max-w-none xl:gap-10 xl:text-left;
}

/* === Chữ === */
/* eyebrow: nhãn nhỏ, chữ hoa, giãn rộng, màu accent */
.intro-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-primary-hover;
}
/* câu dẫn: serif mảnh; 24px = 22px trong design drop +2px (ngoài thang token) */
.intro-subtitle {
  @apply font-serif text-lg font-light text-warm-900 sm:text-xl xl:text-[24px];
}
/* đoạn dẫn chính: serif mảnh, nhịp dòng thoáng; dưới xl lùi thang cho khỏi ngộp */
.intro-content {
  @apply font-serif text-2xl font-light leading-[1.38] text-dark sm:text-3xl xl:text-4xl;
}

/* === Dải tag: ngăn với đoạn chữ bằng đường kẻ mảnh ===
   Dưới xl: căn giữa, gap dọc nhỏ nên các tag xuống dòng thành 3 + 2 gọn gàng. */
.intro-tags {
  @apply flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-warm-600 pt-7 xl:justify-start xl:gap-x-7 xl:gap-y-0;
}
.intro-tag {
  @apply text-xs font-medium uppercase tracking-label text-warm-900;
}
</style>
