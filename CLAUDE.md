# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Nuxt 4 landing page that uses a BFF (Backend for Frontend) pattern to communicate with a Strapi CMS. The `server/` directory acts as the API layer, shielding the frontend from Strapi's internal structure.

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build locally
npm run generate # Static site generation
```

## Architecture

### Directory Structure

- **`app/`** — Frontend (Vue components, pages, layouts). Only client-side code here.
- **`server/`** — Backend API layer (Nuxt server routes). Server-side only.
- **`server/api/`** — Route handlers that fetch from Strapi and transform data
- **`server/utils/`** — Shared server utilities
- **`server/types/`** — TypeScript types for Strapi API responses

### BFF Pattern

```
Browser → Nuxt Server Routes (server/api/) → Strapi CMS
```

The `server/api/` routes:
1. Read query parameters (e.g., `locale`)
2. Fetch data from Strapi using `strapiFetch()` in `server/utils/strapi.ts`
3. Transform raw Strapi response to frontend-friendly shape using mappers
4. Return JSON to the frontend

### Key Utilities

- **`server/utils/strapi.ts`** — **Server-only**. The single source of truth for Strapi API calls. Uses `$fetch` with the `strapiToken` from `runtimeConfig`. Never import this in client-side code — the token would leak.
- **`server/utils/mappers.ts`** — Pure functions that transform Strapi data into cleaner frontend types. No side effects, no API calls.
- **`server/utils/errors.ts`** — Centralized error handler. Logs full details server-side, returns generic messages to clients.
- **`server/utils/locale.ts`** — Centralized locale resolution. Defines `SUPPORTED_LOCALES` and `resolveLocale()`.

### Data Flow (Example: Navigation)

```
GET /api/navigation?locale=en
    ↓
resolveLocale(event) → "en"
    ↓
strapiFetch("/header", { populate: {...} })
    ↓
mapMedia(), mapNavItem(), mapNavLink() → clean types
    ↓
{ logoOnLight, logoOnDark, navItems, utilityLink, cta }
```

## Security Notes

- `strapiToken` is stored in `runtimeConfig.strapiToken` (server-only, not public)
- The `.env` file contains sensitive tokens — never commit it
- Only use `strapiFetch()` in `server/` directory; client code uses `$fetch` to `/api/*` routes instead

## Supported Locales

Currently: `en` (default), `vi`. Managed in `server/utils/locale.ts` via `SUPPORTED_LOCALES`.

## Type References

- `server/types/strapi.ts` — Only defines fields actually used by the app, not all Strapi fields
- Response types are prefixed: `StrapiHeader`, `StrapiNavLink`, etc.
- Frontend-friendly types are in `server/utils/mappers.ts`: `Media`, `NavItem`, `NavLink`
