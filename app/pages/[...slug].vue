<script setup lang="ts">
import Hero from "~/components/blocks/Hero.vue";
import { type PageReponse } from "../../types";
import Intro from "~/components/blocks/Intro.vue";
import DayAt from "~/components/blocks/DayAt.vue";
import Section from "~/components/blocks/Section.vue";
import Visit from "~/components/blocks/Visit.vue";
import Membership from "~/components/blocks/Membership.vue";
import Tier from "~/components/blocks/Tier.vue";
import ClubEvent from "~/components/blocks/ClubEvent.vue";
import PrivateEvent from "~/components/blocks/PrivateEvent.vue";
import WineAndDine from "~/components/blocks/WineAndDine.vue";
import WellnessAndLeisure from "~/components/blocks/WellnessAndLeisure.vue";
import ArtAndCulture from "~/components/blocks/ArtAndCulture.vue";
const route = useRoute();

const { locales, defaultLocale } = useI18n();

// Locale lấy từ route.path (không lấy từ useI18n().locale) để đổi cùng nhịp
// với slug => auto-key của useFetch chỉ đổi 1 lần khi navigate.
// Danh sách locale codes lấy từ config (tĩnh) nên không phá tính đồng nhịp.
const localeCodes = computed<string[]>(() =>
  locales.value.map((l) => (typeof l === "string" ? l : l.code)),
);

const locale = computed(() => {
  const first = route.path.split("/").find(Boolean);
  return first && localeCodes.value.includes(first)
    ? first
    : defaultLocale || "en";
});

const slug = computed(() => {
  const params = route.params.slug;
  const segments = (
    Array.isArray(params) ? params : [String(params ?? "")]
  ).filter(Boolean);

  return segments[0] || "home";
});

const { data: pageRes, error } = await useFetch<PageReponse>(
  () => `/api/pages/${slug.value}`,
  {
    query: { locale },
  },
);

if (error.value || !pageRes.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: error.value?.statusMessage ?? "Page not found",
    fatal: true,
  });
}

// console.log("res:", JSON.stringify(pageRes.value, null, 2));

useSeoMeta({
  title: () => pageRes.value?.title || "Serene Saigon",
});
</script>

<template>
  <main v-if="pageRes">
    <template v-for="block in pageRes.blocks" :key="block.id">
      <Hero v-if="block.type === 'hero'" v-bind="block" />
      <Intro v-if="block.type === 'intro'" v-bind="block" />
      <DayAt v-if="block.type === 'day-at'" v-bind="block" />
      <Section v-if="block.type === 'simple-section'" v-bind="block" />
      <Visit v-if="block.type === 'visit'" v-bind="block" />
      <Membership v-if="block.type === 'membership'" v-bind="block" />
      <Tier v-if="block.type === 'tier'" v-bind="block" />
      <ClubEvent v-if="block.type === 'club-event'" v-bind="block" />
      <PrivateEvent v-if="block.type === 'private-event'" v-bind="block" />
      <WineAndDine v-if="block.type === 'wine-and-dine'" v-bind="block" />
      <WellnessAndLeisure
        v-if="block.type === 'wellness-and-leisure'"
        v-bind="block"
      />
      <ArtAndCulture v-if="block.type === 'art-and-culture'" v-bind="block" />
    </template>
  </main>
</template>
