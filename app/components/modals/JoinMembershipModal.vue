<script setup lang="ts">
import ModalDialog from "~/components/modals/ModalDialog.vue";
import EnquiryForm from "~/components/modals/EnquiryForm.vue";
import { ModalKey, type ModalSource } from "../../../types";

// Modal "joinMembership": tạm thời dùng chung form với contactUs. Tách riêng để
// sau này thêm nội dung/quyền lợi/field riêng mà không ảnh hưởng contactUs.
defineProps<{ source: ModalSource }>();
const emit = defineEmits<{ close: [] }>();

const { locale } = useI18n();
const isVi = computed(() => locale.value === "vi");

const copy = computed(() =>
  isVi.value
    ? {
        label: "Form đăng ký hội viên",
        eyebrow: "YÊU CẦU",
        heading: "Chia sẻ với chúng tôi điều bạn đang nghĩ",
      }
    : {
        label: "Membership enquiry form",
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
      :modal-key="ModalKey.JOIN_MEMBERSHIP"
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
