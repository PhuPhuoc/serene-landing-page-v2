<script setup lang="ts">
import BlockBackground from "~/components/blocks/BlockBackground.vue";
import Gallery from "~/components/Gallery.vue";
import { type ArtAndCulture } from "../../../types";

const props = defineProps<Partial<ArtAndCulture>>();

const { locale } = useI18n();
const isVi = computed(() => locale.value === "vi");

// === Nền: default | color | image (logic dùng chung: useBackground) ===
// `default` giữ nguyên nền mặc định của block (kem) như các block khác; tone
// chữ chỉ đổi khi CMS cấu hình màu đậm hoặc ảnh nền.
const {
  image: bgImage,
  onDark,
  style: bgStyle,
} = useBackground(() => props.background);

const exhibition = computed(() => props.exhibition ?? null);
const images = computed(() =>
  (exhibition.value?.coverImage ?? []).filter((m) => !!m?.url),
);

// CMS đang để trống eyebrow (field `eyebrow` chưa có dữ liệu) thì dùng nhãn
// dựng sẵn theo ngôn ngữ để khối vẫn giữ đúng nhịp của design.
const eyebrow = computed(
  () =>
    props.eyebrow ||
    (isVi.value
      ? "Đang trưng bày tại The Salon"
      : "On view at the Salon"),
);

// Chú thích ảnh nằm trong khung, cùng lối với các block ảnh khác.
const photoCaption = computed(() =>
  isVi.value
    ? "Ảnh · Tác phẩm · Triển lãm hiện tại"
    : "Photo · Artwork · Current exhibition",
);

// Ngày từ CMS là "YYYY-MM-DD"; cố định múi giờ VN để server/client format
// giống nhau (tránh lệch hydration) và không lùi ngày khi đổi múi giờ.
const dateFormatter = computed(
  () =>
    new Intl.DateTimeFormat(isVi.value ? "vi-VN" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }),
);
const shortDateFormatter = computed(
  () =>
    new Intl.DateTimeFormat(isVi.value ? "vi-VN" : "en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }),
);

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "19 Oct – 30 Oct 2026" (en) / "19 thg 10 – 30 thg 10, 2026" (vi);
// khác năm thì hiện đủ năm ở cả hai đầu.
const dateRange = computed(() => {
  const start = toDate(exhibition.value?.startDate);
  const end = toDate(exhibition.value?.endDate);

  if (!start && !end) return "";
  if (!start) return dateFormatter.value.format(end!);
  if (!end) return dateFormatter.value.format(start);

  if (start.getFullYear() === end.getFullYear()) {
    return `${shortDateFormatter.value.format(start)} – ${dateFormatter.value.format(end)}`;
  }

  return `${dateFormatter.value.format(start)} – ${dateFormatter.value.format(end)}`;
});

const metaLine = computed(() => {
  const artist = exhibition.value?.artistName?.trim();
  return [artist, dateRange.value].filter(Boolean).join(" · ");
});

// CTA chính (trong exhibition) + CTA phụ (block) — ẩn từng nút nếu CMS để trống
const hasCtas = computed(
  () => !!exhibition.value?.cta?.label || !!props.cta?.label,
);
</script>

<template>
  <section
    v-if="exhibition"
    class="aac"
    :class="onDark ? 'aac--dark' : 'aac--light'"
    :style="bgStyle"
  >
    <BlockBackground :image="bgImage" dark-side="right" />

    <div class="aac-inner">
      <div class="aac-grid">
        <!-- Ảnh: khung mảnh lệch lên trên-trái; ảnh thật do Gallery quản lý
             (bento: phủ kín khung, bấm mở slideshow, ẩn dải thumbnail) -->
        <figure class="aac-media fade">
          <span class="aac-frame" aria-hidden="true" />

          <div class="aac-gallery">
            <Gallery
              v-if="images.length"
              :images="images"
              :alt="exhibition.title"
              :label="exhibition.title"
              variant="bento"
            />
            <!-- Chưa có ảnh: nền nâu + sọc chéo như các block khác -->
            <div v-else class="aac-placeholder" aria-hidden="true" />
          </div>

          <template v-if="images.length">
            <span class="aac-scrim" aria-hidden="true" />
            <figcaption class="aac-caption">
              <svg
                class="aac-caption-icon"
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
              <span>{{ photoCaption }}</span>
            </figcaption>
          </template>
        </figure>

        <!-- Cột chữ: eyebrow → tên triển lãm → nghệ sĩ · thời gian →
             ghi chú giám tuyển → đường kẻ → mô tả → đường kẻ → CTA -->
        <div class="aac-content fade">
          <p class="aac-eyebrow">{{ eyebrow }}</p>
          <h2 class="aac-title">{{ exhibition.title }}</h2>
          <p v-if="metaLine" class="aac-meta">{{ metaLine }}</p>

          <p v-if="exhibition.curatorialNote" class="aac-note">
            {{ exhibition.curatorialNote }}
          </p>

          <template v-if="exhibition.description">
            <hr class="aac-rule" />
            <p class="aac-desc">{{ exhibition.description }}</p>
          </template>

          <template v-if="hasCtas">
            <hr class="aac-rule" />
            <div class="aac-actions">
              <CtaLink
                v-if="exhibition.cta?.label"
                :link="exhibition.cta"
                size="md"
                :tone="onDark ? 'dark' : 'light'"
              />
              <CtaLink
                v-if="props.cta?.label"
                :link="props.cta"
                size="md"
                :tone="onDark ? 'dark' : 'light'"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung === */
/* Đáy rộng hơn đỉnh để block tách hẳn khỏi footer phía dưới */
.aac {
  @apply relative overflow-hidden pb-24 pt-12 sm:pb-28 sm:pt-16 lg:pb-32 lg:pt-20;
}
/* Nền mặc định (config `default`) = kem như các block khác; nền màu do CMS cấp qua :style */
.aac--light {
  @apply bg-cream text-dark;
}
.aac--dark {
  @apply bg-dark text-cream;
}
.aac-inner {
  @apply relative z-10 mx-auto w-full max-w-container px-6 sm:px-10 xl:px-16;
}
/* Mobile: ảnh rồi tới chữ; từ lg: ảnh 7/12 cột, chữ 5/12 bắt đầu ở cột 8
   để cột chữ rộng hơn, ít xuống dòng hơn */
.aac-grid {
  @apply flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8;
}

/* === Ảnh + khung lệch === */
.aac-media {
  @apply relative lg:col-span-7 lg:col-start-1;
}
/* Khung chỉ lộ phần trên-trái vì ảnh phủ lên phần còn lại */
.aac-frame {
  @apply pointer-events-none absolute -left-4 -top-4 z-0 h-[68%] w-[62%] border border-current opacity-25 sm:-left-6 sm:-top-6;
}
.aac-gallery {
  @apply relative z-[1] aspect-square w-full overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:h-[600px];
}
/* Gallery bento phủ kín khung; placeholder khi CMS chưa có ảnh */
.aac-placeholder {
  @apply absolute inset-0 bg-warm-500;
  background-image: repeating-linear-gradient(
    135deg,
    rgb(121 91 60 / 0.07) 0 1px,
    transparent 1px 14px
  );
}
.aac-scrim {
  @apply pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-t from-dark/65 to-transparent;
}
.aac-caption {
  @apply pointer-events-none absolute bottom-4 left-4 z-[3] flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-cream;
}
.aac-caption-icon {
  @apply h-3.5 w-3.5 shrink-0;
}

/* === Cột chữ === */
.aac-content {
  @apply flex flex-col lg:col-span-5 lg:col-start-8 lg:pt-32;
}
.aac-eyebrow {
  @apply text-xs font-medium uppercase tracking-label;
}
.aac-title {
  @apply mt-3 font-serif text-[clamp(2.5rem,4.4vw,3.5rem)] font-light leading-[1.08] tracking-[-0.005em];
}
.aac-meta {
  @apply mt-4 text-sm;
}
.aac-note {
  @apply mt-6 text-sm leading-[1.65];
}
.aac-rule {
  @apply mt-6 w-full border-0 border-t;
}
.aac-desc {
  @apply mt-5 text-sm leading-[1.65];
}
.aac-actions {
  @apply mt-6 flex flex-wrap items-center gap-x-8 gap-y-4;
}

/* === Màu theo tone nền === */
.aac--light .aac-eyebrow {
  @apply text-primary;
}
.aac--light .aac-title,
.aac--light .aac-meta {
  @apply text-dark;
}
.aac--light .aac-note,
.aac--light .aac-desc {
  @apply text-warm-900;
}
.aac--light .aac-rule {
  @apply border-dark/15;
}

.aac--dark .aac-eyebrow {
  @apply text-primary-hover;
}
.aac--dark .aac-title,
.aac--dark .aac-meta {
  @apply text-cream;
}
.aac--dark .aac-note,
.aac--dark .aac-desc {
  @apply text-warm-400;
}
.aac--dark .aac-rule {
  @apply border-cream/20;
}
</style>
