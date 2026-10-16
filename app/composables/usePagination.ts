import type { MaybeRefOrGetter } from "vue";

// Phân trang dùng chung cho mọi danh sách hiển thị theo trang (club events,
// journal…): nhận mảng item + số item mỗi trang, trả về trang hiện tại và lát
// cắt của trang đó.
// `pageSize` thường là `limit` của block trong CMS nên để dạng getter.
export function usePagination<T>(
  items: MaybeRefOrGetter<T[] | null | undefined>,
  pageSize: MaybeRefOrGetter<number | null | undefined>,
) {
  const source = computed(() => toValue(items) ?? []);
  const size = computed(() => Math.max(1, Math.floor(toValue(pageSize) || 1)));
  const total = computed(() => source.value.length);
  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / size.value)),
  );

  const page = ref(1);

  // Kẹp trang vào khoảng hợp lệ 1 ≤ page ≤ pageCount
  function goTo(target: number) {
    page.value = Math.min(Math.max(1, Math.floor(target)), pageCount.value);
  }

  // Danh sách đổi (lọc, đổi locale, refetch) → về trang 1
  watch(source, () => goTo(1));
  // Số trang co lại (đổi limit, dữ liệu ngắn hơn) → trang hiện tại phải còn hợp lệ
  watch(pageCount, (max) => {
    if (page.value > max) goTo(max);
  });

  const pageItems = computed(() => {
    const start = (page.value - 1) * size.value;
    return source.value.slice(start, start + size.value);
  });

  return {
    page,
    pageCount,
    pageSize: size,
    total,
    pageItems,
    hasPrev: computed(() => page.value > 1),
    hasNext: computed(() => page.value < pageCount.value),
    goTo,
  };
}
