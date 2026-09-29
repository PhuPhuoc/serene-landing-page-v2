<script setup lang="ts">
const { locale } = useI18n();
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Serene` : "Serene Saigon";
  },
  htmlAttrs: {
    lang: locale.value,
  },
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
