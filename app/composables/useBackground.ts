import { BackgroundType, type Background, type Media } from "../../types";
import type { MaybeRefOrGetter } from "vue";

type BackgroundOptions = {
  // Nền "default" của block vốn đã tối sẵn (membership: panel nâu) hay chưa
  defaultOnDark?: boolean;
};

// Nền màu do CMS nhập tự do nên chữ sáng/tối phải suy từ độ sáng tương đối
// (WCAG): #795B3C → chữ kem, #E8DAC4 → chữ nâu.
function isDarkColor(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5) < 0.45
  );
}

// Chuẩn hoá `background` của CMS (3 dạng default | color | image) cho mọi block:
// `style` để set nền màu, `image` để render ảnh full-bleed (BlockBackground),
// `onDark` để block chọn tone chữ sáng/tối.
export function useBackground(
  background: MaybeRefOrGetter<Background | null | undefined>,
  options: BackgroundOptions = {},
) {
  const bg = computed(() => toValue(background));

  const type = computed(() => bg.value?.type ?? BackgroundType.DEFAULT);
  const hexColor = computed(() => bg.value?.hexColor ?? null);

  // Ảnh nền chỉ tính khi CMS thật sự có file, nếu không phải rơi về nền mặc định
  const image = computed<Media | null>(() => {
    const img = bg.value?.image ?? null;
    return type.value === BackgroundType.IMAGE && img?.url ? img : null;
  });

  // Nền tối (ảnh hoặc màu đậm) → chữ kem; nền mặc định/màu nhạt → chữ nâu đậm
  const onDark = computed(
    () =>
      !!image.value ||
      (type.value === BackgroundType.COLOR &&
        !!hexColor.value &&
        isDarkColor(hexColor.value)) ||
      (type.value === BackgroundType.DEFAULT && !!options.defaultOnDark),
  );

  const style = computed(() =>
    type.value === BackgroundType.COLOR && hexColor.value
      ? { backgroundColor: hexColor.value }
      : undefined,
  );

  return { type, hexColor, image, onDark, style };
}
