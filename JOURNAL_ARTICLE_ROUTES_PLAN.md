# Journal blog routes & article pages

## Context

`/en/journal` và `/vi/tap-chi` hiện là **Page CMS** đi qua `app/pages/[...slug].vue` → `/api/pages/:slug` (chỉ nhận 1 segment). Vì vậy `/en/journal/<bài-viết>` không thể là một Page bình thường: endpoint page chỉ đọc segment đầu và sẽ render lại trang Journal.

Tách riêng một nhánh route tĩnh `app/pages/journal/` là đúng: Nuxt ưu tiên route cụ thể hơn catch-all, nên `journal/index.vue` và `journal/[slug].vue` sẽ thắng `[...slug].vue`; catch-all vẫn giữ nguyên cho các Page CMS còn lại.

**Slug theo từng locale (khác bản plan trước):** mỗi bản dịch có slug riêng, không dùng chung. Cùng một document (Strapi `documentId`) có 2 URL:

| | EN | VI |
|---|---|---|
| listing | `/en/journal` | `/vi/tap-chi` |
| article | `/en/journal/this-is-a-pen` | `/vi/tap-chi/day-la-mot-cay-but` |

Hệ quả kỹ thuật — đây là toàn bộ nội dung plan này giải quyết:

1. `slug` là field **localized** trong CMS; `documentId` (không phải slug) là thứ nối hai bản dịch.
2. BFF detail phải trả **slug của cả 2 locale** (`alternateSlugs`) bằng `populate: localizations`, để client map được khi đổi ngôn ngữ.
3. `switchLocalePath()` mặc định chỉ đổi prefix và **giữ nguyên param** → sẽ sinh `/vi/tap-chi/this-is-a-pen` (404). Trang chi tiết phải đăng ký slug từng locale qua `useSetI18nParams()`.
4. Navbar nằm trong layout nên render **trước** page setup ở SSR → link đổi ngôn ngữ phải dùng `SwitchLocalePathLink` (module i18n vá `href` ở hook `app:rendered`), không dùng `NuxtLink` với `switchLocalePath()`.
5. Canonical/hreflang cho 2 URL khác nhau: i18n sinh từ chính `useSetI18nParams()` (cần `i18n.baseUrl`).

Kết quả cuối:

- `/en/journal` + `/vi/tap-chi` — listing Journal (search/sort/pagination).
- `/en/journal/<slug-en>` + `/vi/tap-chi/<slug-vi>` — bài viết, SSR, SEO metadata, đổi ngôn ngữ giữ đúng bài.
- `/en/journal/<slug>/...` và `/en/<page>/...` — 404, không còn render nhầm page cha.

CMS hiện **chưa có collection bài viết** (đã kiểm tra DB/API: chỉ có `pages`, `club_events`, `event_venues`, `residences`). Plan này chỉ định nghĩa **contract** cho `journal-articles`; không sửa CMS đang chạy. Nếu CMS chưa có collection, phần landing vẫn code/typecheck được nhưng smoke test end-to-end phải dừng và báo thiếu prerequisite — không thêm mock/fallback.

## Approach

### 0. CMS prerequisite (không sửa CMS trong task này)

Landing code cần collection `journal-articles` do CMS owner thêm và cấp quyền cho API token. Contract chính xác:

`serene-headless-cms-v2/src/api/journal-article/content-types/journal-article/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "journal_articles",
  "info": {
    "singularName": "journal-article",
    "pluralName": "journal-articles",
    "displayName": "Journal article"
  },
  "options": { "draftAndPublish": true },
  "pluginOptions": { "i18n": { "localized": true } },
  "attributes": {
    "title": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } },
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "pluginOptions": { "i18n": { "localized": true } },
      "required": true
    },
    "author": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": false } },
      "required": true
    },
    "date": {
      "type": "date",
      "pluginOptions": { "i18n": { "localized": false } },
      "required": true
    },
    "cover": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"],
      "pluginOptions": { "i18n": { "localized": false } }
    },
    "lede": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "paragraphs": {
      "type": "component",
      "repeatable": true,
      "component": "journal.paragraph",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "seoDescription": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
}
```

`serene-headless-cms-v2/src/components/journal/paragraph.json`:

```json
{
  "collectionName": "components_journal_paragraphs",
  "info": { "displayName": "Paragraph", "icon": "align-left" },
  "options": {},
  "attributes": {
    "text": { "type": "text", "required": true }
  }
}
```

Khác bản trước: `slug` là **localized** (mỗi locale một slug), `author`/`date`/`cover` vẫn non-localized (dùng chung cho cả document).

Yêu cầu vận hành:

- API token có `find` + `findOne` cho `api::journal-article.journal-article`.
- Routes/controllers/services dùng pattern hiện có: `factories.createCoreRouter/Controller/Service('api::journal-article.journal-article')`; không cần custom logic.
- Publish **ít nhất 1 cặp bài EN/VI là localization của cùng document**; mỗi bản có `title`, `slug`, `author`, `date`, `cover`, `lede`, `paragraphs`.
- Quy trình tạo (để slug đúng ý):
  1. Tạo entry EN, bấm Generate slug từ title EN → ví dụ `this-is-a-pen`.
  2. Tạo localization VI từ entry EN, bấm Generate slug từ title VI → ví dụ `day-la-mot-cay-but`. **Không copy slug EN.**
  3. Sửa slug ở locale này **không** làm đổi slug locale kia (vì field đã localized); đổi slug = đổi URL, phải chấp nhận URL cũ mất (không có redirect trong scope).
- Editorial rule (bắt buộc cho UI đổi ngôn ngữ, xem Assumptions): một document chỉ được coi là "live" khi **có đủ bản EN và VI**. Thiếu một locale ⇒ switcher/hreflang trỏ tới URL 404 (content gap), frontend không fallback.
- `uid` được Strapi coi là unique ở mức collection (không unique theo locale) — plan **không** dựa vào việc 2 locale dùng trùng slug, nên ràng buộc này không ảnh hưởng. Kiểm tra nhanh khi tạo: lưu VI với slug trùng hệt slug EN; nếu Strapi chặn → đúng giả định, dùng slug khác nhau như yêu cầu; nếu cho phép → cũng không ảnh hưởng plan.
- Nếu CMS owner muốn **cho phép** trùng slug giữa 2 locale, phải đổi `slug` sang `"type": "string"` + tự enforce unique theo locale bằng lifecycle hook — ngoài scope landing, contract URL/BFF không đổi.
- `author`/`date`/`cover` là non-localized: Strapi đồng bộ giá trị giữa các locale khi publish (`syncNonLocalizedAttributes`), nên sửa ở bản VI có thể ghi đè bản EN — giữ 2 bản giống nhau.
- Không thêm cột/field nào khác trong task landing.

### 1. Route foundation: locale lấy từ path + chặn catch-all nhiều segment

**New `app/composables/useRouteLocale.ts`** (auto-import):

```ts
import type { ComputedRef } from "vue";

export type ContentLocale = "en" | "vi";

// Locale lấy từ route.path (không lấy từ useI18n().locale) để đổi cùng nhịp
// với slug => auto-key của useFetch chỉ đổi 1 lần khi navigate.
export function useRouteLocale(): ComputedRef<ContentLocale> {
  const route = useRoute();
  const { locales, defaultLocale } = useI18n();

  const localeCodes = computed<string[]>(() =>
    locales.value.map((l) => (typeof l === "string" ? l : l.code)),
  );

  return computed(() => {
    const first = route.path.split("/").find(Boolean);
    return (first && localeCodes.value.includes(first)
      ? first
      : defaultLocale || "en") as ContentLocale;
  });
}
```

**Edit `app/pages/[...slug].vue`:**

- Xoá block `const { locales, defaultLocale } = useI18n()` + `localeCodes` + `locale` hiện tại; thay bằng `const locale = useRouteLocale();`.
- Thêm `definePageMeta` ngay đầu `<script setup>` (sau imports) để chặn catch-all nhận nhiều segment. Đây là fix SEO: hiện `/en/the-club/abc` vẫn render page `the-club`; sau fix trả 404.

```ts
definePageMeta({
  validate(to) {
    const raw = to.params.slug;
    const segments = Array.isArray(raw) ? raw : [String(raw ?? "")];
    return segments.filter(Boolean).length <= 1;
  },
});
```

- Giữ nguyên `slug` computed (`segments[0] || "home"`), `useFetch`, error throw và `useSeoMeta`.
- `validate` chạy cả SSR lẫn client navigation; route bài viết `/en/journal/<slug>` không đi qua page này nên không bị ảnh hưởng.

**Edit `nuxt.config.ts` — thêm `i18n.baseUrl`:**

```ts
i18n: {
  baseUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
  defaultLocale: "en",
  strategy: "prefix", // "prefix_except_default"
  locales: [
    { code: "en", language: "en-US", name: "EN" },
    { code: "vi", language: "vi-VN", name: "VI" },
  ],
},
```

- `useSetI18nParams()` ở step 4 luôn dựng lại head context của i18n; thiếu `baseUrl` ⇒ `console.warn("I18n \`baseUrl\` is required to generate valid SEO tag links.")` trên **mọi** lần gọi (kể cả production). `baseUrl` cũng là thứ làm canonical/hreflang thành URL tuyệt đối.
- Production override bằng env `NUXT_PUBLIC_I18N_BASE_URL` (module copy `baseUrl` vào `runtimeConfig.public.i18n`, nên Nuxt env override có tác dụng) — không sửa gì khác trong `nuxt.config.ts`.

### 2. Types + BFF endpoints

**Edit `types/index.ts`** — thêm sau nhóm `EventVenuesResponse`:

```ts
// Journal (collection `journal-articles`) — shape trả về của /api/journal
export type JournalArticleSummary = {
  id: number;
  slug: string; // slug của locale đang request
  title: string;
  author: string;
  date: string; // YYYY-MM-DD — format ở client theo locale
  cover: Media | null;
};

export type JournalArticlesResponse = {
  articles: JournalArticleSummary[];
};

// Slug của TỪNG locale cho cùng một document (null = locale chưa có bản dịch)
export type JournalAlternateSlugs = {
  en: string | null;
  vi: string | null;
};

export type JournalArticleDetail = JournalArticleSummary & {
  lede: string | null;
  paragraphs: string[];
  description: string | null; // seoDescription || lede || paragraph đầu
  alternateSlugs: JournalAlternateSlugs;
};
```

**Edit `server/types/strapi.ts`** — thêm sau `StrapiEventVenue`:

```ts
// Journal (collection `journal-articles`)
export type StrapiJournalParagraph = {
  id: number;
  text: string;
};

// `localizations` = các bản dịch khác của cùng document (Strapi trả kèm
// `locale` cho từng entry, kể cả khi chỉ populate `slug`).
export type StrapiJournalLocalization = {
  slug: string;
  locale: string;
};

export type StrapiJournalArticle = {
  id: number;
  documentId: string;
  locale: string;
  title: string;
  slug: string;
  author: string;
  date: string; // YYYY-MM-DD
  cover?: StrapiMedia | null;
  localizations?: StrapiJournalLocalization[] | null;
  lede?: string | null;
  paragraphs?: StrapiJournalParagraph[] | null;
  seoDescription?: string | null;
};
```

**New `server/api/journal/index.get.ts`:**

```ts
import type { JournalArticlesResponse } from "../../../types";
import type { StrapiJournalArticle, StrapiList } from "../../types/strapi";
import { fetchCMS } from "../../utils/fetch-strapi.ts";
import { resolveLocale } from "../../utils/locale";
import { handleStrapiError } from "../../utils/errors";
import { mapMedia } from "../../utils/mapper.ts";

export type { JournalArticlesResponse };

export default defineEventHandler(
  async (event): Promise<JournalArticlesResponse> => {
    const { strapiUrl } = useRuntimeConfig();
    const locale = resolveLocale(event);

    let response: StrapiList<StrapiJournalArticle>;

    try {
      response = await fetchCMS<StrapiList<StrapiJournalArticle>>(
        "/journal-articles",
        {
          locale,
          sort: "date:desc",
          pagination: { pageSize: 100 },
          populate: {
            cover: {
              fields: ["url", "alternativeText", "width", "height"],
            },
          },
        },
      );
    } catch (err) {
      handleStrapiError(err, "GET /api/journal/" + locale);
    }

    // `slug` trả về là slug của locale đang request — card dựng link trực tiếp,
    // không cần alternateSlugs ở listing.
    return {
      articles: response.data.map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        author: article.author,
        date: article.date,
        cover: article.cover ? mapMedia(article.cover, strapiUrl) : null,
      })),
    };
  },
);
```

**New `server/api/journal/[slug].get.ts`:**

```ts
import type { JournalArticleDetail } from "../../../types";
import type { StrapiJournalArticle, StrapiList } from "../../types/strapi";
import { fetchCMS } from "../../utils/fetch-strapi.ts";
import { resolveLocale } from "../../utils/locale";
import { handleStrapiError } from "../../utils/errors";
import { mapMedia } from "../../utils/mapper.ts";

export type { JournalArticleDetail };

export default defineEventHandler(
  async (event): Promise<JournalArticleDetail> => {
    const { strapiUrl } = useRuntimeConfig();
    const locale = resolveLocale(event);
    const slug = getRouterParam(event, "slug");

    if (!slug) {
      throw createError({
        statusCode: 404,
        statusMessage: "Article not found",
      });
    }

    let response: StrapiList<StrapiJournalArticle>;

    try {
      // Slug là localized => luôn lọc theo cả slug + locale.
      // `localizations` cho biết slug của locale còn lại (đổi ngôn ngữ).
      response = await fetchCMS<StrapiList<StrapiJournalArticle>>(
        "/journal-articles",
        {
          locale,
          filters: { slug: { $eq: slug } },
          populate: {
            cover: {
              fields: ["url", "alternativeText", "width", "height"],
            },
            paragraphs: { fields: ["text"] },
            localizations: { fields: ["slug"] },
          },
        },
      );
    } catch (err) {
      handleStrapiError(err, `GET /api/journal/${slug}/${locale}`);
    }

    const article = response.data[0];

    if (!article) {
      throw createError({
        statusCode: 404,
        statusMessage: "Article not found",
      });
    }

    const alternateSlugs: JournalArticleDetail["alternateSlugs"] = {
      en: null,
      vi: null,
    };

    if (article.locale === "en" || article.locale === "vi") {
      alternateSlugs[article.locale] = article.slug;
    }

    for (const localization of article.localizations ?? []) {
      if (localization.locale === "en" || localization.locale === "vi") {
        alternateSlugs[localization.locale] = localization.slug;
      }
    }

    const paragraphs = (article.paragraphs ?? [])
      .map((paragraph) => paragraph.text.trim())
      .filter(Boolean);

    const lede = article.lede?.trim() || null;
    const description =
      article.seoDescription?.trim() || lede || paragraphs[0] || null;

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      author: article.author,
      date: article.date,
      cover: article.cover ? mapMedia(article.cover, strapiUrl) : null,
      lede,
      paragraphs,
      description,
      alternateSlugs,
    };
  },
);
```

Response contract:

```json
// GET /api/journal?locale=vi
{
  "articles": [
    {
      "id": 2,
      "slug": "day-la-mot-cay-but",
      "title": "Đây là một cây bút",
      "author": "Linh Trần",
      "date": "2026-09-12",
      "cover": {
        "url": "http://localhost:1337/uploads/hero.jpg",
        "alt": "",
        "width": 1600,
        "height": 1200
      }
    }
  ]
}
```

```json
// GET /api/journal/this-is-a-pen?locale=en
{
  "id": 1,
  "slug": "this-is-a-pen",
  "title": "This is a pen",
  "author": "Linh Trần",
  "date": "2026-09-12",
  "cover": { "url": "http://localhost:1337/uploads/hero.jpg", "alt": "" },
  "lede": "Some evenings at the club begin long before anyone sits down.",
  "paragraphs": [
    "We started keeping this journal to hold on to the small things.",
    "This entry is a placeholder for the full story."
  ],
  "description": "Some evenings at the club begin long before anyone sits down.",
  "alternateSlugs": { "en": "this-is-a-pen", "vi": "day-la-mot-cay-but" }
}
```

- Không dùng top-level `fields` cùng `populate`: dễ làm Strapi bỏ media/relation khỏi response; payload journal nhỏ nên trả đủ scalar fields.
- `localizations` chỉ populate `slug`; `locale` là field top-level của mỗi entry nên vẫn có trong response. Nếu bản Strapi đang chạy không trả `locale` (xem Assumptions), fallback query theo locale.
- `mapMedia` tự absolutize URL Strapi và default `alt` = `""`.
- `handleStrapiError` giữ prefix `[Strapi]`; 404 bài không tồn tại là `createError(404, "Article not found")`. Vì slug localized, `/api/journal/<slug-vi>?locale=en` cũng trả 404 — đúng, không phải bug.

### 3. Listing route + UI

**New `app/pages/journal/index.vue`.**

> Thứ tự thi công: tạo **cả** `journal/index.vue` và `journal/[slug].vue` (route + fetch tối thiểu) trước khi chạy typecheck/smoke. `JournalCard` dùng named route `journal-slug`, nên route detail phải tồn tại; phần UI detail đầy đủ ở step 4.

Script:

```ts
import JournalCard from "~/components/JournalCard.vue";
import { type JournalArticlesResponse } from "../../../types";

defineI18nRoute({
  paths: { en: "/journal", vi: "/tap-chi" },
});

const locale = useRouteLocale();

const { data, error } = await useFetch<JournalArticlesResponse>(
  "/api/journal",
  { query: { locale } },
);

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 500,
    statusMessage: error.value?.statusMessage ?? "Unable to fetch journal",
    fatal: true,
  });
}

const articles = computed(() => data.value?.articles ?? []);
const searchTerm = ref("");
const sortOrder = ref<"new" | "old">("new");

const filtered = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  const list = articles.value.filter(
    (article) =>
      !term ||
      article.title.toLowerCase().includes(term) ||
      article.author.toLowerCase().includes(term),
  );

  return [...list].sort((a, b) =>
    sortOrder.value === "new"
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date),
  );
});

const PAGE_SIZE = 6;
const { page, pageCount, pageItems, hasPrev, hasNext, goTo } = usePagination(
  filtered,
  PAGE_SIZE,
);

const labels = computed(() =>
  locale.value === "vi"
    ? {
        eyebrow: "Tạp chí",
        heading: "Ghi chép từ ngôi nhà bên sông",
        description:
          "Ghi chép về kiến trúc, ẩm thực, sức khỏe và những nghi thức tĩnh tại của câu lạc bộ.",
        searchLabel: "Tìm bài viết",
        searchPlaceholder: "Tìm theo tiêu đề hoặc tác giả",
        sortLabel: "Sắp xếp",
        latest: "Mới nhất",
        oldest: "Cũ nhất",
        empty: "Không tìm thấy bài viết phù hợp.",
        previous: "Trang trước",
        next: "Trang sau",
        pageWord: "Trang",
      }
    : {
        eyebrow: "Journal",
        heading: "Notes from the river house",
        description:
          "Dispatches on architecture, food, wellness and the quiet rituals of the club.",
        searchLabel: "Search journal entries",
        searchPlaceholder: "Search by title or author",
        sortLabel: "Sort",
        latest: "Latest first",
        oldest: "Oldest first",
        empty: "No journal entries match your search.",
        previous: "Previous page",
        next: "Next page",
        pageWord: "Page",
      },
);

// `goTo` từ usePagination chỉ đổi trang; cuộn lên đầu như design
const goToPage = (target: number) => {
  goTo(target);
  window.scrollTo(0, 0);
};

useSeoMeta({
  title: () => labels.value.heading,
  description: () => labels.value.description,
});
```

Template:

```vue
<template>
  <main class="journal">
    <section class="journal-inner">
      <div class="journal-head">
        <div class="journal-head-lead">
          <p class="journal-eyebrow">{{ labels.eyebrow }}</p>
          <h1 class="journal-heading">{{ labels.heading }}</h1>
        </div>

        <div class="journal-controls">
          <label class="journal-search">
            <span class="sr-only">{{ labels.searchLabel }}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              v-model="searchTerm"
              type="search"
              :placeholder="labels.searchPlaceholder"
            />
          </label>

          <label class="journal-sort">
            <span class="journal-sort-label">{{ labels.sortLabel }}</span>
            <select v-model="sortOrder">
              <option value="new">{{ labels.latest }}</option>
              <option value="old">{{ labels.oldest }}</option>
            </select>
          </label>
        </div>
      </div>

      <p v-if="!pageItems.length" class="journal-empty">
        {{ labels.empty }}
      </p>

      <div v-else class="journal-grid">
        <JournalCard
          v-for="article in pageItems"
          :key="article.id"
          :article="article"
          :locale="locale"
        />
      </div>

      <nav
        v-if="pageCount > 1"
        class="journal-pagination"
        :aria-label="labels.pageWord"
      >
        <button
          type="button"
          class="journal-page-btn"
          :disabled="!hasPrev"
          :aria-label="labels.previous"
          @click="goToPage(page - 1)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M11 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          v-for="n in pageCount"
          :key="n"
          type="button"
          class="journal-page-btn"
          :class="{ 'journal-page-btn--active': n === page }"
          :aria-current="n === page ? 'page' : undefined"
          :aria-label="`${labels.pageWord} ${n}`"
          @click="goToPage(n)"
        >
          {{ n }}
        </button>

        <button
          type="button"
          class="journal-page-btn"
          :disabled="!hasNext"
          :aria-label="labels.next"
          @click="goToPage(page + 1)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </nav>
    </section>
  </main>
</template>
```

Scoped CSS (giá trị theo design drop `temp/Serene Saigon.dc.html` dòng 710–748, map sang token của app):

```css
.journal {
  @apply bg-cream text-dark;
}
.journal-inner {
  @apply mx-auto w-full max-w-content px-6 pb-24 pt-16 sm:px-10 sm:pt-20 lg:pb-32 xl:px-16;
}
.journal-head {
  @apply flex flex-col gap-6 border-b border-warm-600 pb-5 lg:flex-row lg:items-end lg:justify-between;
}
.journal-head-lead {
  @apply flex flex-col gap-2;
}
.journal-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-muted;
}
.journal-heading {
  @apply font-serif text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.005em];
}
.journal-controls {
  @apply flex flex-wrap items-center gap-4;
}
.journal-search {
  @apply relative flex h-[42px] w-[320px] max-w-full items-center;
}
.journal-search svg {
  @apply pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-muted;
}
.journal-search input {
  @apply h-full w-full border border-warm-600 bg-warm-50 pr-3.5 pl-[42px] text-sm text-dark outline-none focus:border-primary;
}
.journal-sort {
  @apply flex items-center gap-3;
}
.journal-sort-label {
  @apply text-[11px] font-medium uppercase tracking-label text-muted;
}
.journal-sort select {
  @apply h-[42px] border border-warm-600 bg-warm-50 px-3 text-sm text-dark outline-none focus:border-primary;
}
.journal-empty {
  @apply py-12 text-[17px] text-warm-900;
}
.journal-grid {
  @apply grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3;
}
.journal-pagination {
  @apply mt-6 flex items-center justify-center gap-2 border-t border-warm-600 pt-6;
}
.journal-page-btn {
  @apply inline-flex h-[42px] min-w-[42px] items-center justify-center border border-warm-600 px-2 text-[15px] tabular-nums text-dark transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40;
}
.journal-page-btn--active {
  @apply border-primary bg-primary text-cream hover:text-cream;
}
```

**New `app/components/JournalCard.vue`:**

```vue
<script setup lang="ts">
import type { JournalArticleSummary } from "../../types";
import type { ContentLocale } from "~/composables/useRouteLocale";
import { formatLongDate } from "~/utils/format-date";

const props = defineProps<{
  article: JournalArticleSummary;
  locale: ContentLocale;
}>();

const localePath = useLocalePath();

const dateLabel = computed(() =>
  formatLongDate(props.article.date, props.locale),
);

// `article.slug` đã là slug của locale đang xem (BFF lọc theo locale).
// Dùng named route: localePath() với path động không map được localized route
// khi strategy = "prefix" (xem utils.js của @nuxtjs/i18n).
const to = computed(() =>
  localePath(
    {
      name: "journal-slug",
      params: { slug: props.article.slug },
    },
    props.locale,
  ),
);
</script>

<template>
  <NuxtLink :to="to" class="journal-card fade">
    <div class="journal-card-media">
      <img
        v-if="article.cover"
        class="journal-card-img"
        :src="article.cover.url"
        :alt="article.cover.alt"
        :width="article.cover.width"
        :height="article.cover.height"
        loading="lazy"
      />
      <div v-else class="journal-card-placeholder" aria-hidden="true" />
    </div>

    <div class="journal-card-body">
      <h2 class="journal-card-title">{{ article.title }}</h2>
      <p class="journal-card-meta">
        <span>{{ article.author }}</span>
        <template v-if="dateLabel">
          <span class="journal-card-dot" aria-hidden="true" />
          <span>{{ dateLabel }}</span>
        </template>
      </p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.journal-card {
  @apply flex flex-col gap-[18px] text-dark;
}
.journal-card-media {
  @apply aspect-[4/3] overflow-hidden bg-warm-500;
}
.journal-card-img {
  @apply h-full w-full object-cover;
}
.journal-card-body {
  @apply flex flex-col gap-2.5;
}
.journal-card-title {
  @apply font-serif text-xl font-normal leading-[1.3] transition-colors;
}
.journal-card:hover .journal-card-title {
  @apply text-primary;
}
.journal-card-meta {
  @apply flex items-center gap-2.5 text-sm text-warm-900;
}
.journal-card-dot {
  @apply h-[3px] w-[3px] shrink-0 bg-muted;
}
</style>
```

**New `app/utils/format-date.ts`:**

```ts
const FORMATTERS = {
  en: new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }),
  vi: new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }),
};

// Strapi `date` trả YYYY-MM-DD (hoặc datetime ISO). Dựng Date bằng UTC để
// SSR/client ra cùng một chuỗi, không lệch ngày vì timezone máy chạy.
export function formatLongDate(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "";

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  return (locale === "vi" ? FORMATTERS.vi : FORMATTERS.en).format(date);
}
```

### 4. Article detail route + SEO + per-locale slug

**New `app/pages/journal/[slug].vue`.**

Script:

```ts
import { type JournalArticleDetail } from "../../../types";
import { formatLongDate } from "~/utils/format-date";

defineI18nRoute({
  paths: { en: "/journal/[slug]", vi: "/tap-chi/[slug]" },
});

const route = useRoute();
const locale = useRouteLocale();
const localePath = useLocalePath();

const slug = computed(() => {
  const params = route.params.slug;
  return Array.isArray(params) ? params[0] ?? "" : String(params ?? "");
});

if (!slug.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Article not found",
    fatal: true,
  });
}

// Slug là localized => mỗi locale gọi BFF với slug của chính nó.
const { data: article, error } = await useFetch<JournalArticleDetail>(
  () => `/api/journal/${slug.value}`,
  { query: { locale } },
);

if (error.value || !article.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: error.value?.statusMessage ?? "Article not found",
    fatal: true,
  });
}

// Đăng ký slug của từng locale cho i18n. Nhờ vậy:
//  - switchLocalePath("vi") => /vi/tap-chi/<slug-vi> (không giữ slug EN)
//  - i18n sinh canonical + hreflang + og:locale theo đúng cặp slug
// Truyền object rỗng để bật phần SEO của useSetI18nParams (không truyền
// options thì i18n chỉ set params, không sinh head tags).
// i18n không có API "disable route của locale chưa dịch" khi strictSeo tắt,
// nên locale thiếu bản dịch được đánh dấu `false` (đúng ngữ nghĩa) và sẽ
// trỏ tới URL 404 — content gap, xem Assumptions.
const setI18nParams = useSetI18nParams({});

watch(
  article,
  (value) => {
    if (!value) return;

    const { en, vi } = value.alternateSlugs;
    setI18nParams({
      en: en ? { slug: en } : false,
      vi: vi ? { slug: vi } : false,
    });
  },
  { immediate: true },
);

// i18n ghi params vào meta của route hiện tại và giữ lại khi route đổi.
// Xoá trước khi rời trang để switchLocalePath ở page khác (nhất là catch-all
// [...slug] dùng chung tên param `slug`) không bị dính slug bài viết.
onBeforeRouteLeave(() => {
  setI18nParams({});
});

const dateLabel = computed(() =>
  article.value ? formatLongDate(article.value.date, locale.value) : "",
);

const labels = computed(() =>
  locale.value === "vi"
    ? { eyebrow: "Tạp chí", back: "Tất cả bài viết" }
    : { eyebrow: "Journal", back: "All journal entries" },
);

const backTo = computed(() =>
  localePath({ name: "journal" }, locale.value),
);

// canonical/hreflang do useSetI18nParams sinh (dùng alternateSlugs ở trên),
// nên ở đây chỉ đặt title/description/OpenGraph.
useSeoMeta({
  title: () => article.value?.title ?? "Journal",
  description: () => article.value?.description ?? "",
  ogTitle: () => article.value?.title ?? "",
  ogDescription: () => article.value?.description ?? "",
  ogImage: () => article.value?.cover?.url,
  ogType: "article",
  articlePublishedTime: () => article.value?.date,
  articleAuthor: () => (article.value ? [article.value.author] : []),
});
```

Template:

```vue
<template>
  <main v-if="article" class="article">
    <article>
      <div class="article-head-wrap">
        <NuxtLink :to="backTo" class="article-back">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M11 18l-6-6 6-6" />
          </svg>
          <span>{{ labels.back }}</span>
        </NuxtLink>

        <header class="article-head">
          <p class="article-eyebrow">{{ labels.eyebrow }}</p>
          <h1 class="article-title">{{ article.title }}</h1>
          <p class="article-meta">
            <span>{{ article.author }}</span>
            <template v-if="dateLabel">
              <span class="article-meta-dot" aria-hidden="true" />
              <span>{{ dateLabel }}</span>
            </template>
          </p>
        </header>
      </div>

      <div v-if="article.cover" class="article-cover">
        <div class="article-cover-frame">
          <img
            class="article-cover-img"
            :src="article.cover.url"
            :alt="article.cover.alt"
            :width="article.cover.width"
            :height="article.cover.height"
          />
        </div>
      </div>

      <div
        v-if="article.lede || article.paragraphs.length"
        class="article-body"
      >
        <p v-if="article.lede" class="article-lede">{{ article.lede }}</p>
        <p
          v-for="(paragraph, index) in article.paragraphs"
          :key="index"
          class="article-paragraph"
        >
          {{ paragraph }}
        </p>
      </div>
    </article>
  </main>
</template>
```

Scoped CSS (design drop dòng 752–768):

```css
.article {
  @apply bg-cream text-dark pb-24 lg:pb-32;
}
.article-head-wrap {
  @apply mx-auto w-full max-w-[760px] px-6 pt-16 sm:px-8 sm:pt-20;
}
.article-back {
  @apply inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover;
}
.article-head {
  @apply mt-8 flex flex-col gap-[18px];
}
.article-eyebrow {
  @apply text-xs font-medium uppercase tracking-label text-muted;
}
.article-title {
  @apply font-serif text-[clamp(2.25rem,4vw,3.125rem)] font-light leading-[1.12] tracking-[-0.005em];
}
.article-meta {
  @apply flex items-center gap-2.5 text-[15px] text-warm-900;
}
.article-meta-dot {
  @apply h-[3px] w-[3px] shrink-0 bg-muted;
}
.article-cover {
  @apply mx-auto mt-10 w-full max-w-[1120px] px-6 sm:px-8;
}
.article-cover-frame {
  @apply aspect-[16/9] overflow-hidden bg-warm-500;
}
.article-cover-img {
  @apply h-full w-full object-cover;
}
.article-body {
  @apply mx-auto mt-14 flex w-full max-w-[680px] flex-col gap-6 px-6 sm:px-8;
}
.article-lede {
  @apply font-serif text-[24px] font-light leading-[1.5];
}
.article-paragraph {
  @apply text-base leading-[1.75] text-warm-900;
}
```

- `defineI18nRoute` đặt trong `<script setup>`; module extract literal lúc build. Không cần sửa `nuxt.config.ts` cho phần route (chỉ `baseUrl` ở step 1).
- `useSetI18nParams` phải gọi ở top-level setup (nó gọi `useHead`); setter gọi trong `watch` để client navigation giữa 2 bài cập nhật lại slug.
- `alternateSlugs` lấy từ BFF, không suy đoán slug ở client.
- Nếu một locale chưa có bản dịch, URL của locale đó không tồn tại → BFF trả 404; `setI18nParams` đánh dấu `false` cho locale đó (ngữ nghĩa "không có route"), nhưng với `strictSeo: false` (mặc định) i18n vẫn sinh link/hreflang dạng đổi prefix giữ param cũ ⇒ trỏ tới 404. Đây là content gap; editorial rule ở step 0 bắt buộc đủ cặp EN/VI.

### 5. Navbar: active state + link đổi ngôn ngữ theo slug từng locale

**Edit `app/components/Navbar.vue`.**

**(a) Active state cho Journal trên article page** — thêm helper ngay sau `isActive` (khoảng dòng 212):

```ts
// Mục đang active khi path trùng hoặc nằm dưới mục đó
// (ví dụ /en/journal/<slug> vẫn làm Journal active).
const isSectionActive = (l?: MenuItem) => {
  if (!l || !l.to || l.to === "#") return false;
  if (isActive(l)) return true;
  return route.path.startsWith(localePath(l.to) + "/");
};
```

Desktop utility link (khoảng dòng 345):

```vue
<NuxtLink
  v-if="navItem.utilityLink"
  v-bind="linkProps(navItem.utilityLink)"
  :class="[
    'nav-utility-link',
    { 'nav-utility-link--active': isSectionActive(navItem.utilityLink) },
  ]"
  :aria-current="
    isSectionActive(navItem.utilityLink) ? 'page' : undefined
  "
>
  {{ navItem.utilityLink.label }}
</NuxtLink>
```

Drawer utility link (khoảng dòng 548):

```vue
<NuxtLink
  v-if="navItem.utilityLink"
  v-bind="linkProps(navItem.utilityLink)"
  :class="[
    'nav-drawer-utility-link',
    {
      'nav-drawer-utility-link--active': isSectionActive(
        navItem.utilityLink,
      ),
    },
  ]"
  :aria-current="
    isSectionActive(navItem.utilityLink) ? 'page' : undefined
  "
>
  {{ navItem.utilityLink.label }}
</NuxtLink>
```

CSS thêm cạnh `.nav-utility-link` và `.nav-drawer-utility-link`:

```css
.nav-utility-link--active {
  @apply border-b border-current pb-0.5 font-medium text-primary;
}
.nav-header--transparent .nav-utility-link--active {
  @apply text-cream;
}
.nav-drawer-utility-link--active {
  @apply text-cream underline underline-offset-4;
}
```

**(b) Link đổi ngôn ngữ phải dùng slug của locale đích.**

Thay `localizedPath` (dòng ~76–95) bằng: giữ nguyên phần map theo `documentId` cho menu, nhưng tách "có target trong menu" khỏi "fallback của i18n"; fallback giao cho component `SwitchLocalePathLink` của i18n (component này đọc `switchLocalePath()` lúc render, và plugin `switch-locale-path-ssr` của module vá lại `href` trong SSR ở hook `app:rendered` — đúng thời điểm params đã được page set, nên HTML trả về crawler đúng slug từng locale).

```ts
// Trang đang xem có mục menu tương ứng ở locale đích không (map theo
// documentId). null => không phải trang menu (ví dụ bài viết Journal) và
// phải để i18n tự resolve slug theo useSetI18nParams của page.
const menuLangTarget = (targetCode: string) => {
  const current = flatByLocale.value[locale.value]?.find(
    (i) => localePath(i.to!) === route.path,
  );
  if (!current) return null;

  const target = flatByLocale.value[targetCode]?.find(
    (i) => i.documentId === current.documentId,
  );

  return target?.to ? localePath(target.to, targetCode as any) : null;
};

// Tính 1 lần cho cả desktop + drawer
const langTargets = computed<Record<string, string | null>>(() =>
  Object.fromEntries(
    localeCodes.value.map((code) => [code, menuLangTarget(code)]),
  ),
);
```

- Xoá `const switchLocalePath = useSwitchLocalePath();` (dòng ~14) nếu không còn dùng ở chỗ khác — `SwitchLocalePathLink` tự gọi bên trong.
- Xoá hàm `localizedPath` cũ.

Desktop (dòng ~355–366):

```vue
<template
  v-for="(availableLocale, index) in locales"
  :key="availableLocale.code"
>
  <span v-if="index > 0" class="nav-lang-sep">/</span>
  <SwitchLocalePathLink
    v-if="!langTargets[availableLocale.code]"
    :locale="availableLocale.code"
    :class="[
      'nav-lang-link',
      { 'nav-lang-link--active': locale === availableLocale.code },
    ]"
  >
    {{ availableLocale.code.toUpperCase() }}
  </SwitchLocalePathLink>
  <NuxtLink
    v-else
    :to="langTargets[availableLocale.code] ?? '#'"
    :class="[
      'nav-lang-link',
      { 'nav-lang-link--active': locale === availableLocale.code },
    ]"
  >
    {{ availableLocale.code.toUpperCase() }}
  </NuxtLink>
</template>
```

Drawer (dòng ~558–575), giữ `markLocaleSwitch`:

```vue
<template
  v-for="(availableLocale, index) in locales"
  :key="availableLocale.code"
>
  <span v-if="index > 0" class="nav-drawer-lang-sep">/</span>
  <SwitchLocalePathLink
    v-if="!langTargets[availableLocale.code]"
    :locale="availableLocale.code"
    :class="[
      'nav-drawer-lang-link',
      {
        'nav-drawer-lang-link--active':
          locale === availableLocale.code,
      },
    ]"
    @click="markLocaleSwitch(availableLocale.code)"
  >
    {{ availableLocale.code.toUpperCase() }}
  </SwitchLocalePathLink>
  <NuxtLink
    v-else
    :to="langTargets[availableLocale.code] ?? '#'"
    :class="[
      'nav-drawer-lang-link',
      {
        'nav-drawer-lang-link--active':
          locale === availableLocale.code,
      },
    ]"
    @click="markLocaleSwitch(availableLocale.code)"
  >
    {{ availableLocale.code.toUpperCase() }}
  </NuxtLink>
</template>
```

- `SwitchLocalePathLink` được `@nuxtjs/i18n` đăng ký global (không cần import) và nhận `class`/`@click` qua attrs; `@click` merge với handler nội bộ của component.
- Không sửa `mapLink`, `/api/navigation`, hay target page trong CMS: EN utility link đang trỏ `/journal`, VI trỏ `/tap-chi`; hai path này khớp `defineI18nRoute` ở trên.

## Critical files & anchors

| File | Region / symbol | Vì sao |
|---|---|---|
| `app/pages/[...slug].vue` | `slug` computed + `definePageMeta({ validate })` | Catch-all phải 404 với >1 segment; nếu không `/en/journal/<slug>/...` render nhầm page cha. |
| `nuxt.config.ts` | `i18n.baseUrl` | `useSetI18nParams` warn nếu thiếu; canonical/hreflang thành URL tuyệt đối. |
| `server/api/journal/[slug].get.ts` | Query `slug + locale`, `populate.localizations`, dựng `alternateSlugs` | Nguồn detail + cặp slug để đổi ngôn ngữ. |
| `app/pages/journal/[slug].vue` | `useSetI18nParams` + `watch(article)` + `onBeforeRouteLeave` | Map slug từng locale cho `switchLocalePath`, canonical, hreflang. |
| `app/components/Navbar.vue` | `isActive` (~212), utility link desktop (~345), drawer (~548), thay `localizedPath` (~76) bằng `menuLangTarget`/`langTargets`, lang switcher desktop (~355) + drawer (~558) | Journal active trên article; link EN↔VI dùng đúng slug từng locale; SSR đúng nhờ `SwitchLocalePathLink`. |
| `types/index.ts` | `JournalArticleSummary` / `JournalArticleDetail.alternateSlugs` | Contract client ↔ BFF. |
| `server/types/strapi.ts` | `StrapiJournalArticle.locale` / `localizations` | Mirror CMS: slug localized, `locale` + `localizations` là nguồn alternate. |
| `temp/Serene Saigon.dc.html` | dòng 710–748 (listing), 752–768 (article) | Nguồn visual gốc; đọc trước khi chỉnh layout. |

## Verification

Prerequisites: Strapi chạy `http://localhost:1337`, `.env` có `NUXT_STRAPI_TOKEN`, collection `journal-articles` tồn tại, đã publish ít nhất 1 cặp bài EN/VI (cùng document, **slug khác nhau**, có cover + paragraphs), token có quyền `find`/`findOne`.

```bash
# 1. Typecheck + build
bunx nuxt typecheck
bun build

# 2. Chạy dev; ghi lại port (3000 hoặc 3001)
bun dev
BASE=http://localhost:3000

# 3. BFF list (EN + VI)
curl -s "$BASE/api/journal?locale=en" | jq
curl -s "$BASE/api/journal?locale=vi" | jq
# Kỳ vọng: { "articles": [...] }, cover.url bắt đầu bằng http://localhost:1337
# Log dev KHÔNG có "I18n `baseUrl` is required ..."

# 4. Lấy slug riêng từng locale (phải khác nhau)
SLUG_EN=$(curl -s "$BASE/api/journal?locale=en" | jq -r '.articles[0].slug')
SLUG_VI=$(curl -s "$BASE/api/journal?locale=vi" | jq -r '.articles[0].slug')
echo "$SLUG_EN / $SLUG_VI"
test "$SLUG_EN" != "$SLUG_VI" && echo "OK: slug khác nhau"

# 5. BFF detail: alternateSlugs đúng cả 2 chiều + 404 cross-locale
curl -s "$BASE/api/journal/$SLUG_EN?locale=en" | jq '.alternateSlugs'
curl -s "$BASE/api/journal/$SLUG_VI?locale=vi" | jq '.alternateSlugs'
# Kỳ vọng cả hai: { "en": "$SLUG_EN", "vi": "$SLUG_VI" }

curl -s -o /dev/null -w '%{http_code}\n' \
  "$BASE/api/journal/__missing__?locale=en"                    # 404
curl -s -o /dev/null -w '%{http_code}\n' \
  "$BASE/api/journal/$SLUG_EN?locale=vi"                       # 404
curl -s -o /dev/null -w '%{http_code}\n' \
  "$BASE/api/journal/$SLUG_VI?locale=en"                       # 404

# 6. SSR listing EN/VI: link card đúng slug của từng locale
curl -s "$BASE/en/journal" | grep -F "Notes from the river house"
curl -s "$BASE/en/journal" | grep -o 'href="/en/journal/[^"]*"'
curl -s "$BASE/vi/tap-chi" | grep -F "Ghi chép từ ngôi nhà bên sông"
curl -s "$BASE/vi/tap-chi" | grep -o 'href="/vi/tap-chi/[^"]*"'
# Kỳ vọng: EN chỉ chứa href slug EN, VI chỉ chứa href slug VI

# 7. SSR article EN: title, link đổi ngôn ngữ, hreflang, canonical, nav active
TITLE_EN=$(curl -s "$BASE/api/journal/$SLUG_EN?locale=en" | jq -r '.title')
HTML_EN=$(curl -s "$BASE/en/journal/$SLUG_EN")
echo "$HTML_EN" | grep -F "$TITLE_EN"
echo "$HTML_EN" | grep -o "href=\"/vi/tap-chi/$SLUG_VI\""
echo "$HTML_EN" | grep -o '<link[^>]*hreflang="[^"]*"[^>]*>' | grep "$SLUG_VI"
echo "$HTML_EN" | grep -o '<link[^>]*rel="canonical"[^>]*>'
echo "$HTML_EN" | grep -o 'nav-utility-link--active'
# Kỳ vọng: có title; href VI đúng $SLUG_VI (không phải $SLUG_EN);
# alternate hreflang trỏ đúng cặp slug; có canonical;
# có class active cho utility link Journal

# 8. SSR article VI (chiều ngược lại)
TITLE_VI=$(curl -s "$BASE/api/journal/$SLUG_VI?locale=vi" | jq -r '.title')
curl -s "$BASE/vi/tap-chi/$SLUG_VI" | grep -F "$TITLE_VI"
curl -s "$BASE/vi/tap-chi/$SLUG_VI" | grep -o "href=\"/en/journal/$SLUG_EN\""

# 9. Chặn path sâu / slug lạ
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/en/journal/__missing__"
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/en/journal/$SLUG_EN/extra"
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/en/the-club/extra"
# Kỳ vọng: 404 cả ba
```

Manual UI (browser, cả 2 locale):

- `/en/journal` và `/vi/tap-chi`: grid 3 cột desktop / 2 tablet / 1 mobile; search theo title + author; sort latest/oldest; 6 bài/trang; nút prev/next + số trang; empty state khi search không khớp.
- Click card → đúng `/en/journal/<slug-en>` hoặc `/vi/tap-chi/<slug-vi>`; back link về listing; cover 16:9; lede + paragraphs.
- Từ article, bấm VI/EN trên Navbar → `/vi/tap-chi/<slug-vi>` ↔ `/en/journal/<slug-en>` (không giữ slug của locale cũ); Journal vẫn active. Kiểm tra cả desktop và drawer.
- **Regression param leak:** từ article → mở một Page CMS **không nằm trong menu** (ví dụ `/en/blog`) → bấm đổi ngôn ngữ → phải ra `/vi/blog`, không phải `/vi/<slug-bài-viết>`.
- `/vi/tap-chi/<slug-en>` và `/en/journal/<slug-vi>` → trang 404 (đúng, slug thuộc locale kia).
- Mobile drawer: Journal active; search/sort wrap không tràn.
- Console: không có warning "I18n baseUrl is required"; không có hydration warning về nội dung (date formatter dùng UTC). Nếu Vue báo mismatch `href` ở `nav-lang-link`, xem Assumptions (link được i18n vá lại ngay sau khi page set params).

Nếu CMS prerequisite chưa có: `bunx nuxt typecheck` + `bun build` phải pass; dừng smoke, báo thiếu collection/quyền token. Không thêm mock, không tạo collection trong task này.

## Assumptions & contingencies

- **CMS ngoài scope:** collection `journal-articles`, component `journal.paragraph`, quyền token và nội dung mẫu do CMS owner làm; plan này không sửa CMS đang chạy. Nếu collection chưa có, landing code vẫn typecheck/build nhưng smoke bị chặn.
- **Slug theo locale:** `slug` localized; `documentId` là thứ nối 2 bản dịch. URL `/en/journal/<slug-en>` ↔ `/vi/tap-chi/<slug-vi>`; đổi slug ở một locale không ảnh hưởng locale kia. Không còn giả định slug dùng chung.
- **Cơ chế map slug:** `useSetI18nParams` (page) + `SwitchLocalePathLink` (Navbar). Không dùng `localePath("/journal/<slug>")` — path động không map được localized route với strategy `prefix`.
- **`localizations` populate:** giả định Strapi trả `localizations[].slug` + `localizations[].locale` khi `populate: { localizations: { fields: ["slug"] } }`. Nếu bản Strapi đang chạy không trả `locale`, fallback: query thêm 1 lần cho locale còn lại bằng `filters[documentId][$eq]` + `locale=<other>` (slug localized nên không dùng `locale=all` — Strapi 5 đã bỏ). Contract response `alternateSlugs` không đổi.
- **`uid` unique:** Strapi coi `uid` là unique ở mức collection; plan không cần 2 locale trùng slug. Test nhanh khi publish (bước 0): nếu Strapi chặn slug trùng → dùng slug khác nhau (đúng yêu cầu); nếu cho phép → không ảnh hưởng.
- **Thiếu bản dịch:** `alternateSlugs[locale] = null`; page set `false` cho locale đó (đúng type `I18nRouteMeta`), nhưng với `strictSeo: false` (mặc định của module) i18n **không** disable link/hreflang mà đổi prefix giữ param cũ ⇒ trỏ tới URL 404. Đã kiểm chứng trong `@nuxtjs/i18n@10.6.0` (`missesLocalizedParams` chỉ có tác dụng khi `strictSeo`). Vì vậy cần editorial rule "publish đủ EN+VI"; bật `experimental.strictSeo` sẽ xử lý triệt để case này nhưng đổi hành vi SEO toàn site — ngoài scope.
- **SSR link đổi ngôn ngữ:** layout render Navbar trước page setup, nên `switchLocalePath()` gọi trong Navbar lúc SSR chưa thấy params. `SwitchLocalePathLink` render marker comment, plugin `switch-locale-path-ssr` vá `href` ở `app:rendered` (sau khi page set params) ⇒ HTML SSR đúng. Nếu version i18n trong repo không còn plugin này, kiểm tra marker `<!--…-->` trong HTML và chuyển sang phương án dự phòng: đặt params trong route middleware + `useState` (state được serialize nên hydrate khớp) — chỉ làm khi smoke bước 7 fail.
- **Vòng đời params:** `useSetI18nParams` giữ params trong `route.meta` và re-apply khi `fullPath` đổi; page phải `setI18nParams({})` khi rời trang để catch-all `[...slug]` (cùng tên param `slug`) không bị dính slug bài viết.
- **Listing copy tĩnh:** eyebrow/heading/search/sort/empty/pagination là UI copy 2 ngôn ngữ trong page, không lấy từ Page CMS. Lý do: task không sửa CMS page `journal`/`tap-chi`; article content vẫn 100% từ CMS.
- **Client-side list:** BFF lấy tối đa 100 bài mới nhất; search/sort/pagination chạy client với 6 bài/trang. Nếu CMS vượt 100 bài, tăng `pagination.pageSize` hoặc chuyển filter/pagination sang server — ngoài phạm vi hiện tại.
- **Route names:** Nuxt sinh `journal` cho `journal/index.vue` và `journal-slug` cho `journal/[slug].vue`; các chỗ `localePath({ name: ... })` dùng đúng tên này. Nếu `bun dev` báo tên khác trong `.nuxt/routes.mjs`, đổi đúng các chỗ đó; không đổi sang path động. Nếu `vue-tsc` không nhận named route do typed pages, cast đúng route object `as any` tại các chỗ đó; vẫn giữ named route.
- **Page CMS cũ:** `journal` (EN) và `tap-chi` (VI) bị route mới shadow; không xoá page CMS. Page `blog` (bản duplicate) vẫn truy cập được ở `/en/blog`, `/vi/blog`; không redirect trong task này (dùng luôn làm case test param leak).
- **Không thêm dependency:** không markdown parser, không `v-html`; body là plain paragraphs. Không thêm test framework/CI.
