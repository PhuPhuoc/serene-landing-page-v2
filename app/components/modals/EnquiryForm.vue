<script setup lang="ts">
import type {
  ModalEnquiry,
  ModalKey,
  ModalSource,
} from "../../../types";

// Form enquiry dùng chung cho contactUs/joinMembership. Hai modal cha chỉ khác
// phần tiêu đề; khi một modal cần field riêng thì tách khỏi component này.
const props = defineProps<{
  modalKey: ModalKey;
  source: ModalSource;
}>();

const emit = defineEmits<{ close: [] }>();

const { locale } = useI18n();
const isVi = computed(() => locale.value === "vi");

const copy = computed(() =>
  isVi.value
    ? {
        name: "Họ tên",
        email: "Email",
        mobile: "Số điện thoại",
        note: "Ghi chú",
        notePlaceholder: "Bạn cần chúng tôi lưu ý điều gì?",
        nameRequired: "Vui lòng nhập họ tên.",
        contactRequired: "Vui lòng nhập email hoặc số điện thoại.",
        emailInvalid: "Email không hợp lệ.",
        mobileInvalid: "Số điện thoại không hợp lệ.",
        cancel: "Huỷ",
        send: "Gửi",
        sending: "Đang gửi…",
        submitFailed: "Chưa gửi được. Vui lòng thử lại.",
        success: "Cảm ơn bạn — chúng tôi sẽ liên hệ trong thời gian sớm nhất.",
        close: "Đóng",
      }
    : {
        name: "Name",
        email: "Email",
        mobile: "Mobile",
        note: "Note",
        notePlaceholder: "Anything we should know?",
        nameRequired: "Please enter your name.",
        contactRequired: "Please provide an email or a mobile number.",
        emailInvalid: "Enter a valid email address.",
        mobileInvalid: "Enter a valid mobile number.",
        cancel: "Cancel",
        send: "Send",
        sending: "Sending…",
        submitFailed: "Could not send your enquiry. Please try again.",
        success: "Thank you — we'll be in touch shortly.",
        close: "Close",
      },
);

const uid = useId();
const fieldId = (field: string) => `enquiry-${uid}-${field}`;

const name = ref("");
const email = ref("");
const mobile = ref("");
const note = ref("");

const submitted = ref(false);
const pending = ref(false);
const successRef = ref<HTMLElement | null>(null);
const errors = reactive({ name: "", email: "", mobile: "", form: "" });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cho phép +84/0..., khoảng trắng/dấu chấm/gạch nối; sau khi chuẩn hoá chỉ còn
// chữ số (8–15) và dấu + ở đầu.
const MOBILE_RE = /^\+?\d{8,15}$/;

function normalizeMobile(value: string) {
  return value.replace(/[\s().-]/g, "");
}

function clearError(field: "name" | "email" | "mobile") {
  errors[field] = "";
  if (field === "email" || field === "mobile") errors.form = "";
}

// name bắt buộc; email/mobile phải có ít nhất một, giá trị đã nhập phải hợp lệ
function validate(): boolean {
  errors.name = name.value.trim() ? "" : copy.value.nameRequired;
  errors.email = "";
  errors.mobile = "";
  errors.form = "";

  const emailValue = email.value.trim();
  const mobileValue = normalizeMobile(mobile.value);

  if (!emailValue && !mobileValue) {
    errors.form = copy.value.contactRequired;
    return false;
  }

  if (emailValue && !EMAIL_RE.test(emailValue)) {
    errors.email = copy.value.emailInvalid;
  }
  if (mobileValue && !MOBILE_RE.test(mobileValue)) {
    errors.mobile = copy.value.mobileInvalid;
  }

  return !errors.name && !errors.email && !errors.mobile;
}

async function onSubmit() {
  if (pending.value || !validate()) return;

  const payload: ModalEnquiry = {
    modalKey: props.modalKey,
    name: name.value.trim(),
    email: email.value.trim() || null,
    mobile: normalizeMobile(mobile.value) || null,
    note: note.value.trim() || null,
    // Spread để payload là object thuần (source từ useState là reactive proxy)
    source: { ...props.source },
  };

  pending.value = true;
  try {
    // Server Nitro validate + log rồi sẽ gọi Mailchimp; client không log nữa.
    await $fetch("/api/enquiry", { method: "POST", body: payload });

    submitted.value = true;
    await nextTick();
    successRef.value?.focus();
  } catch {
    errors.form = copy.value.submitFailed;
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div
    v-if="submitted"
    ref="successRef"
    class="enquiry-success"
    role="status"
    tabindex="-1"
  >
    <p>{{ copy.success }}</p>
    <button
      type="button"
      class="enquiry-btn enquiry-btn--outline"
      @click="emit('close')"
    >
      {{ copy.close }}
    </button>
  </div>

  <form
    v-else
    class="enquiry"
    novalidate
    :aria-busy="pending"
    @submit.prevent="onSubmit"
  >
    <div class="enquiry-field">
      <label :for="fieldId('name')" class="enquiry-label">
        {{ copy.name }}
        <span class="enquiry-required" aria-hidden="true">*</span>
      </label>
      <input
        :id="fieldId('name')"
        v-model="name"
        type="text"
        name="name"
        autocomplete="name"
        aria-required="true"
        :aria-invalid="!!errors.name"
        :aria-describedby="errors.name ? fieldId('name-error') : undefined"
        class="enquiry-input"
        :class="{ 'enquiry-input--invalid': errors.name }"
        @input="clearError('name')"
      />
      <p v-if="errors.name" :id="fieldId('name-error')" class="enquiry-error">
        {{ errors.name }}
      </p>
    </div>

    <div class="enquiry-row">
      <div class="enquiry-field">
        <label :for="fieldId('email')" class="enquiry-label">
          {{ copy.email }}
          <span class="enquiry-required" aria-hidden="true">*</span>
        </label>
        <input
          :id="fieldId('email')"
          v-model="email"
          type="email"
          name="email"
          inputmode="email"
          autocomplete="email"
          :aria-invalid="!!errors.email || !!errors.form"
          :aria-describedby="
            errors.email
              ? fieldId('email-error')
              : errors.form
                ? fieldId('form-error')
                : undefined
          "
          class="enquiry-input"
          :class="{ 'enquiry-input--invalid': errors.email }"
          @input="clearError('email')"
        />
        <p
          v-if="errors.email"
          :id="fieldId('email-error')"
          class="enquiry-error"
        >
          {{ errors.email }}
        </p>
      </div>

      <div class="enquiry-field">
        <label :for="fieldId('mobile')" class="enquiry-label">
          {{ copy.mobile }}
          <span class="enquiry-required" aria-hidden="true">*</span>
        </label>
        <input
          :id="fieldId('mobile')"
          v-model="mobile"
          type="tel"
          name="mobile"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+84"
          :aria-invalid="!!errors.mobile || !!errors.form"
          :aria-describedby="
            errors.mobile
              ? fieldId('mobile-error')
              : errors.form
                ? fieldId('form-error')
                : undefined
          "
          class="enquiry-input"
          :class="{ 'enquiry-input--invalid': errors.mobile }"
          @input="clearError('mobile')"
        />
        <p
          v-if="errors.mobile"
          :id="fieldId('mobile-error')"
          class="enquiry-error"
        >
          {{ errors.mobile }}
        </p>
      </div>
    </div>

    <div class="enquiry-field">
      <label :for="fieldId('note')" class="enquiry-label">
        {{ copy.note }}
      </label>
      <textarea
        :id="fieldId('note')"
        v-model="note"
        name="note"
        rows="4"
        :placeholder="copy.notePlaceholder"
        class="enquiry-input enquiry-textarea"
      />
    </div>

    <p
      v-if="errors.form"
      :id="fieldId('form-error')"
      class="enquiry-form-error"
      role="alert"
    >
      {{ errors.form }}
    </p>

    <div class="enquiry-actions">
      <button
        type="button"
        class="enquiry-btn enquiry-btn--outline"
        @click="emit('close')"
      >
        {{ copy.cancel }}
      </button>
      <button
        type="submit"
        class="enquiry-btn enquiry-btn--solid"
        :disabled="pending"
      >
        {{ pending ? copy.sending : copy.send }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.enquiry {
  @apply mt-7 flex flex-col gap-5 sm:mt-8;
}
.enquiry-row {
  @apply grid gap-5 sm:grid-cols-2;
}
.enquiry-field {
  @apply flex flex-col;
}
.enquiry-label {
  @apply mb-2 block text-[12px] uppercase tracking-label text-primary;
}
.enquiry-required {
  @apply ml-1 text-error;
}
.enquiry-input {
  @apply block w-full rounded-none border border-warm-600 bg-warm-50 px-4 py-3 text-base text-dark transition-colors placeholder:text-warm-800/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30;
}
.enquiry-input--invalid {
  @apply border-error focus:border-error focus:ring-error/30;
}
.enquiry-textarea {
  @apply min-h-[132px] resize-y;
}
.enquiry-error {
  @apply mt-1.5 text-[13px] text-error;
}
.enquiry-form-error {
  @apply border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error;
}
.enquiry-actions {
  @apply mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end;
}
.enquiry-btn {
  @apply inline-flex h-12 items-center justify-center px-6 text-[15px] font-medium tracking-wide transition-colors disabled:opacity-60 sm:h-[52px] sm:min-w-[132px];
}
.enquiry-btn--outline {
  @apply border border-primary text-primary hover:bg-primary hover:text-cream;
}
.enquiry-btn--solid {
  @apply border border-primary bg-primary text-cream hover:border-primary-hover hover:bg-primary-hover;
}
.enquiry-success {
  @apply mt-7 flex flex-col items-start gap-6 border border-warm-600 bg-warm-50 px-5 py-6 text-base text-dark sm:mt-8;
}
</style>
