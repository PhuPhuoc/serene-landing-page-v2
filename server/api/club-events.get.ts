import type { ClubEventsResponse } from "../../types";
import type { StrapiClubEventItem, StrapiList } from "../types/strapi";
import { fetchCMS } from "../utils/fetch-strapi.ts";
import { resolveLocale } from "../utils/locale";
import { handleStrapiError } from "../utils/errors";

export type { ClubEventsResponse };

export default defineEventHandler(
  async (event): Promise<ClubEventsResponse> => {
    const locale = resolveLocale(event);

    let eventsResponse: StrapiList<StrapiClubEventItem>;

    try {
      eventsResponse = await fetchCMS<StrapiList<StrapiClubEventItem>>(
        "/club-events",
        {
          locale,
          sort: "date:asc",
          populate: {
            venues: { fields: ["name"] },
            categories: { fields: ["name"] },
          },
        },
      );
    } catch (err) {
      handleStrapiError(err, "GET /api/club-events/" + locale);
    }

    return {
      events: eventsResponse.data.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        date: e.date,
        venues: e.venues ? { name: e.venues.name } : null,
        categories: (e.categories ?? []).map((c) => ({ name: c.name })),
      })),
    };
  },
);
