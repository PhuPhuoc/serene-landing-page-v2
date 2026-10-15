<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import { type PricingTier, type Tier } from "../../../types";

const props = defineProps<Partial<Tier>>();
const linkProps = useLinkProps();
const { locale } = useI18n();

const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background);

const tiers = computed(() => props.tiers ?? []);

// "From"/"Từ" là copy cố định của design, CMS chưa có field riêng
const fromLabel = computed(() => (locale.value === "vi" ? "Từ" : "From"));

// price là biginteger (Strapi trả string) nên format theo ngôn ngữ đang xem:
// 80,000,000 ₫ (en) / 80.000.000 ₫ (vi). Giá trị lạ thì trả nguyên bản.
const formatPrice = (t: PricingTier) => {
  const raw = (t.price ?? "").trim();
  const value = raw ? Number(raw) : Number.NaN;
  const price = Number.isFinite(value)
    ? new Intl.NumberFormat(locale.value === "vi" ? "vi-VN" : "en-US").format(
        value,
      )
    : raw;

  return t.priceLabel ? `${price} ${t.priceLabel}` : price;
};
</script>

<template>
  <section
    class="tier"
    :class="onDark ? 'tier--dark' : 'tier--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="left" />

    <div class="tier-inner">
      <!-- Đầu mục: eyebrow + heading bên trái, ghi chú phí bên phải (từ lg) -->
      <div class="tier-head">
        <div class="tier-head-lead">
          <p v-if="props.eyebrow" class="tier-eyebrow">{{ props.eyebrow }}</p>
          <h2 v-if="props.heading" class="tier-heading">
            {{ props.heading }}
          </h2>
        </div>
        <p v-if="props.note" class="tier-note">{{ props.note }}</p>
      </div>

      <!-- Bảng hạng: 1 cột trên mobile → 2 cột từ sm → 4 cột từ lg; khe 2px
           lộ nền warm-600 thành các đường kẻ dọc giữa các thẻ (như design) -->
      <ul v-if="tiers.length" class="tier-grid">
        <li v-for="t in tiers" :key="t.id" class="tier-card fade">
          <p class="tier-name">{{ t.name }}</p>
          <div class="tier-price-block">
            <span class="tier-from">{{ fromLabel }}</span>
            <span class="tier-price">{{ formatPrice(t) }}</span>
            <span v-if="t.period" class="tier-period">{{ t.period }}</span>
          </div>
          <p v-if="t.description" class="tier-text">{{ t.description }}</p>
        </li>
      </ul>

      <!-- CTA: nút đặc + nút viền, cao 52px như design -->
      <div
        v-if="props.primaryCta?.label || props.secondaryCta?.label"
        class="tier-actions"
      >
        <NuxtLink
          v-if="props.primaryCta?.label"
          class="tier-cta tier-cta--primary"
          v-bind="linkProps(props.primaryCta)"
        >
          {{ props.primaryCta.label }}
          <svg
            class="tier-cta-arrow"
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
          v-if="props.secondaryCta?.label"
          class="tier-cta tier-cta--secondary"
          v-bind="linkProps(props.secondaryCta)"
        >
          {{ props.secondaryCta.label }}
          <svg
            class="tier-cta-arrow"
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
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung: nội dung là 1 cột dọc, cách nhau 48px như design === */
.tier {
  @apply relative overflow-hidden py-20 sm:py-24 xl:py-32;
}
.tier--light {
  @apply bg-cream text-dark;
}
.tier--dark {
  @apply bg-dark text-cream;
}
.tier-inner {
  @apply relative z-10 mx-auto flex w-full max-w-content flex-col gap-12 px-6 sm:px-10 xl:px-16;
}
.tier-head {
  @apply flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8;
}
.tier-head-lead {
  @apply flex flex-col gap-4 lg:col-span-7 lg:col-start-1;
}
.tier-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* heading: 46px = 44px trong design drop +2px (ngoài thang token) */
.tier-heading {
  @apply font-serif text-[clamp(2rem,3.2vw,2.875rem)] font-light leading-[1.12] tracking-[-0.005em];
}
.tier-note {
  @apply text-sm leading-[1.6] lg:col-span-4 lg:col-start-9;
}

/* === Bảng hạng === */
.tier-grid {
  @apply grid grid-cols-1 gap-[2px] border-t bg-warm-600 sm:grid-cols-2 lg:grid-cols-4;
}
.tier--light .tier-grid {
  @apply border-primary;
}
.tier--dark .tier-grid {
  @apply border-cream/40;
}
/* Thẻ luôn nền kem theo design, kể cả khi section có nền ảnh/màu */
.tier-card {
  @apply flex flex-col gap-5 bg-warm-100 px-7 pb-[38px] pt-[34px];
}
/* Tên hạng: serif 26px như design (400, không phải medium) */
.tier-name {
  @apply font-serif text-2xl font-normal text-dark;
}
.tier-price-block {
  @apply flex flex-col gap-1;
}
.tier-from {
  @apply text-[11px] uppercase tracking-widest text-muted;
}
/* Giá: serif mảnh cỡ lớn, số căn cột để 4 thẻ thẳng hàng */
.tier-price {
  @apply whitespace-nowrap font-sans text-[clamp(1.5rem,2.1vw,2rem)] font-light leading-[1.15] text-primary tabular-nums;
}
.tier-period {
  @apply text-[13px] tracking-[0.06em] text-muted;
}
.tier-text {
  @apply text-[15px] leading-[1.55] text-warm-900;
}

/* === CTA: cao 52px như design (Section/Hero dùng 48px) === */
.tier-actions {
  @apply flex flex-wrap items-center gap-6;
}
.tier-cta {
  @apply inline-flex h-[52px] items-center gap-2.5 px-[30px] text-[15px] font-medium tracking-wide;
}
.tier-cta--primary {
  @apply bg-primary text-cream hover:bg-primary-hover hover:text-cream;
}
.tier-cta--secondary {
  @apply border border-primary text-primary hover:bg-primary hover:text-cream;
}
.tier-cta-arrow {
  @apply h-4 w-4 transition-transform duration-300;
}
.tier-cta:hover .tier-cta-arrow {
  @apply translate-x-1;
}
</style>
