// server/utils/mapper.ts
import {
  type Background,
  BackgroundType,
  type Link,
  CtaBehavior,
  CtaVariant,
  type Media,
  type MenuItem,
} from "../types/blocks";
import type {
  StrapiMedia,
  StrapiNavItem,
  StrapiLink,
  StrapiCtaBehavior,
  StrapiCtaVariant,
  StrapiPageRef,
  StrapiBackground,
} from "../types/strapi";

// Re-export for convenience
export type { Media, Link, MenuItem };
export { CtaBehavior, CtaVariant };

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

export function mapMedia(media: StrapiMedia, strapiDomainUrl: string): Media {
  return {
    url: media.url ? toAbsoluteMediaUrl(strapiDomainUrl, media.url) : "",
    alt: media.alternativeText ?? "",
    width: media.width,
    height: media.height,
  };
}

function pageToPath(page: StrapiPageRef | null): string {
  if (!page) return "#"; // null guard: trường hợp internal link nhưng chưa gắn page

  // return `/${page.locale}/${page.slug}`;
  return `/${page.slug}`;
}

function mapCtaBehavior(
  value: StrapiCtaBehavior | null | undefined,
): CtaBehavior {
  switch (value) {
    case "external":
      return CtaBehavior.EXTERNAL;
    case "modal":
      return CtaBehavior.MODAL;
    default:
      return CtaBehavior.INTERNAL;
  }
}

function mapCtaVariant(
  value: StrapiCtaVariant | null | undefined,
  fallback: CtaVariant,
): CtaVariant {
  switch (value) {
    case "solid":
    case "solid-dark":
    case "solid-light":
      // solid-dark/solid-light là giá trị cũ: màu đã do `tone` của block quyết
      // định nên cả hai gom về một variant duy nhất.
      return CtaVariant.SOLID;
    case "underline":
      return CtaVariant.UNDERLINE;
    case "outline":
      return CtaVariant.OUTLINE;
    case "none":
      return CtaVariant.NONE;
    default:
      // CMS cũ chưa nhập ctaVariant (null) → dùng kiểu mặc định của từng chỗ.
      return fallback;
  }
}

export function mapLink(
  link: StrapiLink | null | undefined,
  fallbackStyle: CtaVariant = CtaVariant.NONE,
): Link {
  const type = mapCtaBehavior(link?.ctaBehavior);
  const style = mapCtaVariant(link?.ctaVariant, fallbackStyle);

  if (!link) {
    return {
      id: -1,
      documentId: "",
      label: "",
      type,
      style,
      withIcon: false,
    };
  }

  // Strapi dùng `ctaBehavior`/`ctaVariant`, client giữ `type`/`style` để
  // không phải sửa toàn bộ component đang đọc Link.
  const base = {
    id: link.id,
    documentId: link.page?.documentId ?? "",
    label: link.label,
    type,
    style,
    withIcon: !!link.withIcon,
  };

  if (type === CtaBehavior.MODAL) {
    // modalKey đã được giới hạn bởi StrapiLinkModalKey, trùng với ModalKey.
    return { ...base, modalKey: link.modalKey ?? undefined };
  }

  return {
    ...base,
    newTab: !!link.openInNewTab,
    to:
      type === CtaBehavior.EXTERNAL
        ? link.url || "#"
        : pageToPath(link.page),
  };
}

export function mapBackground(
  b: StrapiBackground | null | undefined,
  strapiUrl: string,
): Background | null {
  // `background` không bắt buộc trong Strapi nên có thể vắng/null.
  if (!b) return null;

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
      type = BackgroundType.IMAGE;
      break;
    }
  }

  return {
    type: type,
    hexColor: b.hexColor,
    image: b.image ? mapMedia(b.image, strapiUrl) : null,
  };
}

export function mapMenuItem(item: StrapiNavItem): MenuItem {
  return {
    ...mapLink(item.link), // Làm phẳng object (lấy tất cả prop của item.link, bỏ vào Link)
    children: (item.children ?? []).map((child) => mapLink(child)),
  };
}
