import type { JournalPostsResponse } from "../../../types";
import type { StrapiList, StrapiPost } from "../../types/strapi";
import { fetchCMS } from "../../utils/fetch-strapi.ts";
import { resolveLocale } from "../../utils/locale";
import { handleStrapiError } from "../../utils/errors";
import { mapJournalPostSummary } from "../../utils/journal.ts";

export type { JournalPostsResponse };

export default defineEventHandler(
  async (event): Promise<JournalPostsResponse> => {
    const { strapiUrl } = useRuntimeConfig();
    const locale = resolveLocale(event);

    // Journal lấy toàn bộ bài: search / filter / sort / load-more diễn ra ở
    // client trên danh sách đầy đủ. Strapi chặn pageSize tối đa (mặc định
    // 100) nên phải duyệt từng trang cho tới khi hết, không chỉ lấy trang 1.
    const posts: StrapiPost[] = [];

    try {
      for (let page = 1; ; page += 1) {
        const postsResponse = await fetchCMS<StrapiList<StrapiPost>>(
          "/posts",
          {
            locale,
            sort: "publishedDate:desc",
            pagination: { page, pageSize: 100 },
            fields: ["title", "slug", "coverAlt", "publishedDate"],
            populate: {
              cover: true,
              author: { fields: ["name", "slug"] },
            },
          },
        );

        posts.push(...postsResponse.data);

        if (postsResponse.data.length < 100) break;
      }
    } catch (err) {
      handleStrapiError(err, "GET /api/posts/" + locale);
    }

    return {
      posts: posts.map((post) => mapJournalPostSummary(post, strapiUrl)),
    };
  },
);
