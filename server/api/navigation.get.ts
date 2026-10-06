import type { StrapiHeader, StrapiSingle } from "../types/strapi";
import { fetchCMS } from "../utils/fetch-strapi.ts";
import { resolveLocale } from "../utils/locale";
import { handleStrapiError } from "../utils/errors";
import {
  mapMedia,
  mapLink,
  mapMenuItem,
  type Media,
  type Link,
  type MenuItem,
} from "../utils/mapper.ts";

export type NavigationResponse = {
  logoOnLight: Media;
  logoOnDark: Media;
  menuItems: MenuItem[];
  utilityLink: Link;
  cta: Link;
};

/*
 * Đăng ký một HTTP route handler với Nitro server.
 * - Tên file: navigation.get.ts → route GET /api/navigation
 * - Tên file: [slug].get.ts → route GET /api/:slug
 *
 * NHẬN VÀO:
 *   event - H3Event object, chứa:
 *          - Query params (?locale=en)
 *          - Headers, cookies
 *          - Request body (nếu có)
 *
 * RETURN:
 *   Promise<NavigationResponse> - JSON response cho frontend
 */
export default defineEventHandler(
  async (event): Promise<NavigationResponse> => {
    // get domain url from runtime (nuxt.config.ts)
    const { strapiUrl } = useRuntimeConfig();

    /*
     * Resolve locale từ query string
     *
     * Input:  ?locale=en hoặc ?locale=vi hoặc không có query
     * Output: "en" hoặc "vi" (đã được validate theo SUPPORTED_LOCALES)
     * Fallback: "en" nếu không hợp lệ hoặc không có
     */
    const locale = resolveLocale(event);

    // define var to stored data from cms strapi
    let headerResponse: StrapiHeader;

    /*
     * POPULATE OBJECT:
     *  Strapi mặc định không trả nested relations.
     *  Ta phải chỉ định rõ ràng những field nào cần populate (lấy đầy đủ dữ liệu).
     */
    try {
      const response = await fetchCMS<StrapiSingle<StrapiHeader>>("/header", {
        locale,
        populate: {
          logoOnLight: true,
          logoOnDark: true,
          // Các mục menu chính
          navItems: {
            populate: {
              // Link của mỗi mục menu (có thể là internal hoặc external)
              link: {
                populate: {
                  page: true,
                },
              },
              // Các mục con (dropdown submenu)
              children: {
                populate: {
                  page: true,
                },
              },
            },
          },
          utilityLink: {
            populate: {
              page: true,
            },
          },
          cta: {
            populate: {
              page: true,
            },
          },
        },
      });
      headerResponse = response.data;
    } catch (err) {
      handleStrapiError(err, "GET /api/navigation/" + locale);
    }

    return {
      logoOnLight: mapMedia(headerResponse.logoOnLight, strapiUrl),
      logoOnDark: mapMedia(headerResponse.logoOnDark, strapiUrl),
      menuItems: headerResponse.navItems.map(mapMenuItem),
      utilityLink: mapLink(headerResponse.utilityLink),
      cta: mapLink(headerResponse.cta),
    };
  },
);
