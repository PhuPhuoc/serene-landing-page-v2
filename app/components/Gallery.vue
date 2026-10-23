<script setup lang="ts">
import { type Media } from "../../types";

// Gallery dùng chung cho block: ảnh lớn + dải thumbnail + modal slideshow.
// Desktop: mosaic ảnh theo tỉ lệ; mobile: carousel scroll-snap. Bấm một ảnh
// trong modal để mở viewer full màn hình; điều hướng bằng ←/→/Esc.
const props = withDefaults(
  defineProps<{
    images?: Media[];
    // Alt dự phòng khi CMS chưa nhập alternativeText (vd: tên không gian)
    alt?: string;
    // Nhãn của dialog (vd: tên không gian)
    label?: string;
    // "bento": ảnh phủ kín khung, ẩn thumbnail/mũi tên và hiện badge +N
    variant?: "default" | "bento";
    // Tự chuyển ảnh; component cha có thể tắt (vd: khi mở modal)
    autoplay?: boolean;
    // Thời gian giữ mỗi ảnh (ms) trước khi tự chuyển; mặc định 6s cho mọi
    // nơi dùng Gallery, block có thể truyền giá trị riêng nếu cần.
    interval?: number;
  }>(),
  {
    images: () => [],
    alt: "",
    label: "",
    variant: "default",
    autoplay: true,
    interval: 6000,
  },
);

const { locale } = useI18n();
const isVi = computed(() => locale.value === "vi");

const images = computed(() => (props.images ?? []).filter((i) => !!i?.url));
const open = ref(false);
const fullscreen = ref(false);

// Tạm dừng tự chuyển khi rê chuột, khi focus bàn phím nằm trong gallery, hoặc
// khi modal đang mở — tránh ảnh nhảy trong lúc người dùng đang xem.
const hovered = ref(false);
const focusWithin = ref(false);
const autoplay = computed(
  () => props.autoplay && !hovered.value && !focusWithin.value && !open.value,
);

const { index, count, current, go, goTo } = useGallery(images, {
  autoplay,
  interval: props.interval,
});
const currentAlt = computed(() => current.value?.alt || props.alt);

// Nạp trước ảnh kề để lúc tự chuyển ảnh không bị trống/giật do ảnh chưa tải.
const preloaded = new Set<string>();

function preload(url?: string | null) {
  if (!url || typeof window === "undefined" || preloaded.has(url)) return;
  preloaded.add(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

function preloadNeighbours() {
  const total = count.value;
  if (total < 2) return;

  preload(images.value[(index.value + 1) % total]?.url);
  preload(images.value[(index.value - 1 + total) % total]?.url);
}

onMounted(preloadNeighbours);
watch([index, images], preloadNeighbours);

const dialogRef = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);
const fullscreenCloseBtn = ref<HTMLButtonElement | null>(null);
const fullscreenTrigger = shallowRef<HTMLElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const lastFocused = shallowRef<HTMLElement | null>(null);

// Ảnh ngang chiếm cả hàng, ảnh dọc/vuông đứng cạnh nhau — mosaic theo tỉ lệ ảnh
function cellClass(image: Media) {
  const width = image.width ?? 0;
  const height = image.height ?? 0;
  return width > 0 && height > 0 && width / height >= 1.15
    ? "gallery-modal-cell--wide"
    : "";
}

let scrollTimer: number | null = null;
let scrollGuardUntil = 0;
let syncFromTrack = false;

const countLabel = computed(() =>
  isVi.value
    ? `${count.value} ảnh`
    : `${count.value} ${count.value === 1 ? "photo" : "photos"}`,
);

// Modal mobile: carousel lướt ngang bằng scroll-snap. Ảnh kề lộ ra một nửa ở
// hai bên; chỉ số được đồng bộ ngược lại để counter/thumbnail luôn đúng.
function slideOffset(i: number) {
  const track = trackRef.value;
  const slide = track?.children[i] as HTMLElement | undefined;
  if (!track || !slide) return 0;

  return (
    slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2
  );
}

function scrollToSlide(i: number, smooth = true) {
  const track = trackRef.value;
  if (!track || !track.clientWidth) return;

  scrollGuardUntil = performance.now() + (smooth ? 700 : 120);
  track.scrollTo({
    left: slideOffset(i),
    behavior: smooth ? "smooth" : "auto",
  });
}

function onTrackScroll() {
  if (scrollTimer !== null) window.clearTimeout(scrollTimer);

  scrollTimer = window.setTimeout(() => {
    scrollTimer = null;
    if (performance.now() < scrollGuardUntil) return;

    const track = trackRef.value;
    if (!track || !track.clientWidth) return;

    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;

    [...track.children].forEach((el, i) => {
      const slide = el as HTMLElement;
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const nextDistance = Math.abs(slideCenter - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = i;
      }
    });

    if (nearest !== index.value) {
      syncFromTrack = true;
      index.value = nearest;
    }
  }, 80);
}

watch(index, (i) => {
  if (syncFromTrack) {
    syncFromTrack = false;
    return;
  }
  if (open.value) scrollToSlide(i);
});

// Bộ ảnh đổi (đổi không gian) ⇒ đóng modal; useGallery tự về ảnh đầu
watch(
  () => props.images,
  () => {
    fullscreen.value = false;
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

function openViewer() {
  if (!count.value) return;
  open.value = true;
}

function openFullscreen(i: number) {
  fullscreenTrigger.value = document.activeElement as HTMLElement | null;
  if (i !== index.value) goTo(i);
  fullscreen.value = true;
}

function closeFullscreen() {
  fullscreen.value = false;
}

function closeViewer() {
  fullscreen.value = false;
  open.value = false;
}

// Giữ focus trong dialog: Tab ở phần tử cuối quay về đầu và ngược lại
function trapFocus(e: KeyboardEvent) {
  const root = dialogRef.value;
  if (!root) return;

  const scope = fullscreen.value
    ? root.querySelector<HTMLElement>(".gallery-fullscreen")
    : root;
  const items = (scope ?? root).querySelectorAll<HTMLElement>(
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
    if (fullscreen.value) closeFullscreen();
    else closeViewer();
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

watch(fullscreen, async (isFullscreen) => {
  if (typeof document === "undefined") return;

  if (isFullscreen) {
    await nextTick();
    fullscreenCloseBtn.value?.focus();
    return;
  }

  if (!open.value) return;

  const target = fullscreenTrigger.value;
  fullscreenTrigger.value = null;
  await nextTick();
  target?.focus();
});

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
    scrollToSlide(index.value, false);

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

  if (scrollTimer !== null) window.clearTimeout(scrollTimer);
  window.removeEventListener("keydown", onKeydown);
  appRoot?.removeAttribute("inert");
  if (locked) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <div
    v-if="count"
    class="gallery"
    :class="{ 'gallery--bento': variant === 'bento' }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focusWithin = true"
    @focusout="focusWithin = false"
  >
    <!-- Ảnh lớn: bấm vào mở slideshow; mũi tên đổi ảnh ngay tại chỗ -->
    <div class="gallery-main">
      <button
        type="button"
        class="gallery-open"
        :aria-label="openLabel"
        @click="openViewer"
      >
        <Transition name="gallery-fade">
          <img
            v-if="current"
            :key="current.url"
            class="gallery-img"
            :src="current.url"
            :alt="currentAlt"
            decoding="async"
          />
        </Transition>
      </button>

      <button
        v-if="count > 1 && variant !== 'bento'"
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
        v-if="count > 1 && variant !== 'bento'"
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

      <span
        v-if="count > 1 && variant !== 'bento'"
        class="gallery-counter"
        aria-live="polite"
      >
        {{ index + 1 }} / {{ count }}
      </span>

      <!-- Bento: badge +N (số ảnh còn lại) như design, ảnh vẫn bấm mở modal -->
      <span
        v-if="count > 1 && variant === 'bento'"
        class="gallery-badge"
        aria-hidden="true"
      >
        +{{ count - 1 }}
      </span>
    </div>

    <!-- Thumbnail: 3 cột như design drop; bento không hiện dải này -->
    <div v-if="count > 1 && variant !== 'bento'" class="gallery-thumbs">
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

          <div
            class="gallery-modal-inner"
            :inert="fullscreen"
            @click.self="closeViewer"
          >
            <div class="gallery-modal-bar">
              <span
                class="gallery-modal-counter md:hidden"
                aria-live="polite"
              >
                {{ index + 1 }} / {{ count }}
              </span>
              <span class="gallery-modal-counter hidden md:inline">
                {{ countLabel }}
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

            <!-- Web: mosaic theo tỉ lệ ảnh; bấm ảnh để xem full screen -->
            <div class="gallery-modal-grid">
              <button
                v-for="(image, i) in images"
                :key="`grid-${image.url}-${i}`"
                type="button"
                class="gallery-modal-cell"
                :class="cellClass(image)"
                :aria-label="thumbLabel(i)"
                @click="openFullscreen(i)"
              >
                <img
                  :src="image.url"
                  :alt="image.alt || props.alt"
                  :width="image.width"
                  :height="image.height"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </div>

            <!-- Mobile: một ảnh mỗi lần, lướt ngang; hai ảnh kề lộ nửa ở 2 bên -->
            <div class="gallery-modal-stage" @click.self="closeViewer">
              <div
                ref="trackRef"
                class="gallery-modal-track"
                @scroll.passive="onTrackScroll"
              >
                <button
                  v-for="(image, i) in images"
                  :key="`slide-${image.url}-${i}`"
                  type="button"
                  class="gallery-modal-slide"
                  :class="{ 'gallery-modal-slide--on': i === index }"
                  :aria-label="thumbLabel(i)"
                  @click="openFullscreen(i)"
                >
                  <img
                    :src="image.url"
                    :alt="image.alt || props.alt"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              </div>

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

          <!-- Xem một ảnh full màn hình; đóng để quay lại gallery -->
          <div
            v-if="fullscreen"
            class="gallery-fullscreen"
            role="group"
            :aria-label="galleryLabel"
            @click.self="closeFullscreen"
          >
            <div class="gallery-fullscreen-bar">
              <span class="gallery-modal-counter" aria-live="polite">
                {{ index + 1 }} / {{ count }}
              </span>
              <button
                ref="fullscreenCloseBtn"
                type="button"
                class="gallery-modal-icon"
                :aria-label="closeLabel"
                @click="closeFullscreen"
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

            <div
              class="gallery-fullscreen-frame"
              @click.self="closeFullscreen"
            >
              <Transition name="gallery-fade">
                <img
                  v-if="current"
                  :key="`full-${current.url}`"
                  class="gallery-fullscreen-img"
                  :src="current.url"
                  :alt="currentAlt"
                  decoding="async"
                  @click="closeFullscreen"
                />
              </Transition>
            </div>

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
  @apply absolute inset-0 h-full w-full object-cover transition-transform duration-500;
}
.gallery-open:hover .gallery-img {
  @apply scale-[1.02];
}
/* Crossfade: ảnh mới hiện dần đè lên ảnh cũ, không có khoảng trống giữa 2 ảnh */
.gallery-fade-enter-active,
.gallery-fade-leave-active {
  transition: opacity 650ms ease;
}
.gallery-fade-enter-from,
.gallery-fade-leave-to {
  opacity: 0;
}
.gallery-fade-enter-active {
  z-index: 1;
}
.gallery-fade-leave-active {
  z-index: 0;
}
.gallery-nav {
  @apply absolute top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-warm-600 bg-warm-50/95 text-dark transition-colors hover:bg-warm-50;
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
  @apply pointer-events-none absolute bottom-3 right-3 z-10 bg-dark/70 px-2 py-1 text-[12px] tracking-[0.08em] text-cream tabular-nums;
}

/* === Bento: ảnh phủ kín khung, không nav/thumbnail/counter === */
.gallery--bento {
  @apply h-full;
}
.gallery--bento .gallery-main {
  @apply h-full border-0 bg-transparent;
  aspect-ratio: auto;
}
.gallery--bento .gallery-open {
  @apply h-full w-full;
}
.gallery-badge {
  @apply pointer-events-none absolute right-[15px] top-[15px] z-10 flex h-[46px] min-w-[46px] items-center justify-center border border-cream/55 px-2 font-sans text-[17px] leading-none text-cream;
  background-color: rgb(42 50 39 / 0.86);
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
  @apply relative z-10 flex h-full w-full max-w-container flex-col px-3 pb-12 pt-3 text-cream sm:px-8 sm:pb-10;
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

/* Web: mosaic theo tỉ lệ ảnh — ngang chiếm cả hàng, dọc/vuông đứng cạnh nhau */
.gallery-modal-grid {
  @apply hidden min-h-0 flex-1 content-start items-start gap-3 overflow-y-auto pb-1 md:grid md:grid-cols-2 lg:gap-4;
  grid-auto-rows: max-content;
}
.gallery-modal-cell {
  @apply relative block w-full cursor-zoom-in overflow-hidden rounded-md border border-cream/20 bg-dark/40 p-0 transition-colors hover:border-cream/45;
}
.gallery-modal-cell--wide {
  grid-column: 1 / -1;
}
.gallery-modal-cell img {
  @apply block h-auto w-full object-contain;
}

/* Mobile: carousel một ảnh, ảnh kề lộ nửa hai bên, lướt bằng scroll-snap */
.gallery-modal-stage {
  @apply relative flex min-h-0 flex-1 items-center justify-center md:hidden;
}
.gallery-modal-track {
  @apply flex min-h-0 w-full flex-1 snap-x snap-mandatory items-center gap-3 overflow-x-auto overflow-y-hidden;
  padding-inline: 9%;
  scrollbar-width: none;
}
.gallery-modal-track::-webkit-scrollbar {
  display: none;
}
.gallery-modal-slide {
  @apply relative aspect-square shrink-0 cursor-zoom-in snap-center overflow-hidden rounded-md border border-cream/20 bg-dark/40 p-0 opacity-70 transition-[opacity,border-color] duration-300;
  flex-basis: 96%;
}
.gallery-modal-slide--on {
  @apply border-cream/60 opacity-100;
}
.gallery-modal-slide img {
  @apply h-full w-full object-contain;
}
.gallery-modal-nav {
  @apply absolute top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-cream transition-colors hover:text-warm-400;
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.55));
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

/* Xem một ảnh full màn hình, không còn card/carousel */
.gallery-fullscreen {
  @apply absolute inset-0 z-20 flex flex-col bg-dark text-cream;
}
.gallery-fullscreen-bar {
  @apply relative z-30 flex h-16 shrink-0 items-center justify-between px-4 sm:px-8;
}
.gallery-fullscreen-frame {
  @apply absolute inset-x-0 bottom-4 top-16 sm:inset-x-8 sm:bottom-8;
}
.gallery-fullscreen-img {
  @apply absolute inset-0 h-full w-full cursor-zoom-out object-contain;
}
.gallery-modal-thumbs {
  @apply flex shrink-0 items-center justify-center gap-2 overflow-x-auto px-1 pt-5 md:hidden;
  scrollbar-width: none;
}
.gallery-modal-thumbs::-webkit-scrollbar {
  display: none;
}
.gallery-modal-thumb {
  @apply h-14 w-20 shrink-0 overflow-hidden rounded-md border border-cream/25 opacity-60 transition-opacity hover:opacity-100;
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
  .gallery-modal-leave-active,
  .gallery-fade-enter-active,
  .gallery-fade-leave-active {
    transition: none;
  }
  .gallery-open:hover .gallery-img {
    transform: none;
  }
  .gallery-modal-slide {
    transition: none;
  }
}
</style>
