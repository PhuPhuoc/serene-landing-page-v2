import {
  ENQUIRY_SUBMIT_LIMIT,
  ENQUIRY_SUBMIT_WINDOW_MS,
} from "../../types";

// Mỗi trình duyệt một entry: mảng timestamp (ms) của các lần gửi enquiry thành
// công. Chỉ là chốt chặn phía client, không thay thế rate limit ở server.
const STORAGE_KEY = "serene:enquiry-submits";

function readTimestamps(): number[] {
  if (!import.meta.client) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  } catch {
    // localStorage bị chặn hoặc dữ liệu hỏng: coi như chưa gửi lần nào.
    return [];
  }
}

function writeTimestamps(timestamps: number[]) {
  if (!import.meta.client) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
  } catch {
    // Hết dung lượng/bị chặn: bỏ qua, chỉ mất chống spam phía client.
  }
}

// Đếm số lần gửi thành công trong cửa sổ trượt và cho biết mốc được gửi lại.
// Đọc localStorage trong onMounted/refresh để không lệch hydration với SSR.
export function useEnquiryRateLimit() {
  const timestamps = ref<number[]>([]);

  function prune(list: number[], now: number) {
    const cutoff = now - ENQUIRY_SUBMIT_WINDOW_MS;
    return list.filter((value) => value > cutoff).sort((a, b) => a - b);
  }

  function refresh() {
    timestamps.value = prune(readTimestamps(), Date.now());
  }

  const blocked = computed(
    () => timestamps.value.length >= ENQUIRY_SUBMIT_LIMIT,
  );
  // Mốc sớm nhất khách được gửi lại: lần gửi cũ nhất rời khỏi cửa sổ.
  const nextAllowedAt = computed(() => {
    const oldest = timestamps.value[0];
    return blocked.value && oldest !== undefined
      ? oldest + ENQUIRY_SUBMIT_WINDOW_MS
      : 0;
  });

  // Gọi sau khi /api/enquiry trả về thành công.
  function record() {
    const now = Date.now();
    const next = [...prune(timestamps.value, now), now];
    timestamps.value = next;
    writeTimestamps(next);
  }

  return { blocked, nextAllowedAt, refresh, record };
}
