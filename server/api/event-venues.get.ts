import type { EventVenuesResponse } from "../../types";
import type { StrapiEventVenue, StrapiList } from "../types/strapi";
import { fetchCMS } from "../utils/fetch-strapi.ts";
import { resolveLocale } from "../utils/locale";
import { handleStrapiError } from "../utils/errors";
import { mapMedia } from "../utils/mapper";

export type { EventVenuesResponse };

export default defineEventHandler(
  async (event): Promise<EventVenuesResponse> => {
    const { strapiUrl } = useRuntimeConfig();
    const locale = resolveLocale(event);

    let venuesResponse: StrapiList<StrapiEventVenue>;

    try {
      venuesResponse = await fetchCMS<StrapiList<StrapiEventVenue>>(
        "/event-venues",
        {
          locale,
          populate: { stockPhoto: true },
        },
      );
    } catch (err) {
      handleStrapiError(err, "GET /api/event-venues/" + locale);
    }

    return {
      venues: venuesResponse.data.map((v) => ({
        id: v.id,
        name: v.name,
        spaceType:
          v.spaceType === "outdoor"
            ? ("outdoor" as const)
            : ("indoor" as const),
        description: v.description ?? "",
        area: v.area ?? null,
        areaLabel: v.areaLabel ?? "",
        capacity: v.capacity ?? null,
        capacityLabel: v.capacityLabel ?? "",
        photos: (v.stockPhoto ?? [])
          .filter((m) => !!m?.url)
          .map((m) => mapMedia(m, strapiUrl)),
      })),
    };
  },
);
