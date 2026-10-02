// server/utils/mapper.ts
import type {
  StrapiMedia,
  StrapiNavItem,
  StrapiNavLink,
  StrapiPageRef,
} from "../types/strapi";

// Media type
export function toAbsoluteMediaUrl(
  strapiDomainUrl: string,
  mediaUrl?: string | null,
): string {
  if (!mediaUrl) return "";

  if (mediaUrl.startsWith("http")) {
    return mediaUrl;
  } else {
    return `${strapiDomainUrl}${mediaUrl}`;
  }
}

export type Media = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export function mapMedia(media: StrapiMedia, strapiDomainUrl: string): Media {
  return {
    url: toAbsoluteMediaUrl(strapiDomainUrl, media.url),
    alt: media.alternativeText ?? "",
    width: media.width,
    height: media.height,
  };
}

// Link ~ Navigation Link
export enum NavLinkType {
  INTERNAL = "internal",
  EXTERNAL = "external",
  MODAL = "modal",
}

export type NavLink = {
  id: number;
  label: string;
  type: NavLinkType;
  to?: string;
  newTab?: boolean;
  modalKey?: string;
};

function pageToPath(page: StrapiPageRef | null): string {
  if (!page) return "#"; // null guard: trường hợp internal link nhưng chưa gắn page

  // Format: /{locale}/{slug}
  return `/${page.locale}/${page.slug}`;
}

export function mapNavLink(link: StrapiNavLink): NavLink {
  let type: NavLinkType;
  switch (link.type) {
    case "internal": {
      type = NavLinkType.INTERNAL;
      break;
    }
    case "external": {
      type = NavLinkType.EXTERNAL;
      break;
    }
    case "modal": {
      type = NavLinkType.MODAL;
      break;
    }
  }

  if (type === NavLinkType.MODAL) {
    return {
      id: link.id,
      label: link.label,
      type: type,
      modalKey: link.modalKey,
    };
  } else {
    return {
      id: link.id,
      label: link.label,
      type: type,
      newTab: link.openInNewTab,
      to:
        type === NavLinkType.EXTERNAL
          ? (link.url ?? "#")
          : pageToPath(link.page),
    };
  }
}

// Menu's item
export type MenuItem = NavLink & { children: NavLink[] };

export function mapMenuItem(item: StrapiNavItem): MenuItem {
  return {
    ...mapNavLink(item.link), // Làm phẳng object (lấy tất cả prop của item.link, bỏ vào NavLink)
    children: (item.children ?? []).map(mapNavLink),
  };
}
