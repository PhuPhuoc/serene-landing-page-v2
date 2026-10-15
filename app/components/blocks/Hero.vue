<script setup lang="ts">
import { type Hero } from "../../../types";

const props = defineProps<Partial<Hero>>();
const linkProps = useLinkProps();
</script>

<template>
  <section class="hero">
    <!-- Ảnh full-bleed; hero thường là LCP nên ưu tiên tải sớm -->
    <img
      v-if="props.backgroundImage"
      class="hero-media"
      :src="props.backgroundImage.url"
      :alt="props.backgroundImage.alt"
      fetchpriority="high"
    />

    <!-- Lớp phủ: tối dần sang phải để cột chữ bên trái đủ tương phản -->
    <div class="hero-scrim" aria-hidden="true" />

    <!-- Chú thích ảnh: góc dưới phải, ngoài cột nội dung -->
    <p v-if="props.imageCaption" class="hero-caption">
      <span class="hero-caption-rule" aria-hidden="true" />
      {{ props.imageCaption }}
      <span class="hero-caption-rule" aria-hidden="true" />
    </p>

    <div class="hero-inner">
      <p v-if="props.eyebrow" class="hero-eyebrow">{{ props.eyebrow }}</p>
      <h1 v-if="props.headline" class="hero-headline">{{ props.headline }}</h1>
      <p v-if="props.subheadline" class="hero-subheadline">
        {{ props.subheadline }}
      </p>

      <div v-if="props.primaryCta || props.secondaryCta" class="hero-actions">
        <NuxtLink
          v-if="props.primaryCta"
          class="hero-cta hero-cta--primary"
          v-bind="linkProps(props.primaryCta)"
        >
          {{ props.primaryCta.label }}
          <svg
            class="hero-cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </NuxtLink>
        <NuxtLink
          v-if="props.secondaryCta"
          class="hero-cta hero-cta--secondary"
          v-bind="linkProps(props.secondaryCta)"
        >
          {{ props.secondaryCta.label }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung hero: ảnh full-bleed, nội dung dồn xuống đáy khung === */
.hero {
  @apply relative flex min-h-[860px] flex-col overflow-hidden bg-dark text-cream;
}
.hero-media {
  @apply absolute inset-0 h-full w-full object-cover object-[60%_50%];
}
/* Tối dần sang phải (cột chữ) + tối nhẹ ở đáy (chú thích ảnh) */
.hero-scrim {
  @apply pointer-events-none absolute inset-0;
  background-image:
    linear-gradient(
      90deg,
      rgb(34 25 18 / 0.78) 0%,
      rgb(34 25 18 / 0.42) 42%,
      rgb(34 25 18 / 0.05) 75%
    ),
    linear-gradient(0deg, rgb(34 25 18 / 0.55) 0%, rgb(34 25 18 / 0) 38%);
}
.hero-inner {
  @apply relative z-10 mx-auto flex w-full max-w-container flex-1 flex-col justify-end gap-7 px-6 pb-28 sm:px-10 lg:px-28;
}

/* === Nội dung === */
/* eyebrow: nhãn nhỏ, chữ hoa, giãn rộng */
.hero-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-warm-500;
}
/* headline: serif mảnh, cỡ lớn — font-serif của site (Cormorant Garamond) */
.hero-headline {
  @apply max-w-[760px] font-serif text-[clamp(2.875rem,5vw,4.875rem)] font-light leading-[1.04] tracking-[-0.01em] text-cream;
}
.hero-subheadline {
  @apply max-w-[520px] text-xl leading-normal text-warm-400;
}
.hero-actions {
  @apply mt-2 flex flex-wrap items-center gap-8;
}
.hero-cta {
  @apply inline-flex h-12 items-center gap-2.5 text-[17px] font-medium tracking-wide;
}
/* CTA chính: nền kem, chữ nâu, mũi tên trượt nhẹ khi hover */
.hero-cta--primary {
  @apply bg-cream px-[26px] text-dark hover:bg-warm-400 hover:text-dark;
}
.hero-cta-arrow {
  @apply h-4 w-4 transition-transform duration-300;
}
.hero-cta--primary:hover .hero-cta-arrow {
  @apply translate-x-1;
}
/* CTA phụ: chỉ chữ + gạch chân, cùng chiều cao với CTA chính */
.hero-cta--secondary {
  @apply border-b border-current px-1 text-cream hover:text-cream;
}

/* === Chú thích ảnh === */
.hero-caption {
  @apply absolute bottom-10 right-12 z-10 flex items-center gap-3 text-xs uppercase tracking-widest text-warm-600;
}
/* Gạch hai bên chú thích: ẩn ở mobile, chỉ còn text */
.hero-caption-rule {
  @apply hidden h-px w-12 shrink-0 bg-current sm:block;
}
</style>
