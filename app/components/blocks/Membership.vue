<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import { type Membership } from "../../../types";

const props = defineProps<Partial<Membership>>();

// Nền "default" của block này là panel nâu (design) nên mặc định là tone tối
const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background, { defaultOnDark: true });

const features = computed(() => props.features ?? []);
</script>

<template>
  <section
    class="membership"
    :class="onDark ? 'membership--dark' : 'membership--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="left" />

    <div class="membership-inner">
      <!-- Cột chữ (6 cột): eyebrow → heading → đoạn dẫn → 2 CTA -->
      <div class="membership-lead">
        <p v-if="props.eyebrow" class="membership-eyebrow">
          {{ props.eyebrow }}
        </p>
        <h2 v-if="props.heading" class="membership-heading">
          {{ props.heading }}
        </h2>
        <p v-if="props.description" class="membership-text">
          {{ props.description }}
        </p>

        <div
          v-if="props.primaryCta?.label || props.secondaryCta?.label"
          class="membership-actions"
        >
          <CtaLink
            :link="props.primaryCta"
            :tone="onDark ? 'dark' : 'light'"
          />
          <CtaLink
            :link="props.secondaryCta"
            :tone="onDark ? 'dark' : 'light'"
          />
        </div>
      </div>

      <!-- Cột đặc quyền (5 cột, bắt đầu từ cột 8): 2 cột trên mobile, mỗi mục
           có gạch đầu + tiêu đề serif + mô tả ngắn -->
      <ul v-if="features.length" class="membership-features">
        <li v-for="f in features" :key="f.id" class="membership-feature">
          <p class="membership-feature-title">{{ f.title }}</p>
          <p v-if="f.description" class="membership-feature-text">
            {{ f.description }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
/* === Khung: 1 cột trên mobile; từ lg dựng lại lưới 12 cột của design drop
   (chữ 6 cột, đặc quyền 5 cột bắt đầu từ cột 8) === */
.membership {
  @apply relative overflow-hidden py-20 sm:py-24 xl:py-32;
}
/* Nền mặc định = panel nâu của design; nền màu do CMS cấp qua :style */
.membership--light {
  @apply bg-cream text-dark;
}
/* Nền tối: màu đậm (CMS) hoặc ảnh — bg-primary là lúc ảnh chưa tải xong */
.membership--dark {
  @apply bg-primary text-cream;
}
.membership-inner {
  @apply relative z-10 mx-auto grid w-full max-w-content grid-cols-1 gap-y-12 px-6 sm:px-10 lg:grid-cols-12 lg:items-start lg:gap-x-8 xl:px-16;
}
.membership-lead {
  @apply flex flex-col gap-[26px] lg:col-span-6 lg:col-start-1;
}

/* === Chữ === */
/* eyebrow: nhãn nhỏ, chữ hoa, giãn rộng */
.membership-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* heading: serif mảnh; 52px = 52px trong design drop (ngoài thang token),
   dùng clamp như Hero/Section để không mất leading khi lên breakpoint */
.membership-heading {
  @apply font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-light leading-[1.12] tracking-[-0.005em];
}
.membership-text {
  @apply max-w-[520px] text-base leading-[1.6];
}
.membership-actions {
  @apply mt-2 flex flex-wrap items-center gap-x-7 gap-y-4;
}

/* === Đặc quyền: gạch đầu mỗi mục, 2 cột từ sm === */
.membership-features {
  @apply grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 lg:col-span-5 lg:col-start-8;
}
.membership-feature {
  @apply flex flex-col gap-2.5 border-t pt-[22px];
}
/* Tiêu đề serif 22px = 21px trong design (+2px như mọi bậc token) */
.membership-feature-title {
  @apply font-serif text-xl font-normal;
}
.membership-feature-text {
  @apply text-[15px] leading-[1.55];
}

/* === Màu theo tone nền === */
.membership--light .membership-eyebrow {
  @apply text-primary-hover;
}
.membership--light .membership-heading {
  @apply text-dark;
}
.membership--light .membership-text {
  @apply text-warm-900;
}
.membership--light .membership-feature {
  @apply border-warm-600;
}
.membership--light .membership-feature-title {
  @apply text-dark;
}
.membership--light .membership-feature-text {
  @apply text-warm-900;
}
.membership--dark .membership-eyebrow {
  @apply text-warm-500;
}
.membership--dark .membership-heading {
  @apply text-cream;
}
.membership--dark .membership-text {
  @apply text-warm-400;
}
.membership--dark .membership-feature {
  @apply border-cream/35;
}
.membership--dark .membership-feature-title {
  @apply text-cream;
}
.membership--dark .membership-feature-text {
  @apply text-warm-400;
}

</style>
