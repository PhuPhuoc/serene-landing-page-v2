<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import { type Card, type WineAndDine } from "../../../types";

const props = defineProps<Partial<WineAndDine>>();

// === Nền: 3 dạng default | color | image (logic dùng chung: useBackground) ===
const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background);

// Card đầu là bài chính (7 cột, ảnh lớn); các card sau xếp cột hẹp bên phải.
const venues = computed(() => props.venues ?? []);

// Chú thích ảnh: CMS nhập nguyên nhãn (thường đã có "Photo · …") thì giữ nguyên;
// bỏ trống thì ghép từ tên địa điểm để khung ảnh luôn có nhãn như design.
const captionFor = (card: Card) =>
  card.imageCaption || (card.heading ? `Photo · ${card.heading}` : "");
</script>

<template>
  <section
    class="wine-dine"
    :class="onDark ? 'wine-dine--dark' : 'wine-dine--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="left" />

    <div class="wine-dine-inner">
      <!-- Đầu mục: eyebrow nhỏ + heading chiếm 7/12 cột như design -->
      <div class="wine-dine-head">
        <p v-if="props.eyebrow" class="wine-dine-eyebrow">
          {{ props.eyebrow }}
        </p>
        <h2 v-if="props.heading" class="wine-dine-heading">
          {{ props.heading }}
        </h2>
      </div>

      <!-- Địa điểm: 1 cột trên mobile → lưới 12 cột từ lg. Card đầu ở cột 1–7,
           các card sau ở cột 9–12, card thứ hai tụt xuống 160px (design drop). -->
      <div v-if="venues.length" class="wine-dine-grid">
        <article
          v-for="(card, index) in venues"
          :key="card.id"
          class="wine-dine-card fade"
          :class="
            index === 0
              ? 'wine-dine-card--lead'
              : [
                  'wine-dine-card--side',
                  { 'wine-dine-card--offset': index === 1 },
                ]
          "
        >
          <figure class="wine-dine-frame">
            <img
              v-if="card.image"
              class="wine-dine-img"
              :src="card.image.url"
              :alt="card.image.alt"
              :width="card.image.width"
              :height="card.image.height"
            />
            <!-- Chưa có ảnh: nền nâu nhạt kẻ sọc chéo như design -->
            <div v-else class="wine-dine-placeholder" aria-hidden="true" />

            <!-- Ảnh thật: lớp tối ở đáy để chú thích đọc được -->
            <div v-if="card.image" class="wine-dine-scrim" aria-hidden="true" />

            <figcaption
              class="wine-dine-caption"
              :class="{ 'wine-dine-caption--photo': card.image }"
            >
              <svg
                class="wine-dine-caption-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-5-9 8" />
              </svg>
              <span>{{ captionFor(card) }}</span>
            </figcaption>
          </figure>

          <!-- Chữ + CTA: card chính xếp chữ bên trái, nút bên phải (từ sm) -->
          <div class="wine-dine-body">
            <div class="wine-dine-text">
              <h3 class="wine-dine-card-title">{{ card.heading }}</h3>
              <p v-if="card.description" class="wine-dine-desc">
                {{ card.description }}
              </p>
            </div>

            <CtaLink
              :link="card.cta"
              size="sm"
              :tone="onDark ? 'dark' : 'light'"
              class="self-start"
            />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung === */
.wine-dine {
  @apply relative overflow-hidden py-10 sm:py-10 xl:py-10;
}
/* Nền mặc định = nền trang (kem); nền màu do CMS cấp qua :style */
.wine-dine--light {
  @apply bg-cream text-dark;
}
/* Nền tối: màu đậm (CMS) hoặc ảnh — bg-dark là lúc ảnh chưa tải xong */
.wine-dine--dark {
  @apply bg-dark text-cream;
}
.wine-dine-inner {
  @apply relative z-10 mx-auto flex w-full max-w-content flex-col gap-10 px-6 sm:gap-12 sm:px-10 lg:gap-16 xl:px-16;
}

/* === Đầu mục === */
.wine-dine-head {
  @apply flex max-w-[34rem] flex-col gap-3 sm:gap-[18px] lg:max-w-[46rem];
}
/* eyebrow: chữ hoa nhỏ, giãn rộng; dùng primary thay accent sáng để đủ tương
   phản AA trên nền kem (design dùng #BA805C chỉ đạt ~2.7:1) */
.wine-dine-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* heading: 48px trong design; clamp giữ tỉ lệ khi lên breakpoint */
.wine-dine-heading {
  @apply font-serif text-[clamp(2.125rem,4.2vw,3rem)] font-light leading-[1.12] tracking-[-0.005em];
}

/* === Lưới địa điểm: 1 cột mobile → 12 cột từ lg === */
.wine-dine-grid {
  @apply flex flex-col gap-14 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8 lg:gap-y-16;
}
.wine-dine-card {
  @apply flex flex-col gap-5 lg:gap-6;
}
.wine-dine-card--lead {
  @apply lg:col-span-7 lg:col-start-1 lg:row-start-1;
}
.wine-dine-card--side {
  @apply lg:col-span-4 lg:col-start-9;
}
/* Card phụ thứ hai tụt xuống 160px như design drop */
.wine-dine-card--offset {
  @apply lg:mt-40;
}

/* === Khung ảnh ===
   Mobile: card chính ngang 5/4 (đúng tỉ lệ 664×520 của design), card phụ 4/3 —
   cả hai cùng nằm ngang nên nhịp dọc không nhảy khi xếp 1 cột.
   Từ sm cùng về 16/10; từ lg cố định 520px / 420px như design. */
.wine-dine-frame {
  @apply relative w-full overflow-hidden bg-warm-500;
}
.wine-dine-card--lead .wine-dine-frame {
  @apply aspect-[5/4] sm:aspect-[16/10] lg:aspect-auto lg:h-[520px];
}
.wine-dine-card--side .wine-dine-frame {
  @apply aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-[420px];
}
.wine-dine-img {
  @apply block h-full w-full object-cover;
}
/* Nền thay ảnh: nâu nhạt + sọc chéo mảnh (như DayAt/Section) */
.wine-dine-placeholder {
  @apply absolute inset-0;
  background-image: repeating-linear-gradient(
    135deg,
    rgb(121 91 60 / 0.07) 0 1px,
    transparent 1px 14px
  );
}
/* Có ảnh thật: tối dần ở đáy khung cho chú thích */
.wine-dine-scrim {
  @apply pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-dark/60 to-transparent;
}
/* Chú thích: góc dưới-trái trong khung; warm-900 đạt ~4.7:1 trên nền sọc */
.wine-dine-caption {
  @apply absolute bottom-[14px] left-4 flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-warm-900;
}
.wine-dine-caption--photo {
  @apply text-cream;
}
.wine-dine-caption-icon {
  @apply h-3.5 w-3.5 shrink-0;
}

/* === Chữ dưới ảnh === */
.wine-dine-body {
  @apply flex flex-col gap-5;
}
/* Card chính: chữ 1 cột trên mobile; từ sm chữ bên trái, CTA bên phải, canh đáy */
.wine-dine-card--lead .wine-dine-body {
  @apply sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-x-8 sm:gap-y-5;
}
.wine-dine-text {
  @apply flex flex-col gap-2;
}
.wine-dine-card-title {
  @apply font-serif text-[clamp(1.5rem,1.8vw,1.75rem)] font-normal leading-[1.2];
}
.wine-dine-desc {
  @apply max-w-[46ch] text-base leading-[1.6];
}

/* === Màu chữ theo tone nền === */
.wine-dine--light .wine-dine-eyebrow {
  @apply text-primary;
}
.wine-dine--light .wine-dine-heading,
.wine-dine--light .wine-dine-card-title {
  @apply text-dark;
}
.wine-dine--light .wine-dine-desc {
  @apply text-warm-900;
}

.wine-dine--dark .wine-dine-eyebrow {
  @apply text-warm-500;
}
.wine-dine--dark .wine-dine-heading,
.wine-dine--dark .wine-dine-card-title {
  @apply text-cream;
}
.wine-dine--dark .wine-dine-desc {
  @apply text-warm-400;
}
</style>
