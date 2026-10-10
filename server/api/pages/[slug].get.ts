import type { StrapiList, StrapiPageRef } from "../../types/strapi";
import { fetchCMS } from "../../utils/fetch-strapi.ts";
import { resolveLocale } from "../../utils/locale";
import { handleStrapiError } from "../../utils/errors";
import type { PageBlock } from "../../types/blocks.ts";
import { blockRegistry, blocksPopulate } from "~~/server/utils/blocks.ts";

export type PageResponse = {
  title: string;
  blocks?: PageBlock[];
};

export default defineEventHandler(async (event): Promise<PageResponse> => {
  const { strapiUrl } = useRuntimeConfig();

  const slug = getRouterParam(event, "slug");

  const locale = resolveLocale(event);

  let page: StrapiPageRef | undefined;

  try {
    const response = await fetchCMS<StrapiList<StrapiPageRef>>("/pages", {
      locale,
      filters: { slug: { $eq: slug } },
      populate: { blocks: blocksPopulate },
    });

    page = response.data[0];
    // console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    handleStrapiError(err, "GET /api/pages/" + slug);
  }

  if (!page) {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }

  const blocks = (page.blocks ?? []).flatMap((block) => {
    const def = blockRegistry[block.__component as keyof typeof blockRegistry];
    if (!def) {
      console.warn(`[pages] Unknown block: ${block.__component}`);
      return [];
    }
    return [def.map(block, strapiUrl)];
  });

  return { title: page.title, blocks };
});
