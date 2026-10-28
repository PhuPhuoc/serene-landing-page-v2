import type { JournalPostResponse } from "../../../types";
import type { StrapiList, StrapiPost } from "../../types/strapi";
import { fetchCMS } from "../../utils/fetch-strapi.ts";
import { resolveLocale } from "../../utils/locale";
import { handleStrapiError } from "../../utils/errors";
import {
  mapJournalAuthor,
  mapJournalBlocks,
  mapJournalCover,
  mapJournalPostSummary,
  mapJournalSeo,
} from "../../utils/journal.ts";

export type { JournalPostResponse };

export default defineEventHandler(
  async (event): Promise<JournalPostResponse> => {
    const { strapiUrl } = useRuntimeConfig();
    const locale = resolveLocale(event);
    const slug = getRouterParam(event, "slug");

    if (!slug) {
      throw createError({ statusCode: 404, statusMessage: "Post not found" });
    }

    let postsResponse: StrapiList<StrapiPost>;

    try {
      postsResponse = await fetchCMS<StrapiList<StrapiPost>>("/posts", {
        locale,
        filters: { slug: { $eq: slug } },
        populate: {
          cover: true,
          author: { populate: { avatar: true } },
          seo: { populate: "*" },
          blocks: { populate: "*" },
          relatedPosts: { populate: { cover: true, author: true } },
        },
      });
    } catch (err) {
      handleStrapiError(err, "GET /api/posts/" + slug + "/" + locale);
    }

    const post = postsResponse.data[0];

    if (!post) {
      throw createError({ statusCode: 404, statusMessage: "Post not found" });
    }

    return {
      post: {
        id: post.id,
        documentId: post.documentId,
        slug: post.slug,
        title: post.title,
        cover: mapJournalCover(post.cover, strapiUrl),
        coverAlt: post.coverAlt ?? "",
        publishedDate: post.publishedDate ?? null,
        author: mapJournalAuthor(post.author, strapiUrl),
        seo: mapJournalSeo(post.seo, strapiUrl),
        blocks: mapJournalBlocks(post.blocks, strapiUrl),
        relatedPosts: (post.relatedPosts ?? []).map((related) =>
          mapJournalPostSummary(related, strapiUrl),
        ),
      },
    };
  },
);
