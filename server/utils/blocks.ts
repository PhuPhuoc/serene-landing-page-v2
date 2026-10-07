// server/utils/blocks.ts
type BlockDef<T> = {
  populate: Record<string, unknown>;
  map: (block: any, strapiUrl: string) => T;
};

export const blockRegistry = {
  "block.hero": {
    populate: {
      backgroundImage: true,
      primaryCta: { populate: ["page"] },
      secondaryCta: { populate: ["page"] },
    },
    map: (b, strapiUrl) => ({
      type: "hero" as const,
      eyebrow: b.eyebrow,
      headline: b.headline,
      subheadline: b.subheadline,
      backgroundImage: mapMedia(b.backgroundImage, strapiUrl),
      imageCaption: b.imageCaption,
      primaryCta: b.primaryCta ? mapLink(b.primaryCta) : null,
      secondaryCta: b.secondaryCta ? mapLink(b.secondaryCta) : null,
    }),
  },

  "block.intro": {
    populate: { tags: true },
    map: (b) => ({
      type: "intro" as const,
      eyebrow: b.eyebrow,
      subtitle: b.subtitle,
      content: b.content,
      tags: (b.tags ?? []).map((t: any) => ({ label: t.label })),
    }),
  },

  "block.day-at": {
    populate: {
      moments: {
        populate: {
          image: true,
          cta: { populate: ["page"] },
        },
      },
    },
    map: (b, strapiUrl) => ({
      type: "day-at" as const,
      eyebrow: b.eyebrow,
      heading: b.heading,
      moments: (b.moments ?? []).map((t: any) => ({
        label: t.lable,
        title: t.title,
        description: t.description,
        image: t.image ? mapMedia(t.image, strapiUrl) : null,
        cta: mapLink(t.cta),
      })),
    }),
  },
} satisfies Record<string, BlockDef<unknown>>;

export const blocksPopulate = {
  on: Object.fromEntries(
    Object.entries(blockRegistry).map(([k, v]) => [
      k,
      { populate: v.populate },
    ]),
  ),
};
