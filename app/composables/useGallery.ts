import type { MaybeRefOrGetter } from "vue";

type GalleryOptions = {
  /** Thời gian giữ mỗi ảnh trước khi tự chuyển (ms). */
  interval?: number;
  /** Tắt tạm khi hover, mở modal, hoặc component cha muốn dừng. */
  autoplay?: MaybeRefOrGetter<boolean>;
};

// Cơ chế gallery dùng chung (Gallery.vue + bento của Wellness): giữ ảnh hiện
// tại, đi vòng khi hết danh sách, và tự chuyển ảnh sau mỗi `interval`.
// Tự dừng khi tab bị ẩn hoặc người dùng bật prefers-reduced-motion; mỗi lần
// người dùng bấm chuyển ảnh thì đồng hồ đếm lại từ đầu.
export function useGallery<T>(
  images: MaybeRefOrGetter<T[] | null | undefined>,
  options: GalleryOptions = {},
) {
  const source = computed(() => toValue(images) ?? []);
  const count = computed(() => source.value.length);
  const index = ref(0);
  const current = computed(() => source.value[index.value] ?? null);

  const interval = Math.max(1000, options.interval ?? 3000);
  const autoplay = computed(() => toValue(options.autoplay) ?? true);

  const reducedMotion = ref(false);
  const pageHidden = ref(false);
  let timer: number | null = null;
  let motionQuery: MediaQueryList | null = null;

  const canAuto = computed(
    () =>
      autoplay.value &&
      !reducedMotion.value &&
      !pageHidden.value &&
      count.value > 1,
  );

  function stop() {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function schedule() {
    stop();
    if (typeof window === "undefined" || !canAuto.value) return;

    timer = window.setTimeout(() => {
      timer = null;
      index.value = (index.value + 1) % count.value;
      schedule();
    }, interval);
  }

  // Đi vòng khi tới đầu/cuối (chỉ áp dụng khi có từ 2 ảnh)
  function go(step: number) {
    if (count.value < 2) return;
    index.value = (index.value + step + count.value) % count.value;
    schedule();
  }

  function goTo(target: number) {
    if (!count.value) return;
    index.value = Math.min(Math.max(Math.floor(target), 0), count.value - 1);
    schedule();
  }

  function reset() {
    index.value = 0;
    schedule();
  }

  // Đổi bộ ảnh (đổi không gian, đổi locale) ⇒ về ảnh đầu
  watch(source, reset);
  watch(canAuto, schedule);
  watch(count, (total) => {
    if (index.value >= total) reset();
  });

  function onVisibilityChange() {
    pageHidden.value = document.hidden;
  }

  function onMotionChange() {
    reducedMotion.value = motionQuery?.matches ?? false;
  }

  onMounted(() => {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.value = motionQuery.matches;
    motionQuery.addEventListener("change", onMotionChange);

    pageHidden.value = document.hidden;
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();
  });

  onBeforeUnmount(() => {
    stop();
    motionQuery?.removeEventListener("change", onMotionChange);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  });

  return {
    index,
    count,
    current,
    canAuto,
    go,
    goTo,
    reset,
  };
}
