<script setup lang="ts">
import { CtaBehavior, type Link, type Visit } from "../../../types";

const props = defineProps<Partial<Visit>>();

// Toạ độ CMS → "10.75,106.73": dùng cho bản đồ / nút chỉ đường khi Strapi
// chưa nhập sẵn link, tránh để component phụ thuộc vào mapEmbedUrl
const coords = computed(() =>
  props.latitude != null && props.longitude != null
    ? `${props.latitude},${props.longitude}`
    : null,
);

// Khung bản đồ: ưu tiên iframe CMS cấp; thiếu thì dựng embed từ toạ độ
// (Google Maps embed kiểu ?output=embed không cần API key)
const mapSrc = computed(() => {
  if (props.mapEmbedUrl) return props.mapEmbedUrl;
  return coords.value
    ? `https://maps.google.com/maps?q=${coords.value}&z=15&output=embed`
    : null;
});

// CTA "Get directions": link nội bộ đi qua localePath như mọi block khác;
// khi CMS mới để "#" thì mở Google Maps theo toạ độ để nút không chết.
const directions = computed<Link | null>(() => {
  const cta = props.directionsCta;
  if (!cta?.label) return null;

  const to = cta.to ?? "";
  if (to && to !== "#") return cta;
  if (!coords.value) return cta;

  return {
    ...cta,
    type: CtaBehavior.EXTERNAL,
    to: `https://www.google.com/maps/dir/?api=1&destination=${coords.value}`,
    newTab: true,
  };
});
</script>

<template>
  <section class="visit">
    <div class="visit-inner">
      <!-- === Bản đồ (6 cột): khung + đường viền lệch góc dưới-phải === -->
      <div class="visit-map">
        <div class="visit-map-outline" aria-hidden="true" />

        <!-- mapEmbedUrl (hoặc toạ độ) → iframe; chưa có → ảnh; cuối cùng là
             nền sọc chéo + ghim theo pinTitle/pinSubtitle của CMS -->
        <div v-if="mapSrc" class="visit-map-frame">
          <iframe
            class="visit-map-embed"
            :src="mapSrc"
            :title="props.pinTitle || 'Serene Saigon'"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          />
        </div>
        <div v-else-if="props.mapImage" class="visit-map-frame">
          <img
            class="visit-map-img"
            :src="props.mapImage.url"
            :alt="props.mapImage.alt"
            :width="props.mapImage.width"
            :height="props.mapImage.height"
          />
        </div>
        <div v-else class="visit-map-frame visit-map-placeholder">
          <span class="visit-map-pin" aria-hidden="true" />
          <p v-if="props.pinTitle" class="visit-map-pin-title">
            {{ props.pinTitle }}
          </p>
          <p v-if="props.pinSubtitle" class="visit-map-pin-subtitle">
            {{ props.pinSubtitle }}
          </p>
        </div>
      </div>

      <!-- === Cột chữ (5 cột từ cột 8) === -->
      <div class="visit-content">
        <p v-if="props.eyebrow" class="visit-eyebrow">{{ props.eyebrow }}</p>
        <h2 v-if="props.heading" class="visit-heading">
          {{ props.heading }}
        </h2>

        <!-- Liên hệ: địa chỉ → điện thoại/Zalo → email → ghi chú.
             Điện thoại, email, Zalo đều là link thật nhưng giữ đúng màu chữ
             của design (hover đổi màu theo style `a:hover` toàn cục) -->
        <div class="visit-info">
          <p v-if="props.address">{{ props.address }}</p>
          <p v-if="props.phone || props.zaloUrl" class="visit-info-line">
            <a
              v-if="props.phone"
              class="visit-contact"
              :href="`tel:${props.phone}`"
            >
              {{ props.phone }}
            </a>
            <template v-if="props.phone && props.zaloUrl"> · </template>
            <a
              v-if="props.zaloUrl"
              class="visit-contact"
              :href="props.zaloUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zalo
            </a>
          </p>
          <p v-if="props.email">
            <a class="visit-contact" :href="`mailto:${props.email}`">
              {{ props.email }}
            </a>
          </p>
          <p v-if="props.note">{{ props.note }}</p>
        </div>

        <!-- CTA chỉ đường -->
        <CtaLink
          v-if="directions"
          :link="directions"
          size="sm"
          tone="light"
        />

        <!-- Newsletter: ngăn cách bằng đường kẻ mảnh, nằm dưới CTA.
             CMS chưa có endpoint đăng ký nên form dừng ở mức UI: `prevent`
             để không reload trang, chờ route POST /api/newsletter -->
        <div
          v-if="props.newsletterText || props.emailPlaceholder"
          class="visit-news"
        >
          <p v-if="props.newsletterText" class="visit-news-text">
            {{ props.newsletterText }}
          </p>
          <form class="visit-news-form" @submit.prevent>
            <input
              class="visit-news-input"
              type="email"
              name="email"
              :placeholder="props.emailPlaceholder"
              :aria-label="props.emailPlaceholder"
              required
            />
            <button
              v-if="props.submitLabel"
              class="visit-news-submit"
              type="submit"
            >
              {{ props.submitLabel }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === Khung: 1 cột trên mobile; từ lg dựng lại lưới 12 cột của design drop
   (bản đồ 6 cột từ cột 1, chữ 5 cột từ cột 8). Nền #E8DAC4 = warm-400,
   padding 128px trên/dưới. === */
.visit {
  @apply bg-warm-400 py-20 sm:py-24 xl:py-32;
}
.visit-inner {
  @apply mx-auto flex w-full max-w-content flex-col gap-y-10 px-6 sm:px-10 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8 xl:px-16;
}

/* === Bản đồ === */
.visit-map {
  @apply relative lg:col-span-6 lg:col-start-1;
}
/* Đường viền lệch 24px về góc dưới-phải (design: inset 24px -24px -24px 24px);
   từ lg mới hiện vì mobile nó chạm mép màn hình */
.visit-map-outline {
  @apply pointer-events-none absolute hidden border border-warm-700 opacity-60 lg:block lg:-bottom-6 lg:-right-6 lg:left-6 lg:top-6;
}
/* Khung bản đồ: 4/3 trên mobile (bản đồ đọc ngang), 6/5 từ sm — chặn 560px
   như các block khác cho tablet nằm ngang — rồi cố định 440px từ lg, đúng
   chiều cao khung bản đồ trong design */
.visit-map-frame {
  @apply relative aspect-[4/3] max-h-[560px] w-full overflow-hidden bg-warm-500 sm:aspect-[6/5] lg:aspect-auto lg:h-[440px] lg:max-h-none;
}
.visit-map-embed {
  @apply block h-full w-full border-0;
}
.visit-map-img {
  @apply block h-full w-full object-cover;
}
/* Chưa có bản đồ: nâu nhạt + sọc chéo mảnh, ghim giữa khung */
.visit-map-placeholder {
  @apply flex flex-col items-center justify-center gap-1;
  background-image: repeating-linear-gradient(
    135deg,
    rgb(121 91 60 / 0.07) 0 1px,
    transparent 1px 14px
  );
}
.visit-map-pin {
  @apply mb-2 block h-3 w-3 rounded-full bg-primary ring-8 ring-primary/15;
}
.visit-map-pin-title {
  @apply text-base font-medium text-dark;
}
.visit-map-pin-subtitle {
  @apply text-sm text-warm-900;
}

/* === Cột chữ === */
.visit-content {
  @apply flex flex-col gap-6 lg:col-span-5 lg:col-start-8;
}
/* eyebrow: nhãn nhỏ, chữ hoa, giãn rộng, màu accent */
.visit-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-primary-hover;
}
/* heading: serif mảnh; 40px trong design +2px = 42px (ngoài thang token) —
   dùng font-size tuỳ ý để `leading-[1.12]` không bị line-height của media
   query đè như `sm:text-4xl` */
.visit-heading {
  @apply font-serif text-[clamp(2rem,3.2vw,2.625rem)] font-light leading-[1.12] tracking-[-0.005em] text-dark;
}

/* Thông tin liên hệ: 4 dòng, nhịp 6px như design; 18px = 16px +2px */
.visit-info {
  @apply flex flex-col gap-1.5 text-base leading-[1.6] text-warm-900;
}
.visit-info-line {
  @apply tabular-nums;
}
.visit-contact {
  @apply text-warm-900;
}

/* === Newsletter ===
   Design: cách CTA 8px, kẻ mảnh, rồi 28px trước dòng mô tả; ô nhập và nút
   dính liền nhau (ô nhập bỏ viền phải, nút giữ viền trái) */
.visit-news {
  @apply mt-2 flex flex-col gap-3 border-t border-warm-600 pt-7;
}
.visit-news-text {
  @apply text-base text-dark;
}
.visit-news-form {
  @apply flex;
}
.visit-news-input {
  @apply h-12 min-w-0 flex-1 border border-r-0 border-warm-600 bg-warm-100 px-3.5 text-base text-dark;
}
.visit-news-submit {
  @apply inline-flex h-12 shrink-0 items-center border border-primary bg-primary px-5 text-[17px] font-medium tracking-wide text-cream transition-colors duration-300 hover:bg-primary-hover hover:text-cream sm:px-[26px];
}
</style>
