/**
 * server/api/navigation.get.ts
 * ------------------------------------------------------------------
 * Route: GET /api/navigation?locale=en|vi
 *
 * FLOW (đọc theo đúng thứ tự code chạy):
 *   1. Đọc & chuẩn hóa `locale` từ query string (resolveLocale).
 *   2. Gọi Strapi lấy content-type "header", populate đúng những
 *   field: logoOnLight, logoOnDark, navItems (kèm link+children.page), utilityLink, cta.
 *   3. Nếu Strapi lỗi -> chuẩn hóa lỗi trả về qua handleStrapiError.
 *   4. Map dữ liệu thô -> shape gọn cho frontend bằng các hàm ở mappers.ts.
 *   5. Trả JSON.
 * ------------------------------------------------------------------
 */
import type { StrapiHeader, StrapiSingle } from "../types/strapi";
import { strapiFetch } from "../utils/strapi";
import {
  mapMedia,
  mapNavItem,
  mapNavLink,
  type Media,
  type NavItem,
  type NavLink,
} from "../utils/mappers";
import { resolveLocale } from "../utils/locale";
import { handleStrapiError } from "../utils/errors";

export type NavigationResponse = {
  logoOnLight: Media;
  logoOnDark: Media;
  navItems: NavItem[];
  utilityLink: NavLink;
  cta: NavLink;
};

export default defineEventHandler(
  async (event): Promise<NavigationResponse> => {
    const { strapiUrl } = useRuntimeConfig();
    const locale = resolveLocale(event);

    let header: StrapiHeader;
    try {
      // `populate` object bên dưới, sau khi qua `qs.stringify` trong
      // strapiFetch, sẽ ra ĐÚNG query string bạn đã test bằng tay:
      //   populate[logoOnLight]=true
      //   populate[logoOnDark]=true
      //   populate[navItems][populate][link][populate][page]=true
      //   populate[navItems][populate][children][populate][page]=true
      //   populate[utilityLink][populate][page]=true
      //   populate[cta][populate][page]=true
      const response = await strapiFetch<StrapiSingle<StrapiHeader>>(
        "/header",
        {
          locale,
          populate: {
            logoOnLight: true,
            logoOnDark: true,
            navItems: {
              populate: {
                link: { populate: { page: true } },
                children: { populate: { page: true } },
              },
            },
            utilityLink: { populate: { page: true } },
            cta: { populate: { page: true } },
          },
        },
      );
      header = response.data;
    } catch (err) {
      // handleStrapiError luôn `throw` (kiểu trả về `never`), nên
      // TypeScript hiểu là sau dòng này, nếu code còn chạy tiếp thì
      // `header` chắc chắn đã được gán ở nhánh try phía trên.
      handleStrapiError(err, "GET /api/navigation");
    }

    return {
      logoOnLight: mapMedia(header.logoOnLight, strapiUrl),
      logoOnDark: mapMedia(header.logoOnDark, strapiUrl),
      navItems: header.navItems.map(mapNavItem),
      utilityLink: mapNavLink(header.utilityLink),
      cta: mapNavLink(header.cta),
    };
  },
);
