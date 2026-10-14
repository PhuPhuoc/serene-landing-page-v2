<script setup lang="ts">
import { type DayAt, LinkType } from "../../../types";

const props = defineProps<Partial<DayAt>>();
const localePath = useLocalePath();

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
  <div>
    <p v-if="props.eyebrow">{{ props.eyebrow }}</p>
    <h1 v-if="props.heading">{{ props.heading }}</h1>

    <template v-for="m in props.moments" :key="m.id">
      <p v-if="m.label">{{ m.label }}</p>
      <p v-if="m.title">{{ m.title }}</p>
    </template>

    <template v-for="m in props.moments" :key="m.id">
      <p v-if="m.label">{{ m.label }}</p>
      <p v-if="m.description">{{ m.title }}</p>

      <NuxtLink v-if="m.cta" v-bind="linkProps(m.cta)">
        {{ m.cta.label }}
      </NuxtLink>

      <img v-if="m.image" :src="m.image.url" :alt="m.image.alt" />
    </template>
  </div>
</template>

<style scoped></style>
