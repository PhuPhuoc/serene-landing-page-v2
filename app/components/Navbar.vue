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

// Chọn logo theo nền sáng hoặc tối
const isLight = ref(true);
const logo = computed(() => {
  return isLight.value ? navItem.value?.logoOnLight : navItem.value?.logoOnDark;
});

// Tạo props cho từng link trong menu
const linkProps = (l: MenuItem) => {
  const hasChildren = l.children && l.children.length > 0 ? true : false;
  const isExternal = l.type === LinkType.EXTERNAL;

  // Có menu con: không phải link, chỉ là nút để mở dropdown
  if (hasChildren) {
    return {
      to: undefined,
      role: "button",
      tabindex: 0,
    };
  }

  const path = l.to ?? "#";

  return {
    // Link ngoài và "#" giữ nguyên, link nội bộ thì thêm prefix ngôn ngữ
    to: isExternal ? path : path === "#" ? "#" : localePath(path),
    target: l.newTab ? "_blank" : undefined,
    rel: isExternal ? "noopener noreferrer" : undefined,
  };
};
</script>

<template>
  <header v-if="navItem">
    <div class="">
      <!-- logo -->
      <NuxtLink :to="localePath('/')">
        <img
          :src="logo?.url"
          :alt="logo?.alt"
          :width="logo?.width"
          :height="logo?.height"
        />
      </NuxtLink>

      <!-- menu chính -->
      <nav aria-label="Main">
        <ul>
          <li v-for="l in navItem.menuItems" :key="l.id">
            <component
              :is="l.children?.length ? 'span' : NuxtLinkComp"
              v-bind="linkProps(l)"
              style="cursor: pointer"
            >
              {{ l.label }}
            </component>

            <!-- menu con -->
            <ul v-if="l.children && l.children.length > 0">
              <li v-for="child in l.children" :key="child.id">
                <NuxtLink v-bind="linkProps(child)">
                  {{ child.label }}
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <!-- bên phải -->
      <div class="">
        <!-- Journal / Tạp chí -->
        <NuxtLink
          v-if="navItem.utilityLink"
          v-bind="linkProps(navItem.utilityLink)"
          class=""
        >
          {{ navItem.utilityLink.label }}
        </NuxtLink>

        <!-- đổi ngôn ngữ -->
        <div class="" aria-label="Language Switcher">
          <NuxtLink
            v-for="availableLocale in locales"
            :key="availableLocale.code"
            :to="localizedPath(availableLocale.code)"
            :class="{ active: locale === availableLocale.code }"
          >
            {{ availableLocale.code.toUpperCase() }}
          </NuxtLink>
        </div>

        <!-- nút CTA -->
        <NuxtLink v-if="navItem.cta" v-bind="linkProps(navItem.cta)" class="">
          {{ navItem.cta.label }}
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
