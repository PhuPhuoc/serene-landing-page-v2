<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import Gallery from "~/components/Gallery.vue";
import {
  type Residence,
  type ResidenceResponse,
  type Stay,
} from "../../../types";

const props = defineProps<Partial<Stay>>();
const { locale } = useI18n();
const isVi = computed(() => locale.value === "vi");

// === Nền: default | color | image (logic dùng chung: useBackground) ===
const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background);

// Danh sách residence nằm ở collection riêng (`/api/residences`), không nhúng
// trong block nên component tự fetch (cùng lối với ClubEvent/PrivateEvent).
// Key theo locale ⇒ đổi ngôn ngữ là refetch, dữ liệu 2 ngôn ngữ không trộn.
const { data: residencesRes } = await useAsyncData(
  () => `residences-${locale.value}`,
  () =>
    $fetch<ResidenceResponse>("/api/residences", {
      query: { locale: locale.value },
    }),
);

const residences = computed(() => residencesRes.value?.residences ?? []);

// Residence đang xem: chọn từ danh sách bên dưới; danh sách đổi (đổi locale)
// mà id cũ không còn thì rơi về residence đầu tiên.
const activeId = ref<number | null>(null);
const activeResidence = computed<Residence | null>(
  () =>
    residences.value.find((r) => r.id === activeId.value) ??
    residences.value[0] ??
    null,
);
const activeIndex = computed(() =>
  Math.max(
    0,
    residences.value.findIndex((r) => r.id === activeResidence.value?.id),
  ),
);

const gallery = computed(() => activeResidence.value?.gallery ?? []);
const includes = computed(() => activeResidence.value?.includes ?? []);

// Số khách là state của UI (CMS chưa có field sức chứa); giữ tối thiểu 1.
const guests = ref(2);
function stepGuests(delta: number) {
  guests.value = Math.max(1, guests.value + delta);
}

const copy = computed(() =>
  isVi.value
    ? {
        yourStay: "Lưu trú của bạn",
        select: "Chọn nơi lưu trú",
        includes: "Mỗi nơi lưu trú đều bao gồm",
        aboutPrefix: "Về",
        size: "Diện tích",
        bed: "Giường",
        view: "Tầm nhìn",
        guests: "Số khách",
        decrease: "Giảm số khách",
        increase: "Tăng số khách",
        photo: "Ảnh",
      }
    : {
        yourStay: "Your stay",
        select: "Select a residence",
        includes: "Every residence includes",
        aboutPrefix: "About",
        size: "Size",
        bed: "Bed",
        view: "Views",
        guests: "Guests",
        decrease: "Decrease guests",
        increase: "Increase guests",
        photo: "Photo",
      },
);

// Nhãn do CMS nhập thì ưu tiên; field trống mới dùng bản dựng sẵn.
const yourStayLabel = computed(
  () => props.yourStayLabel || copy.value.yourStay,
);
const includesTitle = computed(
  () => props.includesTitle || copy.value.includes,
);
const aboutLabel = computed(() => {
  const name = activeResidence.value?.shortName?.trim();
  return name ? `${copy.value.aboutPrefix} ${name}` : copy.value.aboutPrefix;
});

const formatSize = (size: number | null | undefined) =>
  size ? `${size} m²` : "";

const formatBed = (bed: string | null | undefined) => bed?.trim() ?? "";

// Dòng meta dưới tên: "50 m² · 1 king bed · river & garden"
const metaLine = computed(() => {
  const r = activeResidence.value;
  if (!r) return "";

  return [formatSize(r.size), formatBed(r.bed), r.view?.trim()]
    .filter(Boolean)
    .join(" · ");
});

// Thẻ chọn residence chỉ hiện diện tích + giường như design.
const cardMeta = (r: Residence) =>
  [formatSize(r.size), formatBed(r.bed)].filter(Boolean).join(" · ");

// Bảng thông số trong panel phải: bỏ dòng nào CMS để trống.
const specs = computed(() => {
  const r = activeResidence.value;
  if (!r) return [];

  return [
    { label: copy.value.size, value: formatSize(r.size) },
    { label: copy.value.bed, value: formatBed(r.bed) },
    { label: copy.value.view, value: r.view?.trim() ?? "" },
  ].filter((s) => !!s.value);
});

const pad = (n: number) => String(n).padStart(2, "0");
const counter = computed(
  () => `${pad(activeIndex.value + 1)} / ${pad(residences.value.length)}`,
);

const badgeCount = (r: Residence) => Math.max(0, r.gallery.length - 1);
</script>

<template>
  <section
    class="stay"
    :class="onDark ? 'stay--dark' : 'stay--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="left" />

    <div class="stay-inner">
      <!-- Đầu mục: eyebrow + heading bên trái, đoạn dẫn bên phải (từ lg) -->
      <header class="stay-head">
        <div class="stay-head-lead">
          <p v-if="props.eyebrow" class="stay-eyebrow">{{ props.eyebrow }}</p>
          <h2 v-if="props.heading" class="stay-heading">
            {{ props.heading }}
          </h2>
        </div>
        <p v-if="props.description" class="stay-intro">
          {{ props.description }}
        </p>
      </header>

      <!-- Panel chính: ảnh lớn + thẻ thông tin phủ đáy (desktop) / nối tiếp
           bên dưới ảnh (mobile) + cột "includes" nền sáng -->
      <div v-if="activeResidence" class="stay-layout">
        <div :key="activeResidence.id" class="stay-media fade">
          <div class="stay-gallery">
            <Gallery
              v-if="gallery.length"
              :images="gallery"
              :alt="activeResidence.name"
              :label="activeResidence.name"
              variant="bento"
              :autoplay="false"
            />
            <div v-else class="stay-placeholder" aria-hidden="true" />

            <span v-if="gallery.length" class="stay-photo-label">
              {{ copy.photo }} · {{ activeResidence.shortName }}
            </span>
          </div>

          <div class="stay-panel">
            <div class="stay-panel-main">
              <p class="stay-panel-label">{{ yourStayLabel }}</p>
              <h3 class="stay-name">{{ activeResidence.name }}</h3>
              <p v-if="metaLine" class="stay-meta">{{ metaLine }}</p>
            </div>

            <div class="stay-panel-actions">
              <div class="stay-stepper" role="group" :aria-label="copy.guests">
                <button
                  type="button"
                  class="stay-step"
                  :aria-label="copy.decrease"
                  :disabled="guests <= 1"
                  @click="stepGuests(-1)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span class="stay-guests" aria-live="polite">{{ guests }}</span>
                <button
                  type="button"
                  class="stay-step"
                  :aria-label="copy.increase"
                  @click="stepGuests(1)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>

              <!-- CTA nằm trên panel nâu nên dùng tone light để ra nút primary
                   như design (nút kem sẽ quá nổi trên panel) -->
              <CtaLink
                v-if="props.cta?.label"
                :link="props.cta"
                size="sm"
                tone="light"
                class="stay-cta"
              />
            </div>
          </div>
        </div>

        <aside :key="activeResidence.id" class="stay-aside fade">
          <div v-if="includes.length" class="stay-aside-block">
            <p class="stay-aside-title">{{ includesTitle }}</p>
            <ul class="stay-includes">
              <li v-for="item in includes" :key="item" class="stay-include">
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="stay-about">
            <p class="stay-aside-title">{{ aboutLabel }}</p>
            <p v-if="activeResidence.description" class="stay-about-text">
              {{ activeResidence.description }}
            </p>

            <dl v-if="specs.length" class="stay-specs">
              <div v-for="spec in specs" :key="spec.label" class="stay-spec">
                <dt>{{ spec.label }}</dt>
                <dd>{{ spec.value }}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <!-- Chọn residence: cuộn ngang trên mobile, lưới 5 thẻ trên desktop -->
      <div v-if="residences.length" class="stay-select">
        <div class="stay-select-head">
          <p class="stay-select-label">{{ copy.select }}</p>
          <p class="stay-counter">{{ counter }}</p>
        </div>

        <ul class="stay-cards" :aria-label="copy.select">
          <li v-for="r in residences" :key="r.id" class="stay-card-item">
            <button
              type="button"
              class="stay-card"
              :class="{ 'stay-card--on': r.id === activeResidence?.id }"
              :aria-pressed="r.id === activeResidence?.id"
              @click="activeId = r.id"
            >
              <span class="stay-card-media">
                <img
                  v-if="r.gallery[0]"
                  :src="r.gallery[0].url"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span v-else class="stay-placeholder" aria-hidden="true" />
                <span
                  v-if="badgeCount(r)"
                  class="stay-card-badge"
                  aria-hidden="true"
                >
                  +{{ badgeCount(r) }}
                </span>
              </span>
              <span class="stay-card-body">
                <span class="stay-card-name">{{ r.name }}</span>
                <span v-if="cardMeta(r)" class="stay-card-meta">
                  {{ cardMeta(r) }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung === */
.stay {
  @apply relative overflow-hidden py-4 sm:py-10 lg:py-8;
}
/* Nền mặc định = kem như các block sáng khác; màu/ảnh do CMS cấp qua :style */
.stay--light {
  @apply bg-cream text-dark;
}
.stay--dark {
  @apply bg-dark text-cream;
}
.stay-inner {
  @apply relative z-10 mx-auto flex w-full max-w-container flex-col gap-8 px-6 sm:px-10 lg:gap-4 xl:px-10;
}

/* === Đầu mục === */
.stay-head {
  @apply flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8;
}
.stay-head-lead {
  @apply flex flex-col gap-3 lg:col-span-7 lg:col-start-1;
}
.stay-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* heading: 68px design → 66px ở desktop, clamp để mobile không vỡ dòng */
.stay-heading {
  @apply font-serif text-[clamp(2.25rem,4.8vw,4.125rem)] font-light leading-[1.04] tracking-[-0.005em];
}
/* đoạn dẫn: 19px = 17px design +2px, canh đáy cột heading từ lg */
.stay-intro {
  @apply max-w-[46ch] text-[19px] leading-[1.6] lg:col-span-4 lg:col-start-9;
}

/* === Bố cục chính: ảnh + panel (8 cột) | aside (4 cột) === */
.stay-layout {
  @apply flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-4;
}
.stay-media {
  @apply relative flex flex-col lg:col-span-8;
}
.stay-gallery {
  @apply relative aspect-[4/5] w-full overflow-hidden bg-warm-500 sm:aspect-[4/3] lg:aspect-[3/2];
}
/* Gallery bento phủ kín khung; placeholder khi CMS chưa có ảnh */
.stay-placeholder {
  @apply absolute inset-0 bg-warm-500;
  background-image: repeating-linear-gradient(
    135deg,
    rgb(121 91 60 / 0.07) 0 1px,
    transparent 1px 14px
  );
}
/* Nhãn ảnh góc trên-trái; badge +N của Gallery nằm góc đối diện */
.stay-photo-label {
  @apply pointer-events-none absolute left-4 top-4 z-10 text-[11px] uppercase tracking-[0.16em] text-cream sm:left-5 sm:top-5;
  text-shadow: 0 1px 10px rgb(34 25 18 / 0.55);
}

/* === Thẻ thông tin: nối dưới ảnh trên mobile, phủ đáy ảnh từ lg === */
.stay-panel {
  @apply flex flex-col gap-5 bg-dark p-5 text-cream sm:p-6;
}
.stay-panel-main {
  @apply flex flex-col gap-2;
}
.stay-panel-label {
  @apply text-[11px] font-medium uppercase tracking-label text-warm-400;
}
.stay-name {
  @apply font-serif text-[clamp(1.625rem,2.4vw,2.25rem)] font-light leading-[1.12] text-cream;
}
.stay-meta {
  @apply text-[15px] leading-[1.5] text-warm-300;
}
.stay-panel-actions {
  @apply flex w-full flex-wrap items-center justify-between gap-2;
}
.stay-stepper {
  @apply inline-flex h-10 w-fit items-center border border-cream/35;
}
.stay-step {
  @apply inline-flex h-full w-9 items-center justify-center text-cream transition-colors hover:bg-cream/10 disabled:pointer-events-none disabled:opacity-35;
}
.stay-step svg {
  @apply h-4 w-4;
}
.stay-guests {
  @apply min-w-9 text-center text-[17px] leading-none tabular-nums;
}
/* CTA nhỏ trên mobile để stepper + nút nằm cùng một hàng; từ lg trả lại
   kích thước sm mặc định (40px) vì panel đã chuyển sang cột phải */
.stay-cta {
  @apply px-2 text-xs;
}
@media (min-width: 1024px) {
  /* Panel nổi trên ảnh, cách mép 28px như design; ảnh vẫn lộ phần trên */
  .stay-panel {
    @apply absolute inset-x-7 bottom-7 z-20 flex-row items-end justify-between gap-6 p-7;
  }
  .stay-panel-main {
    @apply min-w-0 flex-1;
  }
  .stay-panel-actions {
    @apply w-auto shrink-0 flex-row flex-nowrap items-center justify-end gap-3;
  }
  .stay-cta {
    @apply px-4 text-base;
  }
}

/* === Aside: card sáng "includes / about / specs" === */
.stay-aside {
  @apply flex flex-col gap-8 border border-warm-300 bg-warm-50 p-6 text-dark sm:p-8 lg:col-span-4;
}
.stay-aside-block {
  @apply flex flex-col gap-5;
}
.stay-aside-title {
  @apply text-[11px] font-medium uppercase tracking-label text-muted;
}
.stay-includes {
  @apply flex flex-col gap-3;
}
.stay-include {
  @apply relative pl-5 text-[16px] leading-[1.5] text-dark;
}
.stay-include::before {
  content: "";
  @apply absolute left-0 top-[0.6em] h-1.5 w-1.5 rounded-full bg-primary-hover;
}
/* Đẩy phần about xuống đáy card trên desktop để cân chiều cao với ảnh */
.stay-about {
  @apply flex flex-col gap-4 border-t border-warm-300 pt-7 lg:mt-auto;
}
.stay-about-text {
  @apply text-[16px] leading-[1.6] text-warm-900;
}
.stay-specs {
  @apply flex flex-col;
}
.stay-spec {
  @apply flex items-baseline justify-between gap-4 border-t border-warm-300 py-3 text-[15px];
}
.stay-spec dt {
  @apply text-muted;
}
.stay-spec dd {
  @apply text-right text-dark;
}

/* === Chọn residence === */
.stay-select {
  @apply flex flex-col gap-4 lg:mb-8;
}
.stay-select-head {
  @apply flex items-center justify-between gap-4;
}
.stay-select-label {
  @apply text-[11px] font-medium uppercase tracking-label;
}
.stay-counter {
  @apply text-[12px] tracking-[0.08em] tabular-nums;
}
/* Mobile: carousel scroll-snap tràn mép; desktop: 5 thẻ một hàng, thẻ dư bị
   cắt ở mép phải như design */
.stay-cards {
  @apply -mx-6 flex snap-x snap-mandatory scroll-pl-6 gap-3 overflow-x-auto px-6 pb-4 sm:-mx-10 sm:scroll-pl-10 sm:px-10 xl:-mx-16 xl:scroll-pl-16 xl:px-16;
  scrollbar-width: thin;
  scrollbar-color: #d6c4aa transparent;
}
.stay-cards::-webkit-scrollbar {
  height: 4px;
}
.stay-cards::-webkit-scrollbar-track {
  background: transparent;
}
.stay-cards::-webkit-scrollbar-thumb {
  @apply bg-warm-600;
}
.stay-card-item {
  @apply w-[68vw] max-w-[280px] shrink-0 snap-start sm:w-[38vw] lg:w-[calc((100%-3rem)/5)];
}
.stay-card {
  @apply flex h-full w-full flex-col border border-warm-400 bg-warm-100 text-left text-dark transition-colors hover:border-primary;
}
.stay-card--on {
  @apply border-primary bg-warm-50;
}
.stay-card-media {
  @apply relative block aspect-[16/9] overflow-hidden bg-warm-500;
}
.stay-card-media img {
  @apply h-full w-full object-cover;
}
.stay-card-badge {
  @apply absolute right-3 top-3 z-10 flex h-9 min-w-9 items-center justify-center border border-cream/55 px-1.5 font-sans text-[14px] leading-none text-cream;
  background-color: rgb(42 50 39 / 0.86);
}
.stay-card-body {
  @apply flex flex-col gap-1 px-4 py-3;
}
.stay-card-name {
  @apply font-serif text-[21px] font-normal leading-[1.15] text-dark;
}
.stay-card-meta {
  @apply text-[13px] leading-[1.4] text-muted;
}

/* === Màu theo tone nền của block (card/aside luôn nền sáng riêng) === */
.stay--light .stay-eyebrow {
  @apply text-primary-hover;
}
.stay--light .stay-heading {
  @apply text-dark;
}
.stay--light .stay-intro {
  @apply text-warm-900;
}
.stay--light .stay-select-label {
  @apply text-muted;
}
.stay--light .stay-counter {
  @apply text-muted;
}

.stay--dark .stay-eyebrow {
  @apply text-warm-500;
}
.stay--dark .stay-heading {
  @apply text-cream;
}
.stay--dark .stay-intro {
  @apply text-warm-400;
}
.stay--dark .stay-select-label {
  @apply text-warm-500;
}
.stay--dark .stay-counter {
  @apply text-warm-500;
}
</style>
