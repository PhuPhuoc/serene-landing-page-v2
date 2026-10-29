<script setup lang="ts">
import Footer from "~/components/Footer.vue";
import Navbar from "~/components/Navbar.vue";
import SiteModal from "~/components/SiteModal.vue";
</script>

<template>
  <Navbar />
  <slot />
  <Footer />
  <SiteModal />
</template>
