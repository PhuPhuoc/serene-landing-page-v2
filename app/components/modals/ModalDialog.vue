<script setup lang="ts">
// Khung dialog dùng chung cho mọi modal của site: Teleport ra body, khoá scroll,
// chặn tương tác nền bằng `inert`, trap focus, đóng bằng Esc/backdrop và trả
// focus về phần tử đã mở modal.
defineProps<{
  // Tên dialog cho screen reader (vd: "Enquiry form")
  label: string;
}>();

const emit = defineEmits<{ close: [] }>();

const { locale } = useI18n();
const closeLabel = computed(() => (locale.value === "vi" ? "Đóng" : "Close"));

const panelRef = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);

let lastFocused: HTMLElement | null = null;
let previousOverflow = "";
let appRoot: HTMLElement | null = null;

// Tab ở phần tử cuối quay về đầu và ngược lại
function trapFocus(e: KeyboardEvent) {
  const root = panelRef.value;
  if (!root) return;

  const items = root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
    return;
  }

  if (e.key === "Tab") trapFocus(e);
}

onMounted(async () => {
  lastFocused = document.activeElement as HTMLElement | null;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  // Modal nằm trong Teleport (ngoài #__nuxt) nên chặn tương tác nền bằng inert
  appRoot = document.getElementById("__nuxt");
  appRoot?.setAttribute("inert", "");
  window.addEventListener("keydown", onKeydown);

  await nextTick();
  closeBtn.value?.focus();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  appRoot?.removeAttribute("inert");
  appRoot = null;
  document.body.style.overflow = previousOverflow;

  // Chờ modal rời DOM rồi trả focus về nút đã mở nó
  const target = lastFocused;
  lastFocused = null;
  nextTick(() => target?.focus());
});
</script>

<template>
  <Teleport to="body">
    <Transition name="site-modal" appear>
      <div
        class="site-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
      >
        <div class="site-modal-backdrop" @click="emit('close')" />

        <div class="site-modal-scroll" @click.self="emit('close')">
          <div ref="panelRef" class="site-modal-panel">
            <button
              ref="closeBtn"
              type="button"
              class="site-modal-close"
              :aria-label="closeLabel"
              @click="emit('close')"
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

            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Mobile-first: sheet trượt từ đáy, full chiều rộng; từ sm là dialog căn giữa */
.site-modal {
  @apply fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6;
}
.site-modal-backdrop {
  @apply absolute inset-0 bg-dark/70;
}
.site-modal-scroll {
  @apply relative z-10 max-h-[92vh] w-full overflow-y-auto bg-cream text-dark shadow-modal sm:max-w-[720px];
}
.site-modal-panel {
  @apply relative px-5 pb-7 pt-9 sm:px-10 sm:pb-10 sm:pt-11 lg:px-14;
}
.site-modal-close {
  @apply absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center text-primary transition-colors hover:text-primary-hover sm:right-3 sm:top-3;
}
.site-modal-close svg {
  @apply h-5 w-5;
}

.site-modal-enter-active,
.site-modal-leave-active {
  @apply transition-opacity duration-200 motion-reduce:transition-none;
}
.site-modal-enter-active .site-modal-scroll,
.site-modal-leave-active .site-modal-scroll {
  @apply transition-transform duration-300 motion-reduce:transition-none;
}
.site-modal-enter-from,
.site-modal-leave-to {
  @apply opacity-0;
}
.site-modal-enter-from .site-modal-scroll,
.site-modal-leave-to .site-modal-scroll {
  @apply translate-y-6 sm:translate-y-0 sm:scale-[0.98];
}
</style>
