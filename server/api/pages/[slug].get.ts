import type {
  StrapiList,
  StrapiPageBlock,
  StrapiPageRef,
} from "../../types/strapi";
import { fetchCMS } from "../../utils/fetch-strapi.ts";
import { resolveLocale } from "../../utils/locale";
import { handleStrapiError } from "../../utils/errors";
import { mapMedia, mapLink } from "../../utils/mapper.ts";
import { PageBlock } from "~~/server/types/blocks.ts";

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
      filters: {
        slug: {
          $eq: slug,
        },
      },
      populate: {
        blocks: {
          on: {
            "block.hero": {
              populate: {
                backgroundImage: true,
                primaryCta: { populate: ["page"] },
                secondaryCta: { populate: ["page"] },
              },
            },
            "block.intro": {
              populate: { tags: true },
            },
          },
        },
      },
    });

    page = response.data[0];

    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    handleStrapiError(err, "GET /api/pages/" + slug);
  }

  if (!page) {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }

  const blocks = (page.blocks ?? [])
    .map((block) => mapBlock(block, strapiUrl))
    .filter((block): block is PageBlock => block !== null);

  return { title: page.title, blocks };
});

function mapBlock(block: StrapiPageBlock, strapiUrl: string): PageBlock | null {
  switch (block.__component) {
    case "block.hero":
      return {
        type: "hero",
        eyebrow: block.eyebrow,
        headline: block.headline,
        subheadline: block.subheadline,
        backgroundImage: mapMedia(block.backgroundImage, strapiUrl),
        imageCaption: block.imageCaption,
        primaryCta: block.primaryCta ? mapLink(block.primaryCta) : null,
        secondaryCta: block.secondaryCta ? mapLink(block.secondaryCta) : null,
      };

    case "block.intro":
      return {
        type: "intro",
        eyebrow: block.eyebrow,
        subtitle: block.subtitle,
        content: block.content,
        tags: (block.tags ?? []).map((t) => ({ label: t.label })),
      };
    default:
      return null;
  }
}
