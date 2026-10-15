<script setup lang="ts">
import { type Media } from "../../../types";

// Ảnh nền full-bleed + lớp phủ tối dần về phía cột chữ (cùng lối với Hero).
// Dùng chung cho mọi block có `background` kiểu image (Section, Membership,
// Tier…): block tự lo `relative`/`overflow-hidden` trên thẻ gốc.
const props = withDefaults(
  defineProps<{
    image: Media | null;
    // Bên bị tối dần để cột chữ đọc được trên ảnh
    darkSide?: "left" | "right";
  }>(),
  { darkSide: "right" },
);
</script>

<template>
  <template v-if="props.image">
    <img class="block-bg" :src="props.image.url" :alt="props.image.alt" />
    <div
      class="block-bg-scrim"
      :class="{ 'block-bg-scrim--left': props.darkSide === 'left' }"
      aria-hidden="true"
    />
  </template>
</template>

<style scoped>
.block-bg {
  @apply absolute inset-0 h-full w-full object-cover;
}
/* Mobile: tối đều vì chữ nằm dưới ảnh; từ lg: tối dần về phía cột chữ */
.block-bg-scrim {
  @apply pointer-events-none absolute inset-0 bg-dark/55;
}
@media (min-width: 1024px) {
  .block-bg-scrim {
    @apply bg-transparent;
    background-image: linear-gradient(
      90deg,
      rgb(34 25 18 / 0.05) 0%,
      rgb(34 25 18 / 0.42) 55%,
      rgb(34 25 18 / 0.78) 100%
    );
  }
  .block-bg-scrim--left {
    background-image: linear-gradient(
      270deg,
      rgb(34 25 18 / 0.05) 0%,
      rgb(34 25 18 / 0.42) 55%,
      rgb(34 25 18 / 0.78) 100%
    );
  }
}
</style>
