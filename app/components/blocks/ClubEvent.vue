<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import {
  type ClubEvent,
  type ClubEventsResponse,
  type ClubEventItem,
} from "../../../types";
import type { FacetSpec } from "~/composables/useFacetFilter";

const props = defineProps<Partial<ClubEvent>>();
const linkProps = useLinkProps();
const { locale } = useI18n();

// === Nền: 3 dạng default | color | image (logic dùng chung: useBackground) ===
const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background);

// Danh sách event nằm ở collection riêng (`/api/club-events`) chứ không nhúng
// trong block, nên component tự fetch. Key của useAsyncData có locale ⇒ đổi
// ngôn ngữ là refetch, hai ngôn ngữ không trộn dữ liệu vào nhau.
const { data: eventsRes } = await useAsyncData(
  () => `club-events-${locale.value}`,
  () =>
    $fetch<ClubEventsResponse>("/api/club-events", {
      query: { locale: locale.value },
    }),
);

const events = computed(() => eventsRes.value?.events ?? []);

// Facet lọc danh sách (venues + categories). Nhãn theo ngôn ngữ đang xem nên để
// dạng computed; chọn nhiều giá trị trong 1 facet = OR, giữa 2 facet = AND.
const facetSpecs = computed<FacetSpec<ClubEventItem>[]>(() => [
  {
    key: "venues",
    label: locale.value === "vi" ? "Không gian" : "Spaces",
    values: (e) => [e.venues?.name],
  },
  {
    key: "categories",
    label: locale.value === "vi" ? "Loại sự kiện" : "Categories",
    values: (e) => e.categories.map((c) => c.name),
  },
]);

const { filtered, options, isActive, isPicked, toggle, clear } = useFacetFilter(
  events,
  facetSpecs,
);

// `limit` của block (CMS) = số event mỗi trang ⇒ phân trang trên danh sách đã lọc
const { page, pageCount, pageItems, hasPrev, hasNext, goTo } = usePagination(
  filtered,
  () => props.limit ?? 10,
);

// Strapi trả datetime ISO. Cố định múi giờ VN: event là giờ địa phương của club,
// và server/client format cùng múi giờ nên SSR không lệch hydration.
const dateFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-GB", {
      day: "2-digit",
      month: locale.value === "vi" ? "2-digit" : "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }),
);

// Giờ bắt đầu hiển thị 24h cho cả 2 ngôn ngữ (h23 để không thành "8:30 PM")
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Ho_Chi_Minh",
});

// ISO → Date; giá trị rỗng/sai (CMS chưa nhập) trả null để không vỡ layout
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "02 Nov" (en) / "02/11" (vi) như design
function formatDate(date: string): string {
  const value = parseDate(date);
  if (!value) return "";

  const parts = dateFormatter.value.formatToParts(value);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";

  return locale.value === "vi" ? `${day}/${month}` : `${day} ${month}`;
}

// Giờ bắt đầu của event, dòng dưới ngày: "20:30"
function formatTime(date: string): string {
  const value = parseDate(date);
  return value ? timeFormatter.format(value) : "";
}

const pageWord = computed(() => (locale.value === "vi" ? "Trang" : "Page"));
const allLabel = computed(() => (locale.value === "vi" ? "Tất cả" : "All"));
const emptyLabel = computed(() =>
  locale.value === "vi" ? "Không có sự kiện phù hợp." : "No events match.",
);
const prevLabel = computed(() =>
  locale.value === "vi" ? "Trang trước" : "Previous page",
);
const nextLabel = computed(() =>
  locale.value === "vi" ? "Trang sau" : "Next page",
);
</script>

<template>
  <section
    class="event"
    :class="onDark ? 'event--dark' : 'event--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="left" />

    <div class="event-inner">
      <!-- Đầu mục: eyebrow + heading bên trái, đoạn dẫn bên phải (từ lg) -->
      <div class="event-head">
        <div class="event-head-lead">
          <p v-if="props.eyebrow" class="event-eyebrow">{{ props.eyebrow }}</p>
          <h2 v-if="props.heading" class="event-heading">
            {{ props.heading }}
          </h2>
        </div>
        <p v-if="props.note" class="event-note">{{ props.note }}</p>
      </div>

      <!-- Lọc theo facet (venues/categories): "Tất cả" = bỏ lọc của facet đó -->
      <div v-if="options.length" class="event-filters">
        <div
          v-for="group in options"
          :key="group.key"
          class="event-filter-group"
        >
          <p class="event-filter-label">{{ group.label }}</p>
          <div class="event-filter-chips">
            <button
              type="button"
              class="event-chip"
              :class="{ 'event-chip--on': !isActive(group.key) }"
              :aria-pressed="!isActive(group.key)"
              @click="clear(group.key)"
            >
              {{ allLabel }}
            </button>
            <button
              v-for="v in group.values"
              :key="v.value"
              type="button"
              class="event-chip"
              :class="{ 'event-chip--on': isPicked(group.key, v.value) }"
              :aria-pressed="isPicked(group.key, v.value)"
              @click="toggle(group.key, v.value)"
            >
              {{ v.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Danh sách: ngày | tên + mô tả | địa điểm | loại sự kiện -->
      <ul v-if="pageItems.length" class="event-list">
        <li v-for="e in pageItems" :key="e.id" class="event-row fade">
          <span class="event-date">
            <span>{{ formatDate(e.date) }}</span>
            <span class="event-time">{{ formatTime(e.date) }}</span>
          </span>
          <div class="event-main">
            <p class="event-title">{{ e.title }}</p>
            <p v-if="e.description" class="event-desc">{{ e.description }}</p>
          </div>
          <!-- Mobile: 2 giá trị nằm chung 1 hàng; từ lg tách thành 2 cột lưới -->
          <div class="event-meta">
            <span v-if="e.venues" class="event-place">
              {{ e.venues.name }}
            </span>
            <span v-if="e.categories.length" class="event-kind">
              {{ e.categories.map((c) => c.name).join(" · ") }}
            </span>
          </div>
        </li>
      </ul>
      <!-- Lọc mà không còn event nào khớp -->
      <p v-else-if="isActive()" class="event-empty">{{ emptyLabel }}</p>

      <!-- Phân trang: số trang lấy từ `limit` của block; 1 trang thì ẩn -->
      <nav v-if="pageCount > 1" class="event-pagination" :aria-label="pageWord">
        <button
          type="button"
          class="event-page-btn"
          :disabled="!hasPrev"
          :aria-label="prevLabel"
          @click="goTo(page - 1)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <span class="event-page-status" aria-live="polite">
          {{ page }} / {{ pageCount }}
        </span>
        <button
          type="button"
          class="event-page-btn"
          :disabled="!hasNext"
          :aria-label="nextLabel"
          @click="goTo(page + 1)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </nav>

      <!-- CTA: nút đặc + link gạch chân, cao 48px/36px như design -->
      <div
        v-if="props.primaryCta?.label || props.secondaryCta?.label"
        class="event-actions"
      >
        <NuxtLink
          v-if="props.primaryCta?.label"
          class="event-cta event-cta--primary"
          v-bind="linkProps(props.primaryCta)"
        >
          {{ props.primaryCta.label }}
          <svg
            class="event-cta-arrow"
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
          class="event-cta event-cta--secondary"
          v-bind="linkProps(props.secondaryCta)"
        >
          {{ props.secondaryCta.label }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung: 1 cột, các nhóm cách nhau 56px như design === */
.event {
  /* @apply relative overflow-hidden py-20 sm:py-24 xl:py-32; */
  @apply relative overflow-hidden py-10 sm:py-32 xl:py-10;
}
/* Nền mặc định = nền trang (kem), giống các block sáng khác; nền màu do CMS cấp qua :style */
.event--light {
  @apply bg-cream text-dark;
}
/* Nền tối: màu đậm (CMS) hoặc ảnh — bg-dark là lúc ảnh chưa tải xong */
.event--dark {
  @apply bg-dark text-cream;
}
.event-inner {
  @apply relative z-10 mx-auto flex w-full max-w-content flex-col gap-6 px-6 sm:px-10 lg:gap-14 xl:px-16;
}

/* === Đầu mục === */
.event-head {
  @apply flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8;
}
.event-head-lead {
  @apply flex flex-col gap-[18px] lg:col-span-7 lg:col-start-1;
}
.event-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* heading: 46px = 44px trong design drop +2px (ngoài thang token) */
.event-heading {
  @apply font-serif text-[clamp(2rem,3.2vw,2.875rem)] font-light leading-[1.12] tracking-[-0.005em];
}
/* đoạn dẫn: 19px = 17px trong design +2px, nhịp dòng 1.6 của design */
.event-note {
  @apply text-[19px] leading-[1.6] lg:col-span-4 lg:col-start-9;
}

/* === Lọc theo facet: chip 40px, chọn = nền đặc (theo pattern chip của design) === */
.event-filters {
  @apply flex flex-col gap-4;
}
.event-filter-group {
  @apply flex flex-col gap-2;
}
.event-filter-label {
  @apply text-xs font-medium uppercase tracking-label;
}
.event-filter-chips {
  @apply flex flex-wrap items-center gap-2;
}
.event-chip {
  @apply inline-flex h-10 items-center border px-[18px] text-[16px] tracking-wide;
}
.event-empty {
  @apply py-2 text-[17px] leading-[1.5];
}

/* === Danh sách === */
.event-list {
  @apply flex flex-col border-t;
}
/* Mobile: các phần tử xếp dọc; từ lg dựng lại lưới 4 cột của design drop
   (132px ngày | tên co giãn | 200px địa điểm | 120px loại) */
.event-row {
  @apply grid grid-cols-1 gap-x-6 gap-y-3 border-b py-[26px];
}
@media (min-width: 1024px) {
  .event-row {
    grid-template-columns: 132px minmax(0, 1fr) 200px 120px;
    align-items: center;
  }
}
/* Ngày + giờ bắt đầu xếp 2 dòng trong cùng cột 132px của design */
.event-date {
  @apply flex flex-col gap-1 whitespace-nowrap text-[15px] uppercase tracking-[0.12em] tabular-nums;
}
.event-main {
  @apply flex flex-col gap-[6px];
}
/* Tên event: serif 25px = 23px trong design +2px (400, không phải medium) */
.event-title {
  @apply font-serif text-[25px] font-normal leading-[1.2];
}
.event-desc {
  @apply text-[17px] leading-[1.5];
}
/* 2 giá trị này là 2 cột lưới riêng từ lg (contents) nhưng nằm chung hàng trên mobile */
.event-meta {
  @apply flex items-center justify-between gap-4;
}
@media (min-width: 1024px) {
  .event-meta {
    @apply contents;
  }
}
.event-place {
  @apply text-[17px];
}
.event-kind {
  @apply text-[16px] tracking-[0.06em] lg:text-right;
}

/* === Màu chữ theo nền === */
.event--light .event-eyebrow {
  @apply text-primary-hover;
}
.event--light .event-heading,
.event--light .event-title {
  @apply text-dark;
}
.event--light .event-note,
.event--light .event-desc,
.event--light .event-place {
  @apply text-warm-900;
}
.event--light .event-date,
.event--light .event-kind,
.event--light .event-page-status {
  @apply text-muted;
}
.event--light .event-filter-label {
  @apply text-muted;
}
.event--light .event-chip {
  @apply border-warm-600 text-warm-900 hover:border-primary hover:text-primary;
}
.event--light .event-chip--on {
  @apply border-primary bg-primary text-cream hover:text-cream;
}
.event--light .event-empty {
  @apply text-warm-900;
}
.event--light .event-list {
  @apply border-primary;
}
.event--light .event-row {
  @apply border-warm-600;
}
.event--dark .event-eyebrow,
.event--dark .event-date {
  @apply text-warm-500;
}
.event--dark .event-heading,
.event--dark .event-title {
  @apply text-cream;
}
.event--dark .event-note,
.event--dark .event-desc,
.event--dark .event-place {
  @apply text-warm-400;
}
.event--dark .event-kind,
.event--dark .event-page-status {
  @apply text-warm-500;
}
.event--dark .event-filter-label {
  @apply text-warm-500;
}
.event--dark .event-chip {
  @apply border-cream/40 text-warm-400 hover:border-cream hover:text-cream;
}
.event--dark .event-chip--on {
  @apply border-cream bg-cream text-dark hover:text-dark;
}
.event--dark .event-empty {
  @apply text-warm-400;
}
.event--dark .event-list {
  @apply border-cream/40;
}
.event--dark .event-row {
  @apply border-cream/20;
}

/* === Phân trang === */
.event-pagination {
  @apply flex items-center justify-end gap-3;
}
.event-page-btn {
  @apply inline-flex h-10 w-10 items-center justify-center border;
}
.event-page-btn svg {
  @apply h-4 w-4;
}
.event-page-btn:disabled {
  @apply pointer-events-none opacity-40;
}
.event-page-status {
  @apply text-[15px] tracking-[0.06em] tabular-nums;
}
.event--light .event-page-btn {
  @apply border-warm-600 text-primary hover:bg-primary hover:text-cream;
}
.event--dark .event-page-btn {
  @apply border-cream/40 text-cream hover:bg-cream hover:text-dark;
}

/* === CTA: nút đặc 48px + link gạch chân 36px như design === */
.event-actions {
  @apply flex flex-wrap items-center gap-[18px];
}
.event-cta {
  @apply inline-flex items-center tracking-wide;
}
.event-cta--primary {
  @apply h-12 gap-2.5 px-[26px] text-[17px] font-medium;
}
.event-cta--secondary {
  @apply h-9 border-b border-current text-[16px] font-medium;
}
.event-cta-arrow {
  @apply h-4 w-4 transition-transform duration-300;
}
.event-cta:hover .event-cta-arrow {
  @apply translate-x-1;
}
.event--light .event-cta--primary {
  @apply bg-primary text-cream hover:bg-primary-hover hover:text-cream;
}
.event--dark .event-cta--primary {
  @apply bg-cream text-dark hover:bg-warm-400 hover:text-dark;
}
</style>
