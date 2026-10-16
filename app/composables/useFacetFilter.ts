import type { MaybeRefOrGetter } from "vue";

// 1 facet = 1 nhóm giá trị lọc được của item (vd: venues, categories). Một item
// có thể thuộc nhiều giá trị trong cùng nhóm nên `values` trả về mảng.
export type FacetSpec<T> = {
  // Khoá lưu lựa chọn, cũng là `key` trong `options`
  key: string;
  // Nhãn của nhóm, chỉ dùng để UI hiển thị (mặc định: chính `key`)
  label?: string;
  // Các giá trị facet của 1 item (giá trị rỗng sẽ bị bỏ qua)
  values: (item: T) => (string | null | undefined)[];
  // Nhãn hiển thị của 1 giá trị (mặc định: chính giá trị)
  labelOf?: (value: string) => string;
};

// Lọc danh sách theo facet — dùng cho hàng chips "Tất cả" + từng giá trị:
// nhiều giá trị trong cùng 1 facet = OR, giữa các facet = AND, chọn rỗng = bỏ lọc.
export function useFacetFilter<T>(
  items: MaybeRefOrGetter<T[] | null | undefined>,
  specs: MaybeRefOrGetter<FacetSpec<T>[]>,
) {
  const source = computed(() => toValue(items) ?? []);
  const facetSpecs = computed(() => toValue(specs) ?? []);

  // facet.key → các giá trị đang chọn (mảng rỗng = tất cả)
  const selected = reactive<Record<string, string[]>>({});

  // Giá trị của mọi facet lấy từ chính danh sách, kèm số item của từng giá trị
  // để UI hiển thị.
  const options = computed(() =>
    facetSpecs.value.map((spec) => {
      const counts = new Map<string, number>();

      for (const item of source.value) {
        for (const value of spec.values(item)) {
          if (!value) continue;
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }

      return {
        key: spec.key,
        label: spec.label ?? spec.key,
        // Sắp theo nhãn bằng so sánh code-unit (không dùng localeCompare): server
        // và client phải ra đúng một thứ tự để SSR không lệch hydration.
        values: [...counts]
          .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
          .map(([value, count]) => ({
            value,
            label: spec.labelOf?.(value) ?? value,
            count,
          })),
      };
    }),
  );

  const filtered = computed(() =>
    source.value.filter((item) =>
      facetSpecs.value.every((spec) => {
        const picked = selected[spec.key] ?? [];
        return (
          !picked.length ||
          spec.values(item).some((value) => !!value && picked.includes(value))
        );
      }),
    ),
  );

  // Không truyền key = có facet nào đang lọc; truyền key = riêng facet đó
  function isActive(key?: string) {
    if (key) return (selected[key] ?? []).length > 0;

    return facetSpecs.value.some((spec) => (selected[spec.key] ?? []).length > 0);
  }

  function isPicked(key: string, value: string) {
    return (selected[key] ?? []).includes(value);
  }

  // Bật/tắt 1 giá trị (chọn nhiều được); bỏ hết giá trị của 1 facet = "Tất cả"
  function toggle(key: string, value: string) {
    const picked = selected[key] ?? [];
    selected[key] = picked.includes(value)
      ? picked.filter((v) => v !== value)
      : [...picked, value];
  }

  // `clear` là hành động của chip "Tất cả" của một facet
  function clear(key: string) {
    selected[key] = [];
  }

  return { filtered, options, isActive, isPicked, toggle, clear };
}
