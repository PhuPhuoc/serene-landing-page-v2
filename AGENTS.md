# Repository Guidelines

## Project Overview

Nuxt 4 SSR marketing site for **Serene Saigon** (private riverside club, Nhà Bè, HCMC). All copy and imagery come from a **Strapi CMS**; the Vue app never calls Strapi directly — it reads Nitro BFF routes under `/api/**` that translate Strapi's wire format into typed, render-ready models.

Two content shapes drive everything:

- **Singletons**: `header` → `/api/navigation`, `footer` → `/api/footer`.
- **Pages**: the `page.blocks` dynamic zone → `/api/pages/:slug`, mapped through a **block registry** into the discriminated union `PageBlock`.

Bilingual EN/VI: locale is a **content key** passed as `?locale=`, not an i18n message catalog — `$t()` is never called and no locale JSON files exist.

## Architecture & Data Flow

```mermaid
flowchart TD
  L["app/layouts/default.vue (SSR)"] --> N["Navbar.vue"]
  L --> F["Footer.vue"]
  PG["app/pages/[...slug].vue (placeholder)"] -.->|"not wired yet"| PAPI["/api/pages/:slug"]
  N -->|"$fetch all locales in one useAsyncData"| NAPI["/api/navigation"]
  F -->|"same pattern"| FAPI["/api/footer"]
  NAPI & FAPI & PAPI --> RL["resolveLocale(event) — en|vi, default en"]
  RL --> FC["fetchCMS(path, params): qs + Bearer token"]
  FC --> S[("Strapi :1337")]
  FC --> M["mappers + blockRegistry.map()"]
  M --> NAPI & FAPI & PAPI
```

Invariants to preserve:

1. **The client never talks to Strapi.** Shaping lives in `server/utils`; a new CMS field must be mapped in a mapper or registry entry, then exposed on the route's exported response type.
2. **Locale is a query param.** `resolveLocale` accepts only `SUPPORTED_LOCALES` (`en|vi`) and falls back to `en`, so `?locale=fr` silently returns EN content (verified).
3. **Errors are terminal.** `handleStrapiError(err, ctx)` logs `[Strapi] <ctx>:` and throws `createError`; its `never` return type is what lets a handler declare `let res: StrapiX;` and use it after `try/catch` without definite-assignment errors. There is **no fallback or mock data** — Strapi down ⇒ 500 `Unable to fetch content`.
4. **Layout data is fetched once for all locales.** `Navbar.vue` / `Footer.vue` both run a top-level `await useAsyncData("navigation-all-locales" | "footer-all-locales")` that `Promise.all`s `$fetch("/api/...", { query: { locale: code } })` per locale into `Object.fromEntries`, then select with `computed(() => data.value?.[locale.value])` — switching language never refetches.
5. **Populate config is generated.** `blocksPopulate` is derived from `blockRegistry` and used as `populate.blocks` by `/api/pages/:slug`. An unregistered `__component` produces `console.warn("[pages] Unknown block: …")` and is dropped from the response.

## Key Directories

| Path | Purpose |
|---|---|
| `app/` | Vue UI (`~` / `@` alias → `app/`). `pages/[...slug].vue` is the only route, `layouts/default.vue` is Navbar + slot + Footer, components in `app/components/`. No `stores/`, `plugins/`, `middleware/`, or `app/assets/`. |
|`app/composables/`|Auto-imported helpers shared by every block: `useLinkProps()` (CMS `Link` → `NuxtLink`/`<a>` props, interior targets through `localePath`), `useBackground()` (`background` default/color/image → `{ style, image, onDark }`, WCAG-based light/dark text tone, `defaultOnDark` for blocks whose default look is a dark panel), `usePagination()` (list + `limit` của block → `{ page, pageCount, pageItems, hasPrev, hasNext, goTo }`, tự về trang 1 khi danh sách đổi), `useFacetFilter()` (facets như venues/categories → `{ filtered, options, isActive, isPicked, toggle, clear }`, OR trong 1 facet, AND giữa các facet), `useGallery()` (ảnh + chỉ số → `{ index, count, current, go, goTo, reset }`, đi vòng và tự chuyển mỗi 3s; tự dừng khi hover/focus/modal/tab ẩn/`prefers-reduced-motion`).|
| `server/api/` | Nitro BFF: `navigation.get.ts`, `footer.get.ts`, `pages/[slug].get.ts` (single segment — `/api/pages/a/b` is 404), `club-events.get.ts` (list collection `club-events`, `sort=date:asc`, populate `venues.name` + `categories.name`; response `{ events }` of `ClubEventItem`), `event-venues.get.ts` (list collection `event-venues`, populate `stockPhoto`; response `{ venues }` of `EventVenue`). |
| `server/utils/` | `fetch-strapi.ts` (`fetchCMS`), `locale.ts` (`resolveLocale`, `SUPPORTED_LOCALES`), `mapper.ts` (media/link/background/menu-item mappers, `CtaBehavior`/`CtaVariant` re-export), `blocks.ts` (`blockRegistry`, `blocksPopulate`), `errors.ts`. |
| `server/types/` | `strapi.ts` = wire types (`Strapi*`, one per `__component`); `blocks.ts` = legacy shim re-exporting `../../types`. |
| `types/index.ts` | **Canonical shared client + server models** (`~~/types`). Root level — not `app/`, not Nuxt's `shared/`. |
| `assets/css/main.css` | Tailwind entry plus `@layer base` / `@layer utilities`. Root-level `assets/`, **not** `app/assets/`. |
| `tailwind.config.ts` | Design tokens: `cream`, `dark`, `primary`, `primary-hover`, `muted`, `warm-50…900`, `error*`, `max-w-container/content`, `tracking-label`, `shadow-card/dropdown/modal`, `animate-fade-in`, plus a `fontSize` scale shifted **+2px** from Tailwind's defaults. |
| `public/` | `favicon.ico`, `logo.jpg` (referenced as the head icon in `nuxt.config.ts`), `robots.txt`. |
| `docs/type.md` | Vietnamese TypeScript tutorial, unrelated to this app's API — not project documentation. |
| `temp/` | Gitignored raw design drop (`Serene Saigon.dc.html`); not built. |
| `.nuxt/`, `.output/`, `node_modules/` | Generated (gitignored). Never edit. |

## Development Commands

| Command | Notes |
|---|---|
| `bun install` | `postinstall` runs `nuxt prepare`, regenerating `.nuxt/tsconfig.*`. |
| `bun dev` | http://localhost:3000; auto-shifts to **3001** when 3000 is taken. |
| `bun build` | Nitro `node-server` preset → `.output/server/index.mjs`. |
| `bun generate` | Prerender. Prerendering is SSR, so each prerendered route runs the layout's `/api/navigation` + `/api/footer` fetches — expect a build-time Strapi dependency and no offline output `[INFERENCE]` (no fallback data exists anywhere). |
| `bun preview` | Serve the built output. |
| `bunx nuxt typecheck` | Only static gate wired up (strict vue-tsc). Currently exits 0. |
| `bunx vue-tsc --noEmit -p .nuxt/tsconfig.server.json` | Typecheck the Nitro half only (faster feedback). |

Strapi must run at `http://localhost:1337` (`runtimeConfig.strapiUrl`); the API token comes from `.env` → `NUXT_STRAPI_TOKEN` → `runtimeConfig.strapiToken` (server-only, never exposed to the client).

## Code Conventions & Common Patterns

No formatter, linter, or pre-commit hook exists — match the neighbouring code exactly: **2-space indent, double quotes, semicolons, trailing commas, ~80-column wrapping, Vietnamese inline comments.**

### Naming

- Route files follow Nitro/Nuxt convention (`footer.get.ts`); each handler also exports its own response type (`FooterResponse`, `NavigationResponse`, `PageResponse`).
- Wire types are `Strapi*` and carry the `__component: "block.x"` literal; client models are the mapped shape with a `type: "kebab-case"` discriminator, and closed sets become enums (`CtaBehavior`, `BackgroundType`, `CtaVariant`, `ImagePositon`).
- Block keys are always `block.<kebab-case>`, matching Strapi.
- Comments/log prefixes: `[Strapi] <context>:`, `[pages] Unknown block: …`.

### Add a CMS block (three edits)

1. `types/index.ts` — client model, then extend the `PageBlock` union.
2. `server/types/strapi.ts` — `Strapi<Name>` with `__component: "block.<name>"`, then extend the `StrapiPageBlock` union.
3. `server/utils/blocks.ts` — registry entry: Strapi `populate` plus `map(block, strapiUrl)` returning `type: "<name>" as const`.

```ts
// server/utils/blocks.ts
"block.visit": {
  populate: { directionsCta: { populate: ["page"] }, mapImage: true },
  map: (b, strapiURL) => ({
    type: "visit" as const,
    id: b.id,
    eyebrow: b.eyebrow,
    directionsCta: b.directionsCta ? mapLink(b.directionsCta) : null,
    mapImage: b.mapImage ? mapMedia(b.mapImage, strapiURL) : null,
  }),
},
```

`blocksPopulate` rebuilds itself — never hand-edit `populate` in `/api/pages/[slug]`. `map` must be null-safe: every optional relation is guarded (`b.x ? mapLink(b.x) : null`) because Strapi omits unfilled components.

### Add an API endpoint

```ts
// server/api/<name>.get.ts
export default defineEventHandler(async (event): Promise<XResponse> => {
  const { strapiUrl } = useRuntimeConfig();
  const locale = resolveLocale(event);

  let res: StrapiX;
  try {
    res = (await fetchCMS<StrapiSingle<StrapiX>>("/x", { locale, populate: { … } })).data;
  } catch (err) {
    handleStrapiError(err, "GET /api/x/" + locale);
  }

  return { /* mapped, absolute media URLs via strapiUrl */ };
});
```

`fetchCMS` already appends `/api`, serializes params with `qs`, and sets the Bearer header — pass populate/filters/locale only.

### Rendering links

`mapLink(link, fallbackStyle?)` normalizes `ctaBehavior`/`ctaVariant` to `Link["type"]`/`Link["style"]` and handles the CMS's nullable fields: `ctaBehavior` null ⇒ `internal`, `ctaVariant` null ⇒ the caller's `fallbackStyle`. `pageToPath()` returns `/{slug}` **without** a locale prefix (the prefixed form is commented out), and a missing page yields `to: "#"`. Components therefore branch on `CtaBehavior` and push interior targets through `localePath()` — that logic lives once in `app/composables/useLinkProps.ts`:

```ts
const linkProps = useLinkProps(); // (l: Link | null | undefined)
// EXTERNAL → { href, target?, rel? }; nội bộ → { to: localePath(l.to) } ("#" giữ nguyên)
```

`Navbar.vue` keeps its own menu-specific variant (children ⇒ `role="button"`), and additionally flattens the per-locale menu index (`flatten` + `documentId` matching) and uses `useSwitchLocalePath()` to find a page's counterpart in the other language.

### Block `background` (default | color | image)

Every content block receives the same `background` object; the logic is shared, not duplicated per component:

- `useBackground(() => props.background, { defaultOnDark })` → `{ image, onDark, style }`. It only treats `image` as a background when `type === "image"` **and** the CMS media has a `url`, derives the text tone from WCAG relative luminance for `color`, and `defaultOnDark` marks blocks whose default look is already a dark panel (membership = `bg-primary`). Blocks then switch their own tone classes (`membership--dark|light`, `section--dark|light`, `tier--dark|light`).
- `<BlockBackground :image :dark-side="left|right" />` renders the full-bleed `<img>` + the legibility scrim (flat `bg-dark/55` on mobile, horizontal gradient from `lg`); `dark-side` is the side where the text column sits. Blocks keep `relative overflow-hidden` on their root.
- CTA styling lives in `app/components/CtaLink.vue`, driven by `Link.style` (`CtaVariant`), so blocks only pass `:link`, `size` (`sm|md|lg`), and `tone` (the surface behind it: `light|dark`). `none` renders plain text with no button, underline, arrow, or hover effect; `solid` is tone-aware (light surface ⇒ `bg-primary`/cream, dark surface ⇒ cream/`text-dark`); `underline`/`outline` use `currentColor` and switch tone too. Blocks need a `tone` because a CMS color/image background can flip `onDark`; membership defaults dark, section can be either. The arrow is CMS-controlled by `Link.withIcon` (`null`/`false` ⇒ no icon), and legacy `solid-dark`/`solid-light` values are normalized to `solid` in `mapLink`.

### Media and styling

- `mapMedia(media, strapiUrl)` absolutizes relative Strapi URLs and defaults `alt` to `""`; render `width`/`height` when present.
- Prefer tokens over raw values: `bg-cream text-dark`, `text-primary` / `bg-primary-hover`, `font-sans`/`font-serif`, `max-w-container`, `tracking-label`, `shadow-card`, `class="fade"`.
- `letterSpacing.wide|wider|widest` are **overridden** with custom values — don't assume Tailwind defaults.
- `fontSize` **overrides every step** of Tailwind's scale at design px **+2px** (`xs` 12→14, `sm` 14→16, `base` 16→18, `xl` 20→22, `5xl` 48→50 …), with paired line-heights +2px too. So `text-sm` is 16px, not 14px; arbitrary values (`text-[15px]`, `text-[clamp(…)]`) are not covered and were bumped by hand (now `text-[13px]` for the perks-bar label, `text-[17px]` for hero CTAs, `clamp(2.875rem,5vw,4.875rem)` for the hero headline). Change the increment in the single `fontSize` block of `tailwind.config.ts`, then restart `bun dev` — the running dev server caches the resolved theme. Intentionally deviates from `temp/Serene Saigon.dc.html`'s px values (verified: 76px → 78px hero display).
- Both webfonts load from Google Fonts via the `app.head.link` entries in `nuxt.config.ts` (2 `preconnect` + 1 stylesheet request for both families), each shipping the `latin` + `latin-ext` + `vietnamese` subsets so EN/VI diacritics render in the real face:
  - `font-serif` (display, `h1–h3` via `@apply font-serif font-normal` in `main.css`) = **Cormorant Garamond**, variable 300–700 + italic. Base weight is **400**, not 300: at 16–24px Cormorant Light reads as washed-out hairline; large display headings opt into `font-light` per component.
  - `font-sans` (body via `@apply … font-sans`) = **Afacad Flux** 100–1000; it has **no italic axis**, so italic sans text is browser-synthesized.

### Known rough edges

- `server/types/blocks.ts` is a compatibility shim; the header comment says to import from `~/types`, but the real canonical path is `~~/types` (`~/types` would point at `app/types`, which does not exist).
- `ImagePositon` is a typo baked into the public API (`types/index.ts`) — keep the spelling unless migrating every usage.
- `runtimeConfig.public.strapiUrl` is currently dead config; only the server-side `strapiUrl` is read.
- `server/api/pages/[slug].get.ts` matches one segment only; nested slugs 404.
- Pinia is installed with **zero stores**, and `zod` is a dependency that is **never imported** — don't assume either is in use.

## Important Files

| File | Why it matters |
|---|---|
|`app/pages/[...slug].vue`|**Only route**: fetches `/api/pages/:slug?locale=`, throws `createError` on failure, then renders each block through a `v-for` of `v-if` branches (`<ClubEvent v-if="block.type === 'club-event'" v-bind="block" />`). Every catch-all URL lands here; there is no `index.vue`, so `/` 302s to `/en` and renders the layout alone.|
| `app/components/CtaLink.vue` | Single source of CTA styling for content blocks: `CtaVariant` (`solid`, `underline`, `outline`, `none`) + size + surface tone + CMS `withIcon` for the arrow. Accepts a normalized `Link` and handles external targets/`newTab` through `useLinkProps()`. |
| `app/components/Navbar.vue` (739 lines) | Largest file; owns locale switching, mobile drawer state, dropdown + flattened-menu logic, and the two header states (see below). Read before touching navigation. |
| `app/components/Footer.vue` | Reference implementation of the all-locales fetch pattern and link rendering. |
| `app/components/Gallery.vue` | Reusable photo gallery: ảnh lớn + thumbnail + modal slideshow toàn màn hình (←/→/Esc, focus trap), ảnh tự chuyển mỗi 3s (`useGallery`, tạm dừng khi hover/focus/mở modal). Modal responsive: desktop mosaic theo tỉ lệ ảnh (ảnh ngang chiếm cả hàng, ảnh dọc/vuông đứng cạnh nhau), mobile là carousel scroll-snap một ảnh với ảnh kề lộ nửa hai bên + thumbnail căn giữa. Bấm ảnh trong modal mở viewer full màn hình (arrows/Esc, focus trả về đúng ảnh). Dùng bởi `PrivateEvent.vue`; `variant="bento"` ẩn thumbnail/nav, phủ kín khung và hiện badge +N cho các bento của `WellnessAndLeisure.vue`. Nhận `images: Media[]`. |
| `server/utils/blocks.ts` | Block registry + generated `blocksPopulate` — the extension point for page content. |
| `server/utils/mapper.ts` | All wire → client translation. Add field mappings here, never in components. |
| `types/index.ts` | Single source of shared models and the `PageBlock` union. |
| `server/types/strapi.ts` | Exact Strapi field names/types; mirror CMS changes here first. |
| `nuxt.config.ts` | Modules, i18n prefix strategy, `runtimeConfig`, favicon. |
| `tailwind.config.ts` | Design tokens; `content` scans only `./app/**/*`, so styles in other directories won't be generated. |
| `.nuxt/tsconfig.*` | Generated project references: `~`/`@` → `app/`, `~~`/`@@` → repo root, `strict: true`. |
| `.env` (gitignored) | `NUXT_STRAPI_TOKEN` → `runtimeConfig.strapiToken`. |
| `CLAUDE.md` (gitignored) | Local-only assistant notes that already describe these patterns. |

### Header states on the two "home" slugs

`HOME_SLUGS = ["/the-club", "/ve-serene"]` decides the header look, keyed off `pathWithoutLocale`:

| | on a home slug, `scrollY <= 60` | everywhere else (and home once scrolled) |
|---|---|---|
| class | `nav-header--home nav-header--transparent` | `nav-header--home` / bare |
| bg + text | transparent, `text-cream` | `bg-cream`, `text-dark` |
| logo (`logo` computed) | `logoOnDark` (cream SVG) | `logoOnLight` (brown SVG) |
| 1px hairline (`::after`, not `border`) | `bg-cream/[0.18]` | `bg-warm-600` |

- `overHero = isHome && !scrolled` is the single source of truth for both the class and the logo; `scrolled` is a `scrollY > 60` listener (design-drop threshold) synced once in `onMounted` so reloads/back-forward at an offset don't flash the wrong state.
- `.nav-header--home` pulls the next sibling up by the header's height (`-mb-16 md:-mb-20` ↔ `h-16 md:h-20`) so the hero starts *behind* the header. Change either height and you MUST change the other; keep the hairline on `::after` for the same reason (a real `border` adds 1px and the hero would sit 1px low).
- `.nav-header--home .perks-bar` is `absolute top-full` — the perks bar would otherwise add 47px and shove the hero down on hover.
- The design drop uses a `position: fixed` header at 96px/76px with a 300ms height transition (`temp/Serene Saigon.dc.html` line 34 + `hdr` in `renderVals`); the app deliberately keeps its own responsive 64/80px heights and no height animation. Strapi supplies both logos: `logoOnLight` = brown `#795B3C`, `logoOnDark` = cream `#F2E9DA`.

## Runtime/Tooling Preferences

- **Bun is the mandated package manager** — only `bun.lock` exists (bun 1.4.2; no `packageManager`/`engines` field). The npm/pnpm/yarn instructions in `README.md` are untouched Nuxt boilerplate; ignore them. Node v22 is present and can run `.output/server/index.mjs`.
- Stack: Nuxt 4.5.2, Nitro 2.13.4, Vite 8.3.1, Vue 3.5.43, TypeScript strict, `vue-tsc` ^3.3.13. `@nuxtjs/i18n` is pinned exactly (`10.6.0`); Tailwind is **v3** via `@nuxtjs/tailwindcss` — not v4 CSS-first.
- Keep `nuxt.config.ts` minimal: there are no `nitro`, `routeRules`, `prerender`, `typescript`, `srcDir`, or `css` keys, `devtools` is disabled, and `compatibilityDate` is `2026-09-29`. Add configuration only when a feature requires it.
- Server code runs through Nitro auto-imports (`defineEventHandler`, `useRuntimeConfig`, `getQuery`, `createError` are not imported explicitly) — follow that style in `server/`.
- Import style is inconsistent but locally consistent: explicit `.ts` extensions for some `server/utils` imports, plain relative paths in `app/` (`../../types`), `~~/server/...` only in `pages/[slug].get.ts`.

## Testing & QA

- **There is no test framework, no spec/test file, no CI workflow, no git hook, and no lint/format configuration.** Don't invent infrastructure: the lockfile contains no vitest/jest/playwright/@nuxt/test-utils, `package.json` has no `test`/`lint`/`typecheck` script, and there is no `.github/`.
- Available gates: `bunx nuxt typecheck` (strict vue-tsc; catches undefined names and type errors across `app/**` and `server/**`), plus runtime smoke checks.
- Manual verification recipe (BFF + SSR end to end, requires Strapi on :1337 with a valid token):
  ```bash
  bun dev   # note the port if 3000 is busy
  curl 'http://localhost:3000/api/navigation?locale=en'      # 200; menuItems[].to like "/the-club"
  curl 'http://localhost:3000/api/footer?locale=vi'          # 200; localized address/columns
  curl 'http://localhost:3000/api/pages/the-club?locale=en'   # 200; blocks hero,intro,day-at,simple-section×7,visit
  curl 'http://localhost:3000/api/event-venues?locale=en'     # 200; venues[].photos absolute URLs
  curl -I 'http://localhost:3000/en/'                         # 200 SSR html; "/" → 302 /en
  ```
  Failure modes observed: Strapi down ⇒ 500 `Unable to fetch content`; unknown slug ⇒ 404 `Page not found`; `/api/pages/a/b` ⇒ 404.
- Check every content/rendering change in **both locales** — slugs differ per language (`/the-club` vs `/ve-serene`), and a scan of the dev log for `[pages] Unknown block:` is the cheapest regression check for registry drift.
- Empty `blocks: []` responses (`membership`, `club-events`, `private-event` at the time of writing) are **CMS data gaps, not frontend bugs** — fix them in Strapi, not here.
