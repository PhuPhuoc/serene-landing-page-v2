import type { StrapiFooter, StrapiSingle } from "../types/strapi";
import { fetchCMS } from "../utils/fetch-strapi.ts";
import { resolveLocale } from "../utils/locale";
import { handleStrapiError } from "../utils/errors";
import { mapMedia, mapLink, type Media, type Link } from "../utils/mapper.ts";

export type FooterColumns = {
  title: string;
  links: Link[];
};

export type FooterResponse = {
  id: number;
  logo: Media;
  address: string;
  phone: string;
  email: string;
  columns: FooterColumns[];
  copyright: string;
  legalLinks: Link[];
};

export default defineEventHandler(async (event): Promise<FooterResponse> => {
  const { strapiUrl } = useRuntimeConfig();
  const locale = resolveLocale(event);
  let footerResponse: StrapiFooter;

  try {
    const response = await fetchCMS<StrapiSingle<StrapiFooter>>("/footer", {
      locale,
      populate: {
        logo: true,
        columns: {
          populate: {
            links: {
              populate: {
                page: true,
              },
            },
          },
        },
        legalLinks: {
          populate: {
            page: true,
          },
        },
      },
    });
    footerResponse = response.data;
  } catch (err) {
    handleStrapiError(err, "GET /api/footer/" + locale);
  }

  return {
    id: footerResponse.id,
    logo: mapMedia(footerResponse.logo, strapiUrl),
    address: footerResponse.address,
    phone: footerResponse.phone,
    email: footerResponse.email,
    columns: footerResponse.columns.map((column) => ({
      title: column.title,
      links: column.links?.map((link) => mapLink(link) ?? []),
    })),
    copyright: footerResponse.copyright,
    legalLinks: footerResponse.legalLinks.map((legal) => mapLink(legal)),
  };
});
