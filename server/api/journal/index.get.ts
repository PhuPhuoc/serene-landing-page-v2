import type { JournalPageResponse } from "../../../types";
import type { StrapiJournal, StrapiSingle } from "../../types/strapi";
import { fetchCMS } from "../../utils/fetch-strapi.ts";
import { resolveLocale } from "../../utils/locale";
import { handleStrapiError } from "../../utils/errors";

export type { JournalPageResponse };

export default defineEventHandler(
  async (event): Promise<JournalPageResponse> => {
    const locale = resolveLocale(event);

    let journal: StrapiJournal;

    try {
      const response = await fetchCMS<StrapiSingle<StrapiJournal>>(
        "/journal",
        { locale },
      );
      journal = response.data;
    } catch (err) {
      handleStrapiError(err, "GET /api/journal/" + locale);
    }

    return {
      eyebrow: journal.eyebrow,
      heading: journal.heading,
      searchPlaceholder: journal.searchPlaceholder,
      sortLabel: journal.sortLabel,
      sortOptions: journal.sortOptions,
      emptyStateText: journal.emptyStateText,
      backLinkLabel: journal.backLinkLabel,
    };
  },
);
