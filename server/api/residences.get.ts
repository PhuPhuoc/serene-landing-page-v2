import type { ResidenceResponse } from "../../types";
import type { StrapiResidence, StrapiList } from "../types/strapi";
import { fetchCMS } from "../utils/fetch-strapi.ts";
import { resolveLocale } from "../utils/locale";
import { handleStrapiError } from "../utils/errors";
import { mapMedia } from "../utils/mapper";

export type { ResidenceResponse };

export default defineEventHandler(async (event): Promise<ResidenceResponse> => {
  const { strapiUrl } = useRuntimeConfig();
  const locale = resolveLocale(event);

  let response: StrapiList<StrapiResidence>;

  try {
    response = await fetchCMS<StrapiList<StrapiResidence>>("/residences", {
      locale,
      populate: {
        gallery: true,
        includes: { fields: ["label"] },
      },
    });
  } catch (err) {
    handleStrapiError(err, "GET /api/residences/" + locale);
  }

  return {
    residences: response.data.map((v) => ({
      id: v.id,
      name: v.name,
      shortName: v.shortName,
      description: v.description ?? "",
      gallery: (v.gallery ?? [])
        .filter((m) => !!m?.url)
        .map((m) => mapMedia(m, strapiUrl)),
      size: v.size,
      bed: v.bed,
      view: v.view,
      includes: (v.includes ?? []).map((i) => i.label),
    })),
  };
});
