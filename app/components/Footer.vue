<script setup lang="ts">
import { LinkType, type Link } from "../../types";

const { locale, locales } = useI18n();
const localePath = useLocalePath();

const localeCodes = computed<string[]>(() =>
  locales.value.map((l: any) => (typeof l === "string" ? l : l.code)),
);

// Lấy footer của TẤT CẢ ngôn ngữ một lần (cùng pattern Navbar "navigation-all-locales"):
// đổi locale không refetch, chỉ đổi computed `footer`.
const { data: footers } = await useAsyncData("footer-all-locales", async () => {
  const entries = await Promise.all(
    localeCodes.value.map(async (code) => {
      const data = await $fetch("/api/footer", { query: { locale: code } });
      return [code, data] as const;
    }),
  );
  return Object.fromEntries(entries);
});

const footer = computed(() => footers.value?.[locale.value]);

const NuxtLinkComp = resolveComponent("NuxtLink");
const linkTag = (l: Link) =>
  l.type === LinkType.EXTERNAL ? "a" : NuxtLinkComp;

const linkProps = (l: Link) => {
  const isExternal = l.type === LinkType.EXTERNAL;
  const path = l.to ?? "#";
  if (isExternal) {
    return {
      href: path,
      target: l.newTab ? "_blank" : undefined,
      rel: "noopener noreferrer",
    };
  }
  return { to: path === "#" ? "#" : localePath(path) };
};
</script>

<template>
  <footer v-if="footer" class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <!-- logo + liên hệ -->
        <div class="footer-brand">
          <NuxtLink
            :to="localePath('/')"
            class="footer-logo-link"
            aria-label="Serene Saigon"
          >
            <img
              v-if="footer.logo?.url"
              :src="footer.logo.url"
              :alt="footer.logo.alt"
              :width="footer.logo.width"
              :height="footer.logo.height"
              class="footer-logo-img"
            />
          </NuxtLink>

          <div class="footer-contact">
            <p class="footer-address">{{ footer.address }}</p>
            <p class="footer-contact-row">
              <a :href="`tel:${footer.phone}`" class="footer-contact-link">
                {{ footer.phone }}
              </a>
              <span class="footer-zalo"> · Zalo</span>
            </p>
            <p class="footer-contact-row">
              <a :href="`mailto:${footer.email}`" class="footer-contact-link">
                {{ footer.email }}
              </a>
            </p>
          </div>
        </div>

        <!-- lưới cột link: mobile 1 cột dọc → sm 2 cột → lg 4 cột -->
        <nav aria-label="Footer" class="footer-cols">
          <div
            v-for="column in footer.columns"
            :key="column.title"
            class="footer-col"
          >
            <h3 class="footer-col-title">{{ column.title }}</h3>
            <ul class="footer-col-links">
              <li v-for="link in column.links" :key="link.id">
                <component
                  :is="linkTag(link)"
                  v-bind="linkProps(link)"
                  class="footer-link"
                >
                  {{ link.label }}
                </component>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <!-- dải dưới: copyright + link pháp lý -->
      <div class="footer-bottom">
        <p class="footer-copyright">{{ footer.copyright }}</p>
        <ul class="footer-legal">
          <li v-for="link in footer.legalLinks" :key="link.id">
            <component
              :is="linkTag(link)"
              v-bind="linkProps(link)"
              class="footer-legal-link"
            >
              {{ link.label }}
            </component>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* base = mobile trước; sm/lg nâng cấp dần lên desktop */
.footer {
  @apply bg-dark text-cream;
}
.footer-inner {
  @apply mx-auto w-full max-w-content px-6 pt-16 pb-10 xl:px-12 lg:pt-24 lg:pb-12;
}
.footer-top {
  @apply flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-10;
}
.footer-brand {
  @apply lg:w-[340px] lg:shrink-0;
}
.footer-logo-link {
  @apply inline-block;
}
.footer-logo-img {
  @apply h-11 w-auto;
}
.footer-contact {
  @apply mt-7 space-y-1.5;
}
.footer-address {
  @apply text-sm leading-relaxed text-muted;
}
.footer-contact-row {
  @apply flex flex-wrap items-baseline gap-x-1.5;
}
.footer-contact-link {
  @apply text-sm text-muted transition-colors hover:text-cream;
}
.footer-zalo {
  @apply text-sm text-muted;
}
.footer-cols {
  @apply grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-4 lg:flex-1;
}
.footer-col-title {
  @apply mb-4 text-sm font-medium tracking-wide text-cream;
}
.footer-col-links {
  @apply space-y-2.5;
}
.footer-link {
  @apply inline-block text-sm text-cream/60 transition-colors hover:text-cream;
}
.footer-bottom {
  @apply mt-12 flex flex-col gap-5 border-t border-cream/10 pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-16;
}
.footer-copyright {
  @apply text-xs text-muted;
}
.footer-legal {
  @apply flex flex-wrap items-center gap-x-7 gap-y-2;
}
.footer-legal-link {
  @apply text-xs text-muted transition-colors hover:text-cream;
}
</style>
