<script setup lang="ts">
import ContactUsModal from "~/components/modals/ContactUsModal.vue";
import JoinMembershipModal from "~/components/modals/JoinMembershipModal.vue";
import { ModalKey } from "../../types";

// Host modal toàn app: đọc state của useModal() và render đúng modal theo key.
// ContactUsModal/JoinMembershipModal tự lo phần nội dung.
const { state, close } = useModal();
</script>

<template>
  <ContactUsModal
    v-if="state?.key === ModalKey.CONTACT_US"
    :source="state.source"
    @close="close"
  />
  <JoinMembershipModal
    v-else-if="state?.key === ModalKey.JOIN_MEMBERSHIP"
    :source="state.source"
    @close="close"
  />
</template>
