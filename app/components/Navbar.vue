<script setup lang="ts">
import { LinkType } from "../../types";

// locale: ngôn ngữ hiện tại (ví dụ "en") | locales: danh sách ngôn ngữ khai báo trong nuxt.config
const { locale, locales } = useI18n();

// Thêm prefix ngôn ngữ vào path: localePath("/about") => "/vi/about"
const localePath = useLocalePath();

// Thông tin URL đang xem (route.path, route.query...)
const route = useRoute();

// Đổi ngôn ngữ nhưng giữ nguyên trang: /vi/blog/a => /en/blog/a
const switchLocalePath = useSwitchLocalePath();

// Lấy component NuxtLink thật để dùng cho <component :is="...">
const NuxtLinkComp = resolveComponent("NuxtLink");

// Danh sách mã ngôn ngữ dạng đơn giản: ["en", "vi"]
const localeCodes = computed<string[]>(() =>
  locales.value.map((l: any) => (typeof l === "string" ? l : l.code)),
);

// Lấy menu của TẤT CẢ ngôn ngữ, kết quả dạng { en: {...}, vi: {...} }
// (cần cả hai để tìm trang tương ứng khi đổi ngôn ngữ)
const { data: navs } = await useAsyncData(
  "navigation-all-locales",
  async () => {
    const entries = await Promise.all(
      localeCodes.value.map(async (code) => {
        const data = await $fetch("/api/navigation", {
          query: { locale: code },
        });
        return [code, data] as const;
      }),
    );
    return Object.fromEntries(entries);
  },
);

// Menu của ngôn ngữ đang dùng, dùng để hiển thị
const navItem = computed(() => navs.value?.[locale.value]);

// Biến menu dạng cây (có children) thành danh sách phẳng để dễ tìm
const flatten = (items: MenuItem[] = []): MenuItem[] =>
  items.flatMap((i) => [i, ...flatten((i.children as MenuItem[]) ?? [])]);

// Danh sách phẳng của từng ngôn ngữ (gồm menu, menu con, utilityLink)
// Chỉ giữ item có documentId và có đường dẫn thật
const flatByLocale = computed(() => {
  const result: Record<string, MenuItem[]> = {};
  for (const [code, nav] of Object.entries(navs.value ?? {}) as [
    string,
    any,
  ][]) {
    result[code] = flatten([
      ...(nav.menuItems ?? []),
      ...(nav.utilityLink ? [nav.utilityLink] : []),
    ]).filter((i) => i.documentId && i.to && i.to !== "#");
  }
  return result;
});

// Tạo link cho nút đổi ngôn ngữ: giữ đúng trang cũ dựa vào documentId
const localizedPath = (targetCode: string) => {
  // 1. Tìm mục menu tương ứng với trang đang xem
  const current = flatByLocale.value[locale.value]?.find(
    (i) => localePath(i.to!) === route.path,
  );

  // 2. Tìm mục có cùng documentId ở ngôn ngữ muốn đổi sang
  const target = current
    ? flatByLocale.value[targetCode]?.find(
        (i) => i.documentId === current.documentId,
      )
    : undefined;

  if (target?.to) {
    return localePath(target.to, targetCode as any);
  }

  // 3. Không tìm thấy (trang không nằm trong menu) thì dùng cách mặc định
  return switchLocalePath(targetCode as any);
};

// --- State & hiển thị navbar ---

// Slug của các trang "home" — navbar nền trong suốt để lộ hero phía sau
// const HOME_SLUGS = ["/", "/the-club", "/ve-serene"];
const HOME_SLUGS = [""];

// Bỏ prefix ngôn ngữ để so sánh giữa các locale: /vi/ve-serene => /ve-serene
const pathWithoutLocale = computed(() => {
  const re = new RegExp(`^/(${localeCodes.value.join("|")})(?=/|$)`);
  const stripped = route.path.replace(re, "");
  return stripped === "" ? "/" : stripped;
});

// Ở home: nền trong suốt + chữ/logo sáng (vì hero ảnh tối phía sau)
const isHome = computed(() => HOME_SLUGS.includes(pathWithoutLocale.value));

// Chọn logo theo nền sáng hoặc tối
// Nền trong suốt (isHome) → dùng logo on Dark (vì hero phía sau tối)
// Nền sáng (cream) → dùng logo on Light
const logo = computed(() => {
  return isHome.value ? navItem.value?.logoOnDark : navItem.value?.logoOnLight;
});

// Drawer menu mobile (mobile-first): panel fullscreen nền tối
const menuOpen = ref(false);

// Id mục menu đang mở submenu (accordion trên mobile + xoay caret)
const openId = ref<number | null>(null);
const toggle = (id: number) => {
  openId.value = openId.value === id ? null : id;
};

// Hover Member's Perks (desktop): mở submenu bar dưới header
const perksHovered = ref(false);
let perksHoverTimer: ReturnType<typeof setTimeout> | null = null;
const closePerksHover = () => {
  // Delay đóng để chuột kịp rời item → di chuyển xuống thanh submenu
  if (perksHoverTimer) clearTimeout(perksHoverTimer);
  perksHoverTimer = setTimeout(() => {
    perksHovered.value = false;
    perksHoverTimer = null;
  }, 150);
};
const openPerksHover = () => {
  if (perksHoverTimer) {
    clearTimeout(perksHoverTimer);
    perksHoverTimer = null;
  }
  perksHovered.value = true;
};

// Cờ: bỏ qua 1 lần đóng drawer khi người dùng bấm đổi ngôn ngữ trong drawer.
// Cần vì đổi locale có thể đổi cả slug của trang (2 bản dịch của cùng 1 document
// trong Strapi): /en/the-club → /vi/ve-serene — vẫn là "cùng một trang" nhưng
// không thể phân biệt chỉ bằng cách so sánh path.
let keepDrawerOpenOnce = false;
const markLocaleSwitch = (code: string) => {
  if (code !== locale.value) keepDrawerOpenOnce = true;
};

// Đổi trang thì đóng drawer + dropdown.
// Riêng khi đổi ngôn ngữ (EN ↔ VI) từ drawer thì giữ nguyên trạng thái mở.
watch(
  () => route.path,
  () => {
    if (keepDrawerOpenOnce) {
      keepDrawerOpenOnce = false;
      return;
    }
    menuOpen.value = false;
    openId.value = null;
  },
);

// Khóa scroll body khi drawer mở
watch(menuOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});

// Phím ESC đóng drawer/dropdown
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    menuOpen.value = false;
    openId.value = null;
  }
};
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  if (perksHoverTimer) clearTimeout(perksHoverTimer);
});

// Link đang trỏ tới trang hiện tại?
const isActive = (l: MenuItem) =>
  !!l.to && l.to !== "#" && localePath(l.to) === route.path;

// Mục "Member's Perks" (parent có children)
const perksItem = computed(() =>
  navItem.value?.menuItems.find((m) => m.children && m.children.length > 0),
);

// Thanh submenu nhỏ dưới header: hiện khi đang ở 1 trong các trang con
// (Stay, Wine & Dine, Wellness & Leisure, Art & Culture) HOẶC khi hover Member's Perks
const perksActive = computed(
  () => perksItem.value?.children?.some((c) => isActive(c)) ?? false,
);
const showPerksBar = computed(
  () => !!perksItem.value && (perksHovered.value || perksActive.value),
);

// Tạo props cho từng link trong menu
const linkProps = (l: MenuItem) => {
  const hasChildren = l.children && l.children.length > 0 ? true : false;
  const isExternal = l.type === LinkType.EXTERNAL;

  if (hasChildren) {
    return {
      to: undefined,
      role: "button",
      tabindex: 0,
    };
  }

  const path = l.to ?? "#";

  return {
    to: isExternal ? path : path === "#" ? "#" : localePath(path),
    target: l.newTab ? "_blank" : undefined,
    rel: isExternal ? "noopener noreferrer" : undefined,
  };
};
</script>

<template>
  <header
    v-if="navItem"
    :class="[
      'sticky top-0 z-50 transition-colors duration-300',
      isHome ? 'bg-transparent text-cream' : 'bg-cream text-dark',
    ]"
  >
    <div
      class="mx-auto flex h-16 max-w-container items-center justify-between gap-6 px-4 md:h-20 md:px-8"
    >
      <!-- logo -->
      <NuxtLink
        :to="localePath('/')"
        class="shrink-0"
        aria-label="Serene Saigon"
      >
        <img
          :src="logo?.url"
          :alt="logo?.alt"
          :width="logo?.width"
          :height="logo?.height"
          class="h-9 w-auto md:h-11"
        />
      </NuxtLink>

      <!-- menu chính (desktop) -->
      <nav aria-label="Main" class="hidden lg:block">
        <ul class="flex items-center gap-6 text-sm tracking-wide xl:gap-8">
          <li
            v-for="l in navItem.menuItems"
            :key="l.id"
            class="group relative"
            @mouseenter="l.children?.length ? openPerksHover() : undefined"
            @mouseleave="l.children?.length ? closePerksHover() : undefined"
          >
            <component
              :is="l.children?.length ? 'button' : NuxtLinkComp"
              v-bind="{
                ...linkProps(l),
                ...(l.children?.length ? { type: 'button' } : {}),
              }"
              :aria-expanded="l.children?.length ? openId === l.id : undefined"
              :aria-current="isActive(l) ? 'page' : undefined"
              :class="[
                'flex items-center gap-1.5 py-2 text-inherit transition-colors hover:text-primary-hover',
                isActive(l) &&
                  'relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:bg-current',
              ]"
              @click="l.children?.length ? toggle(l.id) : undefined"
            >
              {{ l.label }}

              <!-- caret của mục có menu con -->
              <svg
                v-if="l.children?.length"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
                :class="[
                  'h-3 w-3 transition-transform',
                  openId === l.id && 'rotate-180',
                  'group-hover:rotate-180',
                ]"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m2.5 4.5 3.5 3.5 3.5-3.5"
                />
              </svg>
            </component>

            <!-- menu con: click/accordion trên mobile, hover trên desktop.
                 Ẩn khi thanh bar dưới header đang hiện (tránh trùng lặp) -->
            <ul
              v-if="l.children && l.children.length > 0 && !showPerksBar"
              :class="[
                openId === l.id ? 'block' : 'hidden',
                'lg:absolute lg:left-0 lg:top-full lg:block lg:min-w-[220px] lg:rounded-sm lg:bg-cream lg:py-2 lg:text-dark lg:shadow-dropdown lg:ring-1 lg:ring-dark/5',
                'lg:invisible lg:translate-y-2 lg:opacity-0 lg:transition lg:duration-200',
                'lg:group-hover:visible lg:group-hover:translate-y-0 lg:group-hover:opacity-100',
                'lg:group-focus-within:visible lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100',
              ]"
            >
              <li v-for="child in l.children" :key="child.id">
                <NuxtLink
                  v-bind="linkProps(child)"
                  :aria-current="isActive(child) ? 'page' : undefined"
                  class="block px-4 py-2.5 text-sm hover:bg-warm-200 hover:text-primary"
                >
                  {{ child.label }}
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <!-- bên phải (desktop) -->
      <div class="hidden items-center gap-5 lg:flex xl:gap-7">
        <!-- Journal / Tạp chí -->
        <NuxtLink
          v-if="navItem.utilityLink"
          v-bind="linkProps(navItem.utilityLink)"
          class="text-sm tracking-wide transition-colors hover:text-primary-hover"
        >
          {{ navItem.utilityLink.label }}
        </NuxtLink>

        <!-- đổi ngôn ngữ -->
        <div
          class="flex items-center gap-1.5 text-xs tracking-widest"
          aria-label="Language Switcher"
        >
          <template
            v-for="(availableLocale, index) in locales"
            :key="availableLocale.code"
          >
            <span
              v-if="index > 0"
              :class="isHome ? 'text-cream/40' : 'text-muted/60'"
              >/</span
            >
            <NuxtLink
              :to="localizedPath(availableLocale.code)"
              :class="[
                'transition-colors hover:text-primary-hover',
                locale === availableLocale.code
                  ? 'font-semibold'
                  : isHome
                    ? 'text-cream/60'
                    : 'text-muted',
              ]"
            >
              {{ availableLocale.code.toUpperCase() }}
            </NuxtLink>
          </template>
        </div>

        <!-- nút CTA -->
        <NuxtLink
          v-if="navItem.cta"
          v-bind="linkProps(navItem.cta)"
          :class="[
            'border px-4 py-2 text-sm tracking-wide transition-colors xl:px-5 xl:py-2.5',
            isHome
              ? 'border-cream hover:bg-cream hover:text-dark'
              : 'border-dark hover:bg-dark hover:text-cream',
          ]"
        >
          {{ navItem.cta.label }}
        </NuxtLink>
      </div>

      <!-- nút hamburger (mobile) -->
      <button
        type="button"
        class="grid h-10 w-10 place-items-center lg:hidden"
        aria-label="Open menu"
        aria-controls="mobile-menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="h-6 w-6"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </div>

    <!-- thanh submenu nhỏ dưới header (chỉ desktop): Member's Perks + 4 link con -->
    <div
      v-if="showPerksBar && perksItem"
      class="hidden border-t border-warm-300 bg-warm-100 text-dark lg:block"
      @mouseenter="openPerksHover"
      @mouseleave="closePerksHover"
    >
      <div class="mx-auto flex max-w-content items-center gap-9 px-6 xl:px-12">
        <span
          class="border-r border-warm-600 py-3 pr-9 text-[11px] font-medium uppercase tracking-label text-muted"
        >
          {{ perksItem.label }}
        </span>
        <ul class="flex items-center gap-9">
          <li v-for="child in perksItem.children" :key="child.id">
            <NuxtLink
              v-bind="linkProps(child)"
              :aria-current="isActive(child) ? 'page' : undefined"
              :class="[
                'block py-3 text-sm tracking-wide transition-colors hover:text-primary-hover',
                isActive(child) &&
                  'relative font-medium after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-primary',
              ]"
            >
              {{ child.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- drawer mobile: panel fullscreen nền tối (mobile-first) -->
    <div
      v-if="menuOpen"
      id="mobile-menu"
      class="fixed inset-0 z-50 flex flex-col bg-dark text-cream lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <!-- đầu drawer: logo serene dark bên trái, nút đóng bên phải -->
      <div class="flex h-16 shrink-0 items-center justify-between px-4">
        <NuxtLink
          :to="localePath('/')"
          class="shrink-0"
          aria-label="Serene Saigon"
        >
          <img
            v-if="navItem.logoOnDark"
            :src="navItem.logoOnDark.url"
            :alt="navItem.logoOnDark.alt"
            :width="navItem.logoOnDark.width"
            :height="navItem.logoOnDark.height"
            class="h-9 w-auto"
          />
        </NuxtLink>
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded bg-white/10 transition-colors hover:bg-white/20"
          aria-label="Close menu"
          @click="menuOpen = false"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 12H5m0 0 6 6m-6-6 6-6"
            />
          </svg>
        </button>
      </div>

      <!-- menu chính trong drawer (cuộn nếu quá dài, footer luôn ở đáy) -->
      <nav
        aria-label="Main"
        class="min-h-0 flex-1 overflow-y-auto border-t border-white/10"
      >
        <ul>
          <li v-for="l in navItem.menuItems" :key="l.id">
            <component
              :is="l.children?.length ? 'button' : NuxtLinkComp"
              v-bind="{
                ...linkProps(l),
                ...(l.children?.length ? { type: 'button' } : {}),
              }"
              :aria-expanded="l.children?.length ? openId === l.id : undefined"
              :aria-current="isActive(l) ? 'page' : undefined"
              :class="[
                'flex w-full items-center justify-between px-6 py-4 text-base text-cream transition-colors hover:bg-white/10 hover:text-cream',
                isActive(l) && 'bg-white/15 font-medium',
              ]"
              @click="l.children?.length ? toggle(l.id) : undefined"
            >
              {{ l.label }}

              <svg
                v-if="l.children?.length"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
                :class="[
                  'h-3.5 w-3.5 transition-transform',
                  openId === l.id && 'rotate-180',
                ]"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m2.5 4.5 3.5 3.5 3.5-3.5"
                />
              </svg>
            </component>

            <!-- menu con trong drawer -->
            <ul
              v-if="l.children && l.children.length > 0 && openId === l.id"
              class="bg-white/5"
            >
              <li v-for="child in l.children" :key="child.id">
                <NuxtLink
                  v-bind="linkProps(child)"
                  :aria-current="isActive(child) ? 'page' : undefined"
                  :class="[
                    'block py-3 pl-10 pr-6 text-sm text-cream/80 transition-colors hover:bg-white/10 hover:text-cream',
                    isActive(child) && 'bg-white/10 text-cream',
                  ]"
                >
                  {{ child.label }}
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <!-- đáy drawer: CTA nổi bật + journal + đổi ngôn ngữ -->
      <div class="shrink-0 space-y-4 border-t border-white/10 px-6 py-6">
        <div class="flex items-center justify-between gap-3 pt-2">
          <NuxtLink
            v-if="navItem.utilityLink"
            v-bind="linkProps(navItem.utilityLink)"
            class="text-sm text-cream/90 transition-colors hover:text-cream"
          >
            {{ navItem.utilityLink.label }}
          </NuxtLink>

          <div
            class="flex items-center gap-1.5 text-xs tracking-widest"
            aria-label="Language Switcher"
          >
            <template
              v-for="(availableLocale, index) in locales"
              :key="availableLocale.code"
            >
              <span v-if="index > 0" class="text-cream/40">/</span>
              <NuxtLink
                :to="localizedPath(availableLocale.code)"
                :class="[
                  'transition-colors hover:text-cream',
                  locale === availableLocale.code
                    ? 'font-semibold text-cream'
                    : 'text-cream/60',
                ]"
                @click="markLocaleSwitch(availableLocale.code)"
              >
                {{ availableLocale.code.toUpperCase() }}
              </NuxtLink>
            </template>
          </div>
        </div>

        <NuxtLink
          v-if="navItem.cta"
          v-bind="linkProps(navItem.cta)"
          class="block border border-cream bg-cream px-5 py-3 text-center text-sm font-medium tracking-wide text-dark transition-colors hover:bg-transparent hover:text-cream"
        >
          {{ navItem.cta.label }}
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
