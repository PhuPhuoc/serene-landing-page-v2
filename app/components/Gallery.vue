<script setup lang="ts">
import { type Media } from "../../types";

// Gallery dùng chung cho block: ảnh lớn + dải thumbnail + modal slideshow.
// Mobile-first: ảnh lớn giữ tỉ lệ cố định, thumbnail 3 cột; modal chiếm toàn
// màn hình và điều hướng được bằng bàn phím (←/→/Esc).
const props = withDefaults(
  defineProps<{
    images?: Media[];
    // Alt dự phòng khi CMS chưa nhập alternativeText (vd: tên không gian)
    alt?: string;
    // Nhãn của dialog (vd: tên không gian)
    label?: string;
  }>(),
  { images: () => [], alt: "", label: "" },
);

const { locale } = useI18n();
const isVi = computed(() => locale.value === "vi");

const images = computed(() => (props.images ?? []).filter((i) => !!i?.url));
const count = computed(() => images.value.length);
const index = ref(0);
const current = computed(() => images.value[index.value] ?? null);
const currentAlt = computed(() => current.value?.alt || props.alt);

const open = ref(false);
const dialogRef = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);
const lastFocused = shallowRef<HTMLElement | null>(null);

// Chọn bộ ảnh khác (đổi không gian) ⇒ về ảnh đầu và đóng modal đang mở
watch(
  () => props.images,
  () => {
    index.value = 0;
    open.value = false;
  },
);

// Khoá scroll body khi mở modal; trả lại đúng giá trị cũ khi đóng/unmount
let previousOverflow = "";
let locked = false;
let appRoot: HTMLElement | null = null;

const openLabel = computed(() =>
  isVi.value
    ? `Xem ảnh ${index.value + 1}/${count.value} toàn màn hình`
    : `View photo ${index.value + 1} of ${count.value} full screen`,
);
const prevLabel = computed(() => (isVi.value ? "Ảnh trước" : "Previous photo"));
const nextLabel = computed(() => (isVi.value ? "Ảnh sau" : "Next photo"));
const closeLabel = computed(() => (isVi.value ? "Đóng" : "Close"));
const galleryLabel = computed(
  () => props.label || (isVi.value ? "Thư viện ảnh" : "Photo gallery"),
);

function thumbLabel(i: number) {
  return isVi.value ? `Xem ảnh ${i + 1}` : `Show photo ${i + 1}`;
}

// Đi vòng khi tới đầu/cuối (chỉ áp dụng khi có từ 2 ảnh)
function go(step: number) {
  if (count.value < 2) return;
  index.value = (index.value + step + count.value) % count.value;
}

function goTo(i: number) {
  index.value = i;
}

function openViewer() {
  if (!count.value) return;
  open.value = true;
}

function closeViewer() {
  open.value = false;
}

// Giữ focus trong dialog: Tab ở phần tử cuối quay về đầu và ngược lại
function trapFocus(e: KeyboardEvent) {
  const root = dialogRef.value;
  if (!root) return;

  const items = root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  );
  if (!items.length) {
    e.preventDefault();
    return;
  }

  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) {
    e.preventDefault();
    return;
  }
  const active = document.activeElement;

  if (e.shiftKey && (active === first || !root.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !root.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return;

  if (e.key === "Escape") {
    e.preventDefault();
    closeViewer();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    go(-1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    go(1);
  } else if (e.key === "Tab") {
    trapFocus(e);
  }
}

watch(open, async (isOpen) => {
  if (typeof document === "undefined") return;

  if (isOpen) {
    lastFocused.value = document.activeElement as HTMLElement | null;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Modal nằm trong Teleport (ngoài #__nuxt) nên chặn tương tác nền bằng inert
    appRoot = document.getElementById("__nuxt");
    appRoot?.setAttribute("inert", "");
    locked = true;
    window.addEventListener("keydown", onKeydown);

    await nextTick();
    closeBtn.value?.focus();

    return;
  }

  window.removeEventListener("keydown", onKeydown);
  appRoot?.removeAttribute("inert");
  appRoot = null;
  if (locked) {
    document.body.style.overflow = previousOverflow;
    locked = false;
  }

  // Chờ modal rời DOM rồi trả focus về nút đã mở nó
  const target = lastFocused.value;
  lastFocused.value = null;
  await nextTick();
  target?.focus();
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;

  window.removeEventListener("keydown", onKeydown);
  appRoot?.removeAttribute("inert");
  if (locked) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <div v-if="count" class="gallery">
    <!-- Ảnh lớn: bấm vào mở slideshow; mũi tên đổi ảnh ngay tại chỗ -->
    <div class="gallery-main">
      <button
        type="button"
        class="gallery-open"
        :aria-label="openLabel"
        @click="openViewer"
      >
        <img
          v-if="current"
          class="gallery-img"
          :src="current.url"
          :alt="currentAlt"
          decoding="async"
        />
      </button>

      <button
        v-if="count > 1"
        type="button"
        class="gallery-nav gallery-nav--prev"
        :aria-label="prevLabel"
        @click="go(-1)"
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
      <button
        v-if="count > 1"
        type="button"
        class="gallery-nav gallery-nav--next"
        :aria-label="nextLabel"
        @click="go(1)"
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

      <span v-if="count > 1" class="gallery-counter" aria-live="polite">
        {{ index + 1 }} / {{ count }}
      </span>
    </div>

    <!-- Thumbnail: 3 cột như design drop; nhiều ảnh hơn thì xuống hàng -->
    <div v-if="count > 1" class="gallery-thumbs">
      <button
        v-for="(image, i) in images"
        :key="`${image.url}-${i}`"
        type="button"
        class="gallery-thumb"
        :class="{ 'gallery-thumb--on': i === index }"
        :aria-label="thumbLabel(i)"
        :aria-pressed="i === index"
        @click="goTo(i)"
      >
        <img :src="image.url" alt="" loading="lazy" decoding="async" />
      </button>
    </div>

    <!-- Slideshow toàn màn hình -->
    <Teleport to="body">
      <Transition name="gallery-modal">
        <div
          v-if="open"
          ref="dialogRef"
          class="gallery-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="galleryLabel"
        >
          <div class="gallery-modal-backdrop" @click="closeViewer" />

          <div class="gallery-modal-inner" @click.self="closeViewer">
            <div class="gallery-modal-bar">
              <span class="gallery-modal-counter" aria-live="polite">
                {{ index + 1 }} / {{ count }}
              </span>
              <button
                ref="closeBtn"
                type="button"
                class="gallery-modal-icon"
                :aria-label="closeLabel"
                @click="closeViewer"
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
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div class="gallery-modal-stage" @click.self="closeViewer">
              <img
                v-if="current"
                class="gallery-modal-img"
                :src="current.url"
                :alt="currentAlt"
                decoding="async"
              />

              <button
                v-if="count > 1"
                type="button"
                class="gallery-modal-nav gallery-modal-nav--prev"
                :aria-label="prevLabel"
                @click="go(-1)"
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
              <button
                v-if="count > 1"
                type="button"
                class="gallery-modal-nav gallery-modal-nav--next"
                :aria-label="nextLabel"
                @click="go(1)"
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
            </div>

            <div v-if="count > 1" class="gallery-modal-thumbs">
              <button
                v-for="(image, i) in images"
                :key="`modal-${image.url}-${i}`"
                type="button"
                class="gallery-modal-thumb"
                :class="{ 'gallery-modal-thumb--on': i === index }"
                :aria-label="thumbLabel(i)"
                :aria-pressed="i === index"
                @click="goTo(i)"
              >
                <img :src="image.url" alt="" loading="lazy" decoding="async" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* === Ảnh lớn === */
.gallery-main {
  @apply relative aspect-[5/4] overflow-hidden border border-warm-600 bg-warm-300;
}
.gallery-open {
  @apply block h-full w-full cursor-zoom-in;
}
.gallery-img {
  @apply h-full w-full object-cover transition-transform duration-500;
}
.gallery-open:hover .gallery-img {
  @apply scale-[1.02];
}
.gallery-nav {
  @apply absolute top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-warm-600 bg-warm-50/95 text-dark transition-colors hover:bg-warm-50;
}
.gallery-nav svg {
  @apply h-5 w-5;
}
.gallery-nav--prev {
  @apply left-3;
}
.gallery-nav--next {
  @apply right-3;
}
.gallery-counter {
  @apply pointer-events-none absolute bottom-3 right-3 bg-dark/70 px-2 py-1 text-[12px] tracking-[0.08em] text-cream tabular-nums;
}

/* === Thumbnail === */
.gallery-thumbs {
  @apply mt-2 grid grid-cols-3 gap-2;
}
.gallery-thumb {
  @apply aspect-[4/3] overflow-hidden border border-warm-600 bg-warm-300 opacity-60 transition-opacity hover:opacity-100;
}
.gallery-thumb--on {
  @apply border-primary opacity-100;
}
.gallery-thumb img {
  @apply h-full w-full object-cover;
}

/* === Modal slideshow === */
.gallery-modal {
  @apply fixed inset-0 z-[100] flex items-stretch justify-center;
}
.gallery-modal-backdrop {
  @apply absolute inset-0 bg-dark;
}
.gallery-modal-inner {
  @apply relative z-10 flex h-full w-full max-w-container flex-col px-3 pb-3 pt-3 text-cream sm:px-8 sm:pb-6;
}
.gallery-modal-bar {
  @apply flex h-12 shrink-0 items-center justify-between;
}
.gallery-modal-counter {
  @apply text-[13px] uppercase tracking-widest text-warm-400 tabular-nums;
}
.gallery-modal-icon {
  @apply inline-flex h-11 w-11 items-center justify-center border border-cream/30 text-cream transition-colors hover:border-cream hover:bg-cream hover:text-dark;
}
.gallery-modal-icon svg {
  @apply h-5 w-5;
}
.gallery-modal-stage {
  @apply relative flex min-h-0 flex-1 items-center justify-center;
}
.gallery-modal-img {
  @apply max-h-full max-w-full object-contain;
}
.gallery-modal-nav {
  @apply absolute top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-dark transition-colors hover:bg-cream;
}
.gallery-modal-nav svg {
  @apply h-5 w-5;
}
.gallery-modal-nav--prev {
  @apply left-1 sm:left-4;
}
.gallery-modal-nav--next {
  @apply right-1 sm:right-4;
}
.gallery-modal-thumbs {
  @apply flex shrink-0 items-center justify-start gap-2 overflow-x-auto pt-3 sm:justify-center;
  scrollbar-width: none;
}
.gallery-modal-thumbs::-webkit-scrollbar {
  display: none;
}
.gallery-modal-thumb {
  @apply h-14 w-20 shrink-0 overflow-hidden border border-cream/25 opacity-60 transition-opacity hover:opacity-100;
}
.gallery-modal-thumb--on {
  @apply border-cream opacity-100;
}
.gallery-modal-thumb img {
  @apply h-full w-full object-cover;
}

/* === Transition mở/đóng modal === */
.gallery-modal-enter-active,
.gallery-modal-leave-active {
  transition: opacity 220ms ease;
}
.gallery-modal-enter-from,
.gallery-modal-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .gallery-modal-enter-active,
  .gallery-modal-leave-active {
    transition: none;
  }
}
</style>
