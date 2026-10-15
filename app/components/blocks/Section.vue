<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import { CtaVariant, ImagePositon, type SimpleSection } from "../../../types";

const props = defineProps<Partial<SimpleSection>>();
const linkProps = useLinkProps();

// === Nền: 3 dạng default | color | image (logic dùng chung: useBackground) ===
const {
  image: bgImage,
  onDark,
  style: sectionStyle,
} = useBackground(() => props.background);

// imagePosition quyết định bên nào giữ ảnh; mobile xếp theo đúng thứ tự đó
const imageRight = computed(() => props.imagePosition === ImagePositon.RIGHT);

const ctaClass = computed(() =>
  props.ctaVariant === CtaVariant.SOLID_LIGHT
    ? "section-cta--solid-light"
    : "section-cta--solid-dark",
);
</script>

<template>
  <section
    class="section"
    :class="onDark ? 'section--dark' : 'section--light'"
    :style="sectionStyle"
  >
    <!-- Nền ảnh: full-bleed + lớp phủ tối dần về phía cột chữ (cùng lối với Hero) -->
    <BlockBackground
      :image="bgImage"
      :dark-side="imageRight ? 'left' : 'right'"
    />

    <div class="section-inner">
      <!-- Ảnh minh hoạ: 6 cột (trái/phải tuỳ imagePosition), chữ ở 5 cột đối diện -->
      <div
        class="section-media"
        :class="{ 'section-media--right': imageRight }"
      >
        <div class="section-frame">
          <img
            v-if="props.image"
            class="section-img"
            :src="props.image.url"
            :alt="props.image.alt"
            :width="props.image.width"
            :height="props.image.height"
          />
          <!-- Chưa có ảnh: nền kẻ sọc chéo mảnh, nhãn chú thích thay vai trò ảnh -->
          <div v-else class="section-placeholder" aria-hidden="true" />

          <!-- Ảnh thật: lớp tối ở đáy để chú thích đọc được trên nền ảnh -->
          <div
            v-if="props.image"
            class="section-frame-scrim"
            aria-hidden="true"
          />

          <p
            v-if="props.imageCaption"
            class="section-caption"
            :class="{ 'section-caption--photo': props.image }"
          >
            <svg
              class="section-caption-icon"
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
            <span>{{ props.imageCaption }}</span>
          </p>
        </div>
      </div>

      <!-- Cột chữ: eyebrow → heading → đoạn dẫn → CTA -->
      <div
        class="section-content"
        :class="{ 'section-content--right': imageRight }"
      >
        <p v-if="props.eyebrow" class="section-eyebrow">{{ props.eyebrow }}</p>
        <h2 v-if="props.heading" class="section-heading">
          {{ props.heading }}
        </h2>
        <p v-if="props.body" class="section-text">{{ props.body }}</p>

        <NuxtLink
          v-if="props.cta?.label"
          class="section-cta"
          :class="ctaClass"
          v-bind="linkProps(props.cta)"
        >
          {{ props.cta.label }}
          <svg
            class="section-cta-arrow"
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
/* === Khung: 1 cột trên mobile; từ lg dựng lại lưới 12 cột của design drop
   (ảnh 6 cột, chữ 5 cột, cách nhau đúng 1 rãnh) === */
.section {
  @apply relative overflow-hidden py-20 sm:py-24 xl:py-32;
}
/* Nền mặc định = nền trang (kem); nền màu do CMS cấp qua :style */
.section--light {
  @apply bg-cream text-dark;
}
/* Nền tối: màu đậm (CMS) hoặc ảnh — bg-dark là lúc ảnh chưa tải xong */
.section--dark {
  @apply bg-dark text-cream;
}
.section-inner {
  @apply relative z-10 mx-auto flex w-full max-w-content flex-col gap-y-10 px-6 sm:px-10 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8 xl:px-16;
}
/* order đảo bên trên mobile: ảnh-right thì chữ lên trước, desktop lưới tự lo cột.
   row-start-1: thiếu nó, item đặt trước (ảnh, col 7) đẩy con trỏ auto-placement
   qua khỏi cột 5 nên cột chữ (col 1) rơi xuống hàng 2 — ảnh phải luôn cùng hàng
   với chữ như grid-row: 1 trong design drop. */
.section-media {
  @apply lg:col-span-6 lg:col-start-1 lg:row-start-1;
}
.section-media--right {
  @apply order-2 lg:order-none lg:col-start-7;
}
.section-content {
  @apply flex flex-col gap-[22px] lg:col-span-5 lg:col-start-8 lg:row-start-1;
}
.section-content--right {
  @apply order-1 lg:order-none lg:col-start-1;
}

/* === Khung ảnh ===
   Mobile: dọc 4/5 → ngang 6/5 từ sm (cao tối đa 560px).
   Từ lg cố định 520px cho mọi section (giá trị design drop dùng nhiều nhất:
   stay 560, dine/art/events/private 520, membership 480, wellness 320) để các
   section simple-section cao bằng nhau, không so le 480/520 như trước. */
.section-frame {
  @apply relative aspect-[4/5] max-h-[560px] w-full overflow-hidden bg-warm-500 sm:aspect-[6/5] lg:aspect-auto lg:h-[520px] lg:max-h-none;
}
.section-img {
  @apply block h-full w-full object-cover;
}
/* Nền thay ảnh: nâu nhạt + sọc chéo mảnh (nâu đậm khi section nền tối) */
.section-placeholder {
  @apply absolute inset-0;
  background-image: repeating-linear-gradient(
    135deg,
    rgb(121 91 60 / 0.07) 0 1px,
    transparent 1px 14px
  );
}
.section--dark .section-placeholder {
  background-image: repeating-linear-gradient(
    135deg,
    rgb(242 233 218 / 0.06) 0 1px,
    transparent 1px 14px
  );
}
.section--dark .section-frame {
  @apply bg-[#4A3A2C];
}
/* Có ảnh thật: tối dần ở đáy khung cho chú thích */
.section-frame-scrim {
  @apply pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-dark/60 to-transparent;
}
/* Chú thích: góc dưới-trái trong khung, chữ hoa nhỏ, giãn rộng */
.section-caption {
  @apply absolute bottom-[14px] left-4 flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-warm-800;
}
.section-caption--photo {
  @apply text-cream;
}
.section-caption-icon {
  @apply h-3.5 w-3.5 shrink-0;
}

/* === Chữ === */
/* eyebrow: nhãn nhỏ, chữ hoa, giãn rộng, màu accent */
.section-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* heading: serif mảnh; 46px = 44px trong design drop +2px (ngoài thang token).
   Dùng clamp như Hero: `sm:text-4xl` sẽ đè mất leading-[1.12] vì nằm trong
   media query, còn font-size tuỳ ý thì không kèm line-height. */
.section-heading {
  @apply font-serif text-[clamp(2rem,3.2vw,2.875rem)] font-light leading-[1.12] tracking-[-0.005em];
}
/* đoạn dẫn: 20px = 18px trong design +2px, nhịp dòng 1.65 của design */
.section-text {
  @apply max-w-[46ch] text-lg leading-[1.65];
}

/* === Màu chữ theo nền === */
.section--light .section-eyebrow {
  @apply text-primary-hover;
}
.section--light .section-heading {
  @apply text-dark;
}
.section--light .section-text {
  @apply text-warm-900;
}
.section--dark .section-eyebrow {
  @apply text-warm-500;
}
.section--dark .section-heading {
  @apply text-cream;
}
.section--dark .section-text {
  @apply text-warm-400;
}

/* === CTA: cao 48px như Hero, nền đặc, mũi tên trượt nhẹ khi hover === */
.section-cta {
  @apply inline-flex h-12 items-center gap-2.5 self-start px-[26px] text-[17px] font-medium tracking-wide;
}
/* solid-dark: nút nâu trên nền sáng */
.section-cta--solid-dark {
  @apply bg-primary text-cream hover:bg-primary-hover hover:text-cream;
}
/* solid-light: nút kem trên nền tối */
.section-cta--solid-light {
  @apply bg-cream text-dark hover:bg-warm-400 hover:text-dark;
}
.section-cta-arrow {
  @apply h-4 w-4 transition-transform duration-300;
}
.section-cta:hover .section-cta-arrow {
  @apply translate-x-1;
}
</style>
