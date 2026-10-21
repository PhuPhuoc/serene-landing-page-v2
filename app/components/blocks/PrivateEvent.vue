<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import Gallery from "~/components/Gallery.vue";
import {
  type EventVenue,
  type EventVenuesResponse,
  type PrivateEvent,
  type SpaceType,
} from "../../../types";

const props = defineProps<Partial<PrivateEvent>>();
const linkProps = useLinkProps();
const { locale } = useI18n();

// === Nền: 3 dạng default | color | image (logic dùng chung: useBackground) ===
const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background);

// Danh sách không gian nằm ở collection riêng (`/api/event-venues`), không
// nhúng trong block nên component tự fetch (cùng lối với ClubEvent). Key theo
// locale ⇒ đổi ngôn ngữ là refetch, dữ liệu 2 ngôn ngữ không trộn vào nhau.
const { data: venuesRes } = await useAsyncData(
  () => `event-venues-${locale.value}`,
  () =>
    $fetch<EventVenuesResponse>("/api/event-venues", {
      query: { locale: locale.value },
    }),
);

const venues = computed(() => venuesRes.value?.venues ?? []);

// Lọc theo loại không gian (1 lựa chọn), sau đó chọn không gian cụ thể bằng chip
const typeOptions = computed<{ value: "all" | SpaceType; label: string }[]>(
  () =>
    locale.value === "vi"
      ? [
          { value: "all", label: "Tất cả không gian" },
          { value: "indoor", label: "Trong nhà" },
          { value: "outdoor", label: "Ngoài trời" },
        ]
      : [
          { value: "all", label: "All spaces" },
          { value: "indoor", label: "Indoor" },
          { value: "outdoor", label: "Outdoor" },
        ],
);

const typeFilter = ref<"all" | SpaceType>("all");
const activeId = ref<number | null>(null);

const filteredVenues = computed(() =>
  typeFilter.value === "all"
    ? venues.value
    : venues.value.filter((v) => v.spaceType === typeFilter.value),
);

// Lọc làm không gian đang chọn biến mất thì rơi về không gian đầu tiên
const activeVenue = computed<EventVenue | null>(
  () =>
    filteredVenues.value.find((v) => v.id === activeId.value) ??
    filteredVenues.value[0] ??
    null,
);

function typeLabel(type: SpaceType) {
  if (locale.value === "vi") {
    return type === "outdoor" ? "Ngoài trời" : "Trong nhà";
  }

  return type === "outdoor" ? "Outdoor" : "Indoor";
}

const spacesCountLabel = computed(() => {
  const count = filteredVenues.value.length;
  if (locale.value === "vi") return `${count} không gian`;

  return `${count} ${count === 1 ? "space" : "spaces"}`;
});

// Nhãn số liệu ưu tiên bản CMS nhập; CMS để trống thì dùng bản dự phòng
const areaLabel = computed(
  () =>
    activeVenue.value?.areaLabel ||
    (locale.value === "vi" ? "Diện tích" : "Area"),
);
const capacityLabel = computed(
  () =>
    activeVenue.value?.capacityLabel ||
    (locale.value === "vi" ? "Sức chứa tối đa" : "Guests, up to"),
);

const typeGroupLabel = computed(() =>
  locale.value === "vi" ? "Loại không gian" : "Space type",
);
const venueGroupLabel = computed(() =>
  locale.value === "vi" ? "Chọn không gian" : "Choose a space",
);
const emptyLabel = computed(() =>
  locale.value === "vi"
    ? "Không có không gian phù hợp."
    : "No spaces match this filter.",
);

const hasArea = computed(() => activeVenue.value?.area != null);
const hasCapacity = computed(() => activeVenue.value?.capacity != null);
</script>

<template>
  <section
    class="private-event"
    :class="onDark ? 'private-event--dark' : 'private-event--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="left" />

    <div class="private-event-inner">
      <!-- Đầu mục: eyebrow → (heading + description cùng hàng từ lg) →
           spaces nằm ngay dưới description -->
      <div class="private-event-head">
        <p v-if="props.eyebrow" class="private-event-eyebrow">
          {{ props.eyebrow }}
        </p>
        <div class="private-event-head-row">
          <h2 v-if="props.heading" class="private-event-heading">
            {{ props.heading }}
          </h2>
          <p v-if="props.description" class="private-event-text">
            {{ props.description }}
          </p>
        </div>
      </div>

      <!-- Không gian: panel sáng nổi trên nền block để phần này là tâm điểm -->
      <div v-if="venues.length" class="private-event-spaces">
        <div class="private-event-spaces-top">
          <div
            class="private-event-types"
            role="group"
            :aria-label="typeGroupLabel"
          >
            <button
              v-for="option in typeOptions"
              :key="option.value"
              type="button"
              class="private-event-tab"
              :class="{ 'private-event-tab--on': typeFilter === option.value }"
              :aria-pressed="typeFilter === option.value"
              @click="typeFilter = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <p class="private-event-count" aria-live="polite">
            {{ spacesCountLabel }}
          </p>
        </div>

        <div
          class="private-event-chips"
          role="group"
          :aria-label="venueGroupLabel"
        >
          <button
            v-for="venue in filteredVenues"
            :key="venue.id"
            type="button"
            class="private-event-chip"
            :class="{ 'private-event-chip--on': activeVenue?.id === venue.id }"
            :aria-pressed="activeVenue?.id === venue.id"
            @click="activeId = venue.id"
          >
            {{ venue.name }}
          </button>
        </div>

        <div
          v-if="activeVenue"
          :key="activeVenue.id"
          class="private-event-space fade"
        >
          <div v-if="activeVenue.photos.length" class="private-event-media">
            <Gallery
              :images="activeVenue.photos"
              :alt="activeVenue.name"
              :label="activeVenue.name"
            />
          </div>

          <div
            class="private-event-info"
            :class="{ 'private-event-info--full': !activeVenue.photos.length }"
          >
            <h3 class="private-event-space-name">{{ activeVenue.name }}</h3>
            <span class="private-event-badge">
              {{ typeLabel(activeVenue.spaceType) }}
            </span>
            <p v-if="activeVenue.description" class="private-event-space-text">
              {{ activeVenue.description }}
            </p>

            <dl v-if="hasArea || hasCapacity" class="private-event-stats">
              <div v-if="hasArea" class="private-event-stat">
                <dt>{{ areaLabel }}</dt>
                <dd>{{ activeVenue.area }} m²</dd>
              </div>
              <div v-if="hasCapacity" class="private-event-stat">
                <dt>{{ capacityLabel }}</dt>
                <dd>{{ activeVenue.capacity }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <p v-else class="private-event-empty">{{ emptyLabel }}</p>
      </div>

      <!-- CTA: sau phần không gian như yêu cầu; nút đặc + link gạch chân -->
      <div
        v-if="props.primaryCta?.label || props.secondaryCta?.label"
        class="private-event-actions"
      >
        <NuxtLink
          v-if="props.primaryCta?.label"
          class="private-event-cta private-event-cta--primary"
          v-bind="linkProps(props.primaryCta)"
        >
          {{ props.primaryCta.label }}
          <svg
            class="private-event-cta-arrow"
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
          class="private-event-cta private-event-cta--secondary"
          v-bind="linkProps(props.secondaryCta)"
        >
          {{ props.secondaryCta.label }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung === */
.private-event {
  @apply relative overflow-hidden py-20 sm:py-24 xl:py-10;
}
.private-event--light {
  @apply bg-cream text-dark;
}
.private-event--dark {
  @apply bg-dark text-cream;
}
/* Rộng hơn max-w-content (1280) để bớt khoảng trống 2 bên trên màn hình lớn;
   1600 vẫn giữ panel cách mép viewport một khoảng an toàn. */
.private-event-inner {
  @apply relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-6 sm:px-10 lg:gap-14 xl:px-16;
}

/* === Đầu mục === */
.private-event-head {
  @apply flex flex-col gap-4;
}
/* Từ lg: heading 7 cột, description 5 cột liền kề để không có khoảng trống */
.private-event-head-row {
  @apply flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8;
}
.private-event-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
/* heading: 52px như design drop; clamp để giữ leading khi lên breakpoint */
.private-event-heading {
  @apply font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-light leading-[1.12] tracking-[-0.005em] lg:col-span-7;
}
.private-event-text {
  @apply max-w-[56ch] text-[19px] leading-[1.6] lg:col-span-5 lg:col-start-8;
}

/* === Panel không gian: luôn nền sáng như card của Tier để nổi bật === */
.private-event-spaces {
  @apply flex flex-col gap-5 border border-warm-600 bg-warm-100 p-4 text-dark shadow-card sm:p-6 lg:gap-6 lg:p-8;
}
.private-event-spaces-top {
  @apply flex flex-wrap items-center justify-between gap-3;
}
.private-event-types {
  @apply flex flex-wrap items-center gap-2;
}
.private-event-tab {
  @apply inline-flex h-10 items-center border border-warm-600 px-[18px] text-sm tracking-wide text-warm-900 transition-colors hover:border-primary hover:text-primary;
}
.private-event-tab--on {
  @apply border-primary bg-primary text-cream hover:text-cream;
}
.private-event-count {
  @apply text-[11px] uppercase tracking-widest text-muted tabular-nums;
}

/* Chips: xuống hàng trên mobile để thấy đủ danh sách không gian */
.private-event-chips {
  @apply flex flex-wrap gap-2;
}
.private-event-chip {
  @apply inline-flex h-10 items-center whitespace-nowrap border border-warm-600 px-[18px] text-sm tracking-wide text-warm-900 transition-colors hover:border-primary hover:text-primary;
}
.private-event-chip--on {
  @apply border-primary bg-warm-50 text-dark hover:text-dark;
}
.private-event-empty {
  @apply py-2 text-[17px] text-warm-900;
}

/* === Chi tiết không gian: 1 cột mobile → media 7 / info 5 từ lg === */
.private-event-space {
  @apply grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10;
}
.private-event-media {
  @apply lg:col-span-7;
}
.private-event-info {
  @apply flex flex-col items-start gap-4 lg:col-span-5;
}
.private-event-info--full {
  @apply lg:col-span-12;
}
.private-event-space-name {
  @apply font-serif text-[clamp(1.75rem,2.4vw,2.25rem)] font-normal leading-[1.15] text-dark;
}
.private-event-badge {
  @apply inline-flex items-center border border-warm-600 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-muted;
}
.private-event-space-text {
  @apply max-w-[42ch] text-[17px] leading-[1.6] text-warm-900;
}

/* Số liệu: đường kẻ trên + 2 cột, số lớn màu nâu như design */
.private-event-stats {
  @apply mt-2 grid w-full grid-cols-2 gap-x-6 gap-y-4 border-t border-warm-600 pt-5 lg:mt-auto;
}
.private-event-stat {
  @apply flex flex-col gap-1.5;
}
.private-event-stat dt {
  @apply text-[11px] uppercase tracking-widest text-muted;
}
.private-event-stat dd {
  @apply font-sans text-[clamp(1.5rem,2vw,2rem)] font-light leading-none text-primary tabular-nums;
}

/* === CTA: nút đặc 48px + link gạch chân 36px như design === */
.private-event-actions {
  @apply flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-4;
}
.private-event-cta {
  @apply inline-flex items-center gap-2.5 text-[15px] font-medium tracking-wide;
}
.private-event-cta--primary {
  @apply h-12 px-[26px];
}
.private-event-cta--secondary {
  @apply min-h-9 border-b border-current px-1 py-1;
}
.private-event-cta-arrow {
  @apply h-4 w-4 transition-transform duration-300;
}
.private-event-cta:hover .private-event-cta-arrow {
  @apply translate-x-1;
}

/* === Màu chữ theo tone nền (panel không gian giữ nền sáng riêng) === */
.private-event--light .private-event-eyebrow {
  @apply text-primary-hover;
}
.private-event--light .private-event-heading {
  @apply text-dark;
}
.private-event--light .private-event-text {
  @apply text-warm-900;
}
.private-event--dark .private-event-eyebrow {
  @apply text-warm-500;
}
.private-event--dark .private-event-heading {
  @apply text-cream;
}
.private-event--dark .private-event-text {
  @apply text-warm-400;
}
.private-event--light .private-event-cta--primary {
  @apply bg-primary text-cream hover:bg-primary-hover hover:text-cream;
}
.private-event--dark .private-event-cta--primary {
  @apply bg-cream text-dark hover:bg-warm-400 hover:text-dark;
}
.private-event--light .private-event-cta--secondary {
  @apply text-primary-hover hover:text-primary;
}
.private-event--dark .private-event-cta--secondary {
  @apply text-cream hover:text-warm-400;
}
</style>
