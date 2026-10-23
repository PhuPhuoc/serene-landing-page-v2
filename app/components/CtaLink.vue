<script setup lang="ts">
import { CtaBehavior, CtaVariant, type Link } from "../../types";

type CtaSize = "sm" | "md" | "lg";
// Tone của *nền* phía sau CTA (không phải màu chữ): quyết định màu cho
// underline/outline để CTA đọc được trên cả panel sáng lẫn tối.
type CtaTone = "light" | "dark";

const props = withDefaults(
  defineProps<{
    link?: Link | null;
    size?: CtaSize;
    tone?: CtaTone;
  }>(),
  { size: "md", tone: "light" },
);

const NuxtLinkComp = resolveComponent("NuxtLink");
const linkProps = useLinkProps();

const tag = computed(() =>
  props.link?.type === CtaBehavior.EXTERNAL ? "a" : NuxtLinkComp,
);

// `none` = text thường: không nền, viền, gạch chân, mũi tên hay hiệu ứng hover.
const isPlain = computed(() => props.link?.style === CtaVariant.NONE);
const variant = computed(() => props.link?.style ?? CtaVariant.SOLID);

const variantClass = computed(() => {
  switch (variant.value) {
    case CtaVariant.SOLID:
      return props.tone === "dark"
        ? "bg-cream text-dark hover:bg-warm-400 hover:text-dark"
        : "bg-primary text-cream hover:bg-primary-hover hover:text-cream";
    case CtaVariant.UNDERLINE:
      return props.tone === "dark"
        ? "border-b border-current pb-1 text-cream hover:text-warm-400"
        : "border-b border-current pb-1 text-primary hover:text-primary-hover";
    case CtaVariant.OUTLINE:
      return props.tone === "dark"
        ? "border border-cream/70 text-cream hover:border-cream hover:bg-cream hover:text-dark"
        : "border border-primary text-primary hover:bg-primary hover:text-cream";
    case CtaVariant.NONE:
      return "text-current no-underline hover:text-current";
    default:
      return props.tone === "dark"
        ? "bg-cream text-dark hover:bg-warm-400 hover:text-dark"
        : "bg-primary text-cream hover:bg-primary-hover hover:text-cream";
  }
});

const sizeClass = computed(() => {
  if (isPlain.value) return "";

  if (variant.value === CtaVariant.UNDERLINE) {
    return {
      sm: "min-h-10 text-base",
      md: "min-h-10 text-[17px]",
      lg: "min-h-10 text-[15px]",
    }[props.size];
  }

  return {
    sm: "h-10 px-4 text-base",
    md: "h-12 px-[26px] text-[17px]",
    lg: "h-[52px] px-[30px] text-[15px]",
  }[props.size];
});

// Icon chỉ hiện khi CMS bật `withIcon`; null/undefined/false đều coi là tắt.
// `none` luôn là text thuần nên không có icon kể cả khi withIcon = true.
const showArrow = computed(
  () => !isPlain.value && !!props.link?.withIcon && !!props.link?.label,
);
</script>

<template>
  <component
    :is="tag"
    v-if="link?.label"
    v-bind="linkProps(link)"
    :class="[
      isPlain ? null : 'cta-link',
      variantClass,
      sizeClass,
    ]"
  >
    <span>{{ link.label }}</span>
    <svg
      v-if="showArrow"
      class="cta-link-arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  </component>
</template>

<style scoped>
.cta-link {
  /* w-fit: CTA là flex item trong cột (DayAt/Visit) thì không bị stretch theo
     bề rộng khung — nếu không border-b của variant underline sẽ kéo hết hàng. */
  @apply inline-flex w-fit max-w-full items-center gap-2.5 font-medium tracking-wide transition-colors duration-300;
}
.cta-link-arrow {
  @apply h-4 w-4 shrink-0 transition-transform duration-300 motion-reduce:transform-none;
}
.cta-link:hover .cta-link-arrow {
  @apply translate-x-1;
}
</style>
