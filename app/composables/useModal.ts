import {
  MODAL_KEYS,
  type CtaSourceArea,
  type ModalKey,
  type ModalSource,
} from "../../types";

// Input từ nơi mở modal: `page`/`locale` được composable tự lấy từ route hiện
// tại nên call site chỉ cần khai báo đang đứng ở khu vực nào.
export type ModalSourceInput = {
  area: CtaSourceArea;
  label: string;
  blockId?: number;
};

type ModalState = {
  key: ModalKey;
  source: ModalSource;
};

export function isModalKey(value: unknown): value is ModalKey {
  return (
    typeof value === "string" &&
    (MODAL_KEYS as readonly string[]).includes(value)
  );
}

// State modal dùng chung toàn app (`useState` để SSR-safe): CTA ở bất kỳ đâu
// chỉ cần gọi `open()`, `SiteModal` trong layout đọc state và render modal.
export function useModal() {
  const state = useState<ModalState | null>("site-modal", () => null);
  const route = useRoute();
  const { locale } = useI18n();

  function open(key: ModalKey, input: ModalSourceInput) {
    state.value = {
      key,
      source: {
        area: input.area,
        label: input.label,
        blockId: input.blockId,
        page: route.path,
        locale: locale.value,
      },
    };
  }

  function close() {
    state.value = null;
  }

  return { state, open, close };
}
