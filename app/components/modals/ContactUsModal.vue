<script setup lang="ts">
import ModalDialog from "~/components/modals/ModalDialog.vue";
import EnquiryForm from "~/components/modals/EnquiryForm.vue";
import { ModalKey, type ModalSource } from "../../../types";

// Modal "contactUs": mọi CTA có ctaBehavior=modal + modalKey=contactUs đều mở
// component này. Copy/layout có thể sửa tự do tại đây.
defineProps<{ source: ModalSource }>();
const emit = defineEmits<{ close: [] }>();

const { locale } = useI18n();
const isVi = computed(() => locale.value === "vi");

const copy = computed(() =>
  isVi.value
    ? {
        label: "Form liên hệ",
        eyebrow: "YÊU CẦU",
        heading: "Chia sẻ với chúng tôi điều bạn đang nghĩ",
      }
    : {
        label: "Enquiry form",
        eyebrow: "ENQUIRY",
        heading: "Tell us what you have in mind",
      },
);
</script>

<template>
  <ModalDialog :label="copy.label" @close="emit('close')">
    <p class="modal-eyebrow">{{ copy.eyebrow }}</p>
    <h2 class="modal-heading">{{ copy.heading }}</h2>
    <EnquiryForm
      :modal-key="ModalKey.CONTACT_US"
      :source="source"
      @close="emit('close')"
    />
  </ModalDialog>
</template>

<style scoped>
.modal-eyebrow {
  @apply text-[13px] uppercase tracking-label text-primary;
}
.modal-heading {
  @apply mt-3 max-w-[18ch] font-serif text-3xl font-light leading-tight text-dark sm:text-4xl;
}
</style>
