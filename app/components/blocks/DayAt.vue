<script setup lang="ts">
import { type DayAt } from "../../../types";

const props = defineProps<Partial<DayAt>>();

// Id duy nhất cho cặp tab / tabpanel (tránh trùng khi 2 block cùng nằm 1 trang)
const uid = useId();

// Tab đang chọn theo index: khi đổi ngôn ngữ moments được fetch lại (id đổi)
// nên giữ index sẽ trỏ đúng thứ tự khoảnh khắc thay vì mất tab.
const activeIndex = ref(0);
const moments = computed(() => props.moments ?? []);
const active = computed(() => moments.value[activeIndex.value] ?? null);
</script>

<template>
  <section class="day-at">
    <div class="day-at-inner">
      <!-- Cột danh sách (4 cột): eyebrow + heading + các khoảnh khắc trong ngày -->
      <div class="day-at-lead">
        <div class="day-at-head">
          <p v-if="props.eyebrow" class="day-at-eyebrow">{{ props.eyebrow }}</p>
          <h2 v-if="props.heading" class="day-at-heading">
            {{ props.heading }}
          </h2>
        </div>

        <div
          v-if="moments.length"
          class="day-at-list"
          role="tablist"
          aria-orientation="vertical"
        >
          <button
            v-for="(m, i) in moments"
            :id="`${uid}-tab-${i}`"
            :key="m.id"
            type="button"
            role="tab"
            class="day-at-item"
            :class="i === activeIndex ? 'day-at-item--on' : 'day-at-item--off'"
            :aria-selected="i === activeIndex"
            :aria-controls="`${uid}-panel`"
            @click="activeIndex = i"
          >
            <!-- Nhãn khoảnh khắc: accent khi đang chọn, muted khi chưa -->
            <span
              class="day-at-item-label"
              :class="i === activeIndex ? 'text-primary-hover' : 'text-muted'"
            >
              {{ m.label }}
            </span>
            <span class="day-at-item-title">{{ m.title }}</span>
          </button>
        </div>
      </div>

      <!-- Cột nội dung (7 cột, bắt đầu từ cột 6): ảnh của khoảnh khắc đang chọn
           + thẻ mô tả đè lên góc dưới-trái -->
      <div
        v-if="active"
        :id="`${uid}-panel`"
        class="day-at-stage"
        role="tabpanel"
        :aria-labelledby="`${uid}-tab-${activeIndex}`"
      >
        <!-- key theo id: mỗi lần đổi tab khung được dựng lại để chạy lại .fade -->
        <div :key="active.id" class="day-at-frame fade">
          <div class="day-at-media">
            <img
              v-if="active.image"
              class="day-at-img"
              :src="active.image.url"
              :alt="active.image.alt"
              :width="active.image.width"
              :height="active.image.height"
            />
            <!-- Khoảnh khắc chưa có ảnh: nền nâu nhạt kẻ sọc chéo + nhãn "Photo · …" -->
            <div v-else class="day-at-placeholder">
              <p class="day-at-placeholder-label">
                <svg
                  class="day-at-placeholder-icon"
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
                <span>Photo · {{ active.title }}</span>
              </p>
            </div>
          </div>

          <div
            v-if="active.label || active.description || active.cta?.label"
            class="day-at-card"
          >
            <p v-if="active.label" class="day-at-card-eyebrow">
              {{ active.label }}
            </p>
            <p v-if="active.description" class="day-at-card-body">
              {{ active.description }}
            </p>

            <CtaLink :link="active.cta" size="sm" tone="light" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung: 1 cột trên mobile, lưới 12 cột từ lg (cột danh sách 4 cột,
   cột ảnh 7 cột bắt đầu từ cột 6 — đúng design drop) === */
.day-at {
  /* pt-8 = padding-top 32px của design; pb lớn dần để hở khoảng thở trước footer */
  @apply bg-cream pt-8 pb-20 sm:pb-28 xl:pb-44;
}
.day-at-inner {
  @apply mx-auto flex w-full max-w-content flex-col gap-y-10 px-6 sm:px-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8 xl:px-16;
}
.day-at-lead {
  @apply flex max-w-[34rem] flex-col gap-10 lg:col-span-4 lg:max-w-none;
}
.day-at-head {
  @apply flex flex-col gap-[18px];
}

/* === Chữ === */
/* eyebrow: nhãn nhỏ, chữ hoa, giãn rộng, màu accent */
.day-at-eyebrow {
  @apply text-[13px] font-medium uppercase tracking-label text-primary-hover;
}
/* heading: serif mảnh; 40px trong design +2px = 42px (ngoài thang token) */
.day-at-heading {
  @apply font-serif text-3xl font-light leading-[1.12] tracking-[-0.005em] text-dark sm:text-4xl xl:text-[42px];
}

/* === Danh sách khoảnh khắc: mỗi khoảnh khắc là 1 tab, ngăn bằng đường kẻ mảnh ===
   Giữ nguyên lưới "112px + phần còn lại" của design, chịu được màn 320px. */
.day-at-list {
  @apply flex flex-col border-b border-warm-600;
}
.day-at-item {
  @apply grid w-full grid-cols-[112px_minmax(0,1fr)] items-baseline gap-4 border-t border-warm-600 py-[22px] text-left transition-colors duration-300;
}
.day-at-item--on {
  @apply text-dark;
}
.day-at-item--off {
  @apply text-muted hover:text-warm-900;
}
.day-at-item-label {
  @apply text-[13px] font-medium uppercase tracking-label;
}
.day-at-item-title {
  @apply font-serif text-2xl font-light leading-[1.25];
}

/* === Khung ảnh: dáng đứng 4/5 trên mobile, 6/5 từ sm (cao tối đa 560px),
   đúng 560px × cột 7 từ lg — trùng tỉ lệ ảnh của design === */
.day-at-stage {
  @apply lg:col-span-7 lg:col-start-6;
}
.day-at-frame {
  @apply relative;
}
.day-at-media {
  @apply relative aspect-[4/5] max-h-[560px] w-full overflow-hidden bg-warm-500 sm:aspect-[6/5] lg:aspect-auto lg:h-[560px] lg:max-h-none;
}
.day-at-img {
  @apply block h-full w-full object-cover;
}
/* Nền thay ảnh: nâu nhạt + sọc chéo mảnh (design: repeating-linear-gradient 135deg) */
.day-at-placeholder {
  @apply absolute inset-0;
  background-image: repeating-linear-gradient(
    135deg,
    rgb(121 91 60 / 0.07) 0 1px,
    transparent 1px 14px
  );
}
.day-at-placeholder-label {
  @apply absolute bottom-[14px] left-4 flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-warm-800;
}
.day-at-placeholder-icon {
  @apply h-3.5 w-3.5 shrink-0;
}

/* === Thẻ mô tả ===
   Mobile: nằm sau ảnh, kéo lên đè mép dưới-trái và chừa lề phải.
   Từ lg: neo tuyệt đối vào góc dưới-trái của ảnh, tràn ra ngoài 64px/48px. */
.day-at-card {
  @apply relative z-10 -mt-12 mr-6 flex max-w-[420px] flex-col gap-3.5 bg-warm-100 px-6 pt-7 pb-6 shadow-card;
  @apply lg:absolute lg:-bottom-12 lg:-left-16 lg:mt-0 lg:mr-0 lg:w-[380px] lg:px-8 lg:pt-[30px] lg:pb-7;
}
.day-at-card-eyebrow {
  @apply text-[13px] font-medium uppercase tracking-label text-primary-hover;
}
/* mô tả: 17px trong design +2px = 19px (ngoài thang token) */
.day-at-card-body {
  @apply text-[19px] leading-[1.55] text-dark;
}
</style>
