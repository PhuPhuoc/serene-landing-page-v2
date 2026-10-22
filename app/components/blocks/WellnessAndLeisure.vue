<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import Gallery from "~/components/Gallery.vue";
import { type Bento, type WellnessAndLeisure } from "../../../types";

const props = defineProps<Partial<WellnessAndLeisure>>();

// === Nền: 3 dạng default | color | image (logic dùng chung: useBackground) ===
const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background);

const bentos = computed(() => props.bentos ?? []);

// Màu CMS là `defaultHexColor`; schema Strapi cũng mặc định nâu này nên đây là
// fallback an toàn khi component chưa được nhập màu.
const DEFAULT_BENTO_COLOR = "#9A7B66";

const bentoColor = (bento: Bento) =>
  bento.defaultHexColor || DEFAULT_BENTO_COLOR;

const hasImages = (bento: Bento) => !!bento.images?.length;
</script>

<template>
  <section
    class="wellness"
    :class="onDark ? 'wellness--dark' : 'wellness--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="left" />

    <div class="wellness-inner">
      <!-- Đầu mục: eyebrow + heading, description canh đáy cột phải từ lg -->
      <header class="wellness-head">
        <div class="wellness-head-row">
          <div class="wellness-title">
            <p v-if="props.eyebrow" class="wellness-eyebrow">
              {{ props.eyebrow }}
            </p>
            <h2 v-if="props.heading" class="wellness-heading">
              {{ props.heading }}
            </h2>
          </div>
          <p v-if="props.description" class="wellness-description">
            {{ props.description }}
          </p>
        </div>
      </header>

      <!-- Bento: mobile 1 cột → tablet 2 cột (Golf chiếm cả hàng) → desktop
           4 cột đúng sơ đồ design "golf golf yoga water / gym gardens yoga lake" -->
      <div v-if="bentos.length" class="wellness-bentos">
        <article
          v-for="(bento, i) in bentos"
          :key="bento.id"
          class="wellness-bento fade"
          :class="[
            `wellness-bento--${i}`,
            hasImages(bento)
              ? 'wellness-bento--photo'
              : 'wellness-bento--color',
          ]"
          :style="{ '--bento-color': bentoColor(bento) }"
        >
          <!-- Có ảnh: gallery tự chuyển ảnh, bấm ảnh mở slideshow toàn màn hình -->
          <div class="wellness-media">
            <Gallery
              v-if="hasImages(bento)"
              :images="bento.images"
              :alt="bento.heading"
              :label="bento.heading"
              variant="bento"
            />
            <!-- Không có ảnh: chỉ nền màu + sọc chéo như design -->
            <div v-else class="wellness-placeholder" aria-hidden="true" />
          </div>

          <div class="wellness-caption">
            <h3 class="wellness-bento-heading">{{ bento.heading }}</h3>
            <p v-if="bento.description" class="wellness-bento-text">
              {{ bento.description }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung === */
.wellness {
  @apply relative overflow-hidden py-8 sm:py-10 lg:py-8;
}
.wellness--light {
  @apply bg-cream text-dark;
}
.wellness--dark {
  @apply bg-dark text-cream;
}
.wellness-inner {
  @apply relative z-10 mx-auto flex w-full max-w-content flex-col gap-8 px-5 sm:gap-10 sm:px-10 lg:gap-14 xl:px-16;
}

/* === Đầu mục === */
.wellness-title {
  @apply flex flex-col gap-4 lg:col-span-8;
}
.wellness-head-row {
  @apply flex flex-col gap-5 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8;
}
.wellness-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* 44px trên mobile → 62px desktop như design */
.wellness-heading {
  @apply font-serif text-[clamp(2.75rem,5.4vw,3.875rem)] font-light leading-[1.02] tracking-[-0.01em];
}
.wellness-description {
  @apply max-w-[40ch] text-[17px] leading-[1.6] lg:col-span-4 lg:col-start-9;
}

/* === Lưới bento: mobile 1 cột, mỗi ô tối thiểu 260px === */
.wellness-bentos {
  @apply flex flex-col gap-3;
}
.wellness-bento {
  @apply flex min-h-[260px] flex-col overflow-hidden;
}
.wellness-media {
  @apply relative flex min-h-[110px] flex-1 overflow-hidden;
  background-color: var(--bento-color);
}
/* Ảnh/placeholder phủ kín phần còn lại của card: ảnh không được tự đẩy chiều
   cao card theo tỉ lệ gốc (grid row mới là thứ quyết định chiều cao). */
.wellness-media > * {
  @apply absolute inset-0 h-full w-full;
}

/* Ô không ảnh: nền hexColor + sọc chéo mảnh như design */
.wellness-placeholder {
  @apply absolute inset-0;
  background-color: var(--bento-color);
  background-image: repeating-linear-gradient(
    135deg,
    rgb(255 255 255 / 0.18) 0 1px,
    transparent 1px 14px
  );
}

/* Caption luôn nền tối, chữ kem; ô có màu thì pha thêm màu đó cho liền mạch */
.wellness-caption {
  @apply flex shrink-0 flex-col gap-1.5 bg-[#2B322C] px-5 pb-5 pt-4 text-cream sm:px-7 sm:pb-5 sm:pt-5;
}
.wellness-bento--color .wellness-caption {
  background-color: color-mix(in srgb, var(--bento-color) 25%, #20261f);
}
.wellness-bento-heading {
  @apply font-serif text-[clamp(1.5rem,2.4vw,1.875rem)] font-normal leading-[1.1] text-cream;
}
.wellness-bento-text {
  @apply max-w-[42ch] text-[15px] leading-[1.45] text-cream/80;
}

/* === Tablet 640–1023: 2 cột, "Golf & the green" chiếm cả hàng đầu === */
@media (min-width: 640px) {
  .wellness-bentos {
    @apply grid grid-cols-2;
  }
  .wellness-bento--0 {
    grid-column: 1 / -1;
  }
}

/* === Desktop ≥1024: 4 cột theo đúng sơ đồ design === */
@media (min-width: 1024px) {
  .wellness-bentos {
    @apply grid-cols-4;
    grid-template-areas:
      "golf golf yoga water"
      "gym gardens yoga lake";
    grid-template-rows: repeat(2, minmax(260px, auto));
  }
  .wellness-bento--0 {
    grid-area: golf;
  }
  .wellness-bento--1 {
    grid-area: gym;
  }
  .wellness-bento--2 {
    grid-area: yoga;
  }
  .wellness-bento--3 {
    grid-area: water;
  }
  .wellness-bento--4 {
    grid-area: gardens;
  }
  .wellness-bento--5 {
    grid-area: lake;
  }
}

/* === Màu chữ đầu mục theo tone nền === */
.wellness--light .wellness-eyebrow {
  @apply text-primary;
}
.wellness--light .wellness-heading {
  @apply text-dark;
}
.wellness--light .wellness-description {
  @apply text-warm-900;
}
.wellness--dark .wellness-eyebrow {
  @apply text-warm-500;
}
.wellness--dark .wellness-heading {
  @apply text-cream;
}
.wellness--dark .wellness-description {
  @apply text-warm-400;
}
</style>
