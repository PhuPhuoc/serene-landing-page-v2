// server/utils/journal.ts
// Wire → client cho collection `posts` và các component `journal.*`.
// Rich text được chuẩn hoá ở đây để component chỉ việc switch theo `type`:
// - text node mang mảng `marks` thay vì từng boolean rời
// - list gom `children` → `items`
// - code gom text con về một chuỗi
// - link/URL được lọc protocol (chặn javascript:…)
import type {
  JournalAuthor,
  JournalAuthorRef,
  JournalBlock,
  JournalInlineMark,
  JournalInlineNode,
  JournalPostSummary,
  JournalRichTextNode,
  JournalSeo,
  JournalTextNode,
  Media,
} from "../../types";
import type {
  StrapiAuthor,
  StrapiJournalBlock,
  StrapiPost,
  StrapiRichTextNode,
  StrapiSeo,
} from "../types/strapi";
import { mapMedia, toAbsoluteMediaUrl } from "./mapper.ts";

// Chỉ cho link nội bộ, anchor và các protocol an toàn. Link lạ bị hạ xuống
// text để không render được `javascript:` / `data:` từ CMS.
function sanitizeLink(url?: string | null): string | null {
  const value = url?.trim();
  if (!value) return null;

  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;

  return null;
}

function textNode(node: StrapiRichTextNode): JournalTextNode {
  const marks: JournalInlineMark[] = [];

  if (node.bold) marks.push("bold");
  if (node.italic) marks.push("italic");
  if (node.underline) marks.push("underline");
  if (node.strikethrough) marks.push("strikethrough");
  if (node.code) marks.push("code");

  return { type: "text", text: node.text ?? "", marks };
}

// Link chỉ chứa text con (Strapi Blocks không lồng link trong link), nhưng vẫn
// flatten đệ quy để không mất chữ nếu CMS trả cấu trúc lạ.
function mapLinkChildren(
  nodes: StrapiRichTextNode[] | undefined,
): JournalTextNode[] {
  return (nodes ?? []).flatMap((node) => {
    if (node.type === "text") return [textNode(node)];
    return node.children ? mapLinkChildren(node.children) : [];
  });
}

function mapInline(
  nodes: StrapiRichTextNode[] | undefined,
): JournalInlineNode[] {
  return (nodes ?? []).flatMap((node): JournalInlineNode[] => {
    if (node.type === "text") {
      const text = node.text ?? "";
      return text ? [textNode(node)] : [];
    }

    if (node.type === "link") {
      const children = mapLinkChildren(node.children);
      if (!children.length) return [];

      const url = sanitizeLink(node.url);
      // URL không an toàn: giữ chữ, bỏ phần link.
      return url ? [{ type: "link" as const, url, children }] : children;
    }

    return [];
  });
}

function mapBlockNode(
  node: StrapiRichTextNode,
  strapiUrl: string,
): JournalRichTextNode | null {
  switch (node.type) {
    case "paragraph":
      return { type: "paragraph", children: mapInline(node.children) };

    case "heading": {
      const level = node.level === 3 || node.level === 4 ? node.level : 2;
      return { type: "heading", level, children: mapInline(node.children) };
    }

    case "list":
      return {
        type: "list",
        format: node.format === "ordered" ? "ordered" : "unordered",
        items: (node.children ?? [])
          .filter((item) => item.type === "list-item")
          .map((item) => ({ children: mapInline(item.children) })),
      };

    case "quote":
      return { type: "quote", children: mapInline(node.children) };

    case "code":
      return {
        type: "code",
        language: node.language ?? null,
        text: mapLinkChildren(node.children)
          .map((child) => child.text)
          .join(""),
      };

    case "image": {
      if (!node.image?.url) return null;
      return {
        type: "image",
        image: mapMedia(node.image, strapiUrl),
        caption: node.caption ?? null,
      };
    }

    default:
      return null;
  }
}

export function mapRichText(
  nodes: StrapiRichTextNode[] | undefined,
  strapiUrl: string,
): JournalRichTextNode[] {
  return (nodes ?? []).flatMap((node) => {
    const mapped = mapBlockNode(node, strapiUrl);
    return mapped ? [mapped] : [];
  });
}

function mapBlock(
  block: StrapiJournalBlock,
  strapiUrl: string,
): JournalBlock | null {
  const component = block.__component;

  switch (component) {
    case "journal.rich-text-block": {
      const nodes = mapRichText(block.content, strapiUrl);
      if (!nodes.length) return null;
      return {
        type: "rich-text",
        id: block.id,
        nodes,
        fontSize: block.fontSize ?? null,
      };
    }

    case "journal.image-block": {
      if (!block.image?.url) return null;
      return {
        type: "image",
        id: block.id,
        image: mapMedia(block.image, strapiUrl),
        caption: block.caption ?? null,
      };
    }

    case "journal.gallery-block": {
      const images = (block.images ?? [])
        .filter((image) => !!image?.url)
        .map((image) => mapMedia(image, strapiUrl));
      if (!images.length) return null;
      return {
        type: "gallery",
        id: block.id,
        images,
        caption: block.caption ?? null,
        layout: block.layout ?? "carousel",
      };
    }

    case "journal.video-block": {
      const candidate = block.isExternalVideo ? sanitizeLink(block.url) : null;
      const externalUrl =
        candidate && /^https?:\/\//i.test(candidate) ? candidate : null;
      const src =
        !externalUrl && block.video?.url
          ? toAbsoluteMediaUrl(strapiUrl, block.video.url)
          : null;

      if (!externalUrl && !src) return null;
      return {
        type: "video",
        id: block.id,
        src,
        externalUrl,
        caption: block.caption ?? null,
      };
    }

    case "journal.two-column-block": {
      if (!block.image?.url) return null;
      const nodes = mapRichText(block.content, strapiUrl);
      if (!nodes.length) return null;
      return {
        type: "two-column",
        id: block.id,
        image: mapMedia(block.image, strapiUrl),
        nodes,
        imagePosition: block.imagePosition === "left" ? "left" : "right",
      };
    }

    default:
      console.warn(`[posts] Unknown block: ${component}`);
      return null;
  }
}

export function mapJournalBlocks(
  blocks: StrapiJournalBlock[] | null | undefined,
  strapiUrl: string,
): JournalBlock[] {
  return (blocks ?? []).flatMap((block) => {
    const mapped = mapBlock(block, strapiUrl);
    return mapped ? [mapped] : [];
  });
}

export function mapJournalAuthorRef(
  author: StrapiAuthor | null | undefined,
): JournalAuthorRef | null {
  if (!author?.documentId || !author.name) return null;

  return {
    documentId: author.documentId,
    name: author.name,
    slug: author.slug ?? "",
  };
}

export function mapJournalAuthor(
  author: StrapiAuthor | null | undefined,
  strapiUrl: string,
): JournalAuthor | null {
  const ref = mapJournalAuthorRef(author);
  if (!ref || !author) return null;

  return {
    ...ref,
    role: author.role ?? null,
    bio: author.bio ?? null,
    avatar: author.avatar?.url ? mapMedia(author.avatar, strapiUrl) : null,
  };
}

export function mapJournalCover(
  media: StrapiPost["cover"],
  strapiUrl: string,
): Media | null {
  return media?.url ? mapMedia(media, strapiUrl) : null;
}

export function mapJournalPostSummary(
  post: StrapiPost,
  strapiUrl: string,
): JournalPostSummary {
  return {
    id: post.id,
    documentId: post.documentId,
    slug: post.slug,
    title: post.title,
    cover: mapJournalCover(post.cover, strapiUrl),
    coverAlt: post.coverAlt ?? "",
    publishedDate: post.publishedDate ?? null,
    author: mapJournalAuthorRef(post.author),
  };
}

export function mapJournalSeo(
  seo: StrapiSeo | null | undefined,
  strapiUrl: string,
): JournalSeo | null {
  if (!seo) return null;

  return {
    metaTitle: seo.metaTitle ?? null,
    metaDescription: seo.metaDescription ?? null,
    ogImage: seo.ogImage?.url ? mapMedia(seo.ogImage, strapiUrl) : null,
    noIndex: !!seo.noIndex,
  };
}
