// server/utils/mapper.ts
import { BackgroundBlock, BackgroundType } from "../types/blocks";
import type {
  StrapiMedia,
  StrapiNavItem,
  StrapiLink,
  StrapiPageRef,
  StrapiBackground,
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
    url: media.url ? toAbsoluteMediaUrl(strapiDomainUrl, media.url) : "",
    alt: media.alternativeText ?? "",
    width: media.width,
    height: media.height,
  };
}

// Link ~ Navigation Link
export enum LinkType {
  INTERNAL = "internal",
  EXTERNAL = "external",
  MODAL = "modal",
}

export type Link = {
  id: number;
  label: string;
  type: LinkType;
  to?: string;
  newTab?: boolean;
  modalKey?: string;
};

function pageToPath(page: StrapiPageRef | null): string {
  if (!page) return "#"; // null guard: trường hợp internal link nhưng chưa gắn page

  // Format: /{locale}/{slug}
  return `/${page.locale}/${page.slug}`;
}

export function mapLink(link: StrapiLink): Link {
  let type: LinkType;
  switch (link.type) {
    case "internal": {
      type = LinkType.INTERNAL;
      break;
    }
    case "external": {
      type = LinkType.EXTERNAL;
      break;
    }
    case "modal": {
      type = LinkType.MODAL;
      break;
    }
  }

  if (type === LinkType.MODAL) {
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
        type === LinkType.EXTERNAL ? (link.url ?? "#") : pageToPath(link.page),
    };
  }
}

export function mapBackgound(
  b: StrapiBackground,
  strapiUrl: string,
): BackgroundBlock {
  let type: BackgroundType;
  switch (b.type) {
    case "default": {
      type = BackgroundType.DEFAULT;
      break;
    }
    case "color": {
      type = BackgroundType.COLOR;
      break;
    }
    case "image": {
      type = BackgroundType.COLOR;
      break;
    }
  }

  return {
    type: type,
    hexColor: b.hexColor,
    image: b.image ? mapMedia(b.image, strapiUrl) : null,
  };
}

// Menu's item
export type MenuItem = Link & { children: Link[] };

export function mapMenuItem(item: StrapiNavItem): MenuItem {
  return {
    ...mapLink(item.link), // Làm phẳng object (lấy tất cả prop của item.link, bỏ vào Link)
    children: (item.children ?? []).map(mapLink),
  };
}
