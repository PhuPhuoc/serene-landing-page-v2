import {
  type StrapiBento,
  type StrapiCard,
  type StrapiFeature,
  type StrapiPricingTier,
} from "../types/strapi";
import {
  CtaVariant,
  mapBackground,
  mapLink,
  mapMedia,
} from "./mapper";

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
      id: b.id,
      eyebrow: b.eyebrow,
      headline: b.headline,
      subheadline: b.subheadline,
      backgroundImage: mapMedia(b.backgroundImage, strapiUrl),
      imageCaption: b.imageCaption,
      primaryCta: b.primaryCta
        ? mapLink(b.primaryCta, CtaVariant.SOLID)
        : null,
      secondaryCta: b.secondaryCta
        ? mapLink(b.secondaryCta, CtaVariant.UNDERLINE)
        : null,
    }),
  },

  "block.intro": {
    populate: { tags: true },
    map: (b) => ({
      type: "intro" as const,
      id: b.id,
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
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      moments: (b.moments ?? []).map((t: any) => ({
        id: t.id,
        label: t.label,
        title: t.title,
        description: t.description,
        image: t.image ? mapMedia(t.image, strapiUrl) : null,
        cta: mapLink(t.cta, CtaVariant.UNDERLINE),
      })),
    }),
  },

  "block.simple-section": {
    populate: {
      image: true,
      cta: { populate: ["page"] },
      background: { populate: { image: true } },
    },
    map: (b, strapiURL) => ({
      type: "simple-section" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      body: b.body,
      image: b.image ? mapMedia(b.image, strapiURL) : null,
      imageCaption: b.imageCaption,
      imagePosition: b.imagePosition,
      cta: mapLink(b.cta, CtaVariant.SOLID),
      background: mapBackground(b.background, strapiURL),
    }),
  },

  "block.visit": {
    populate: {
      directionsCta: { populate: ["page"] },
      mapImage: true,
    },
    map: (b, strapiURL) => ({
      type: "visit" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      address: b.address,
      phone: b.phone,
      zaloUrl: b.zaloUrl,
      email: b.email,
      note: b.note,
      directionsCta: b.directionsCta
        ? mapLink(b.directionsCta, CtaVariant.UNDERLINE)
        : null,
      pinTitle: b.pinTitle,
      pinSubtitle: b.pinSubtitle,
      latitude: b.latitude,
      longitude: b.longitude,
      mapEmbedUrl: b.mapEmbedUrl,
      mapImage: b.mapImage ? mapMedia(b.mapImage, strapiURL) : null,
      newsletterText: b.newsletterText,
      emailPlaceholder: b.emailPlaceholder,
      submitLabel: b.submitLabel,
    }),
  },

  "block.membership": {
    populate: {
      primaryCta: { populate: ["page"] },
      secondaryCta: { populate: ["page"] },
      features: true,
      background: { populate: { image: true } },
    },
    map: (b, strapiURL) => ({
      type: "membership" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      description: b.description,
      primaryCta: mapLink(b.primaryCta, CtaVariant.SOLID),
      secondaryCta: mapLink(b.secondaryCta, CtaVariant.UNDERLINE),
      features: (b.features ?? []).map((f: StrapiFeature) => ({
        id: f.id,
        title: f.title,
        description: f.description,
      })),
      background: mapBackground(b.background, strapiURL),
    }),
  },

  "block.tier": {
    populate: {
      primaryCta: { populate: ["page"] },
      secondaryCta: { populate: ["page"] },
      tiers: true,
      background: { populate: { image: true } },
    },
    map: (b, strapiURL) => ({
      type: "tier" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      note: b.note,
      primaryCta: mapLink(b.primaryCta, CtaVariant.SOLID),
      secondaryCta: mapLink(b.secondaryCta, CtaVariant.UNDERLINE),
      tiers: (b.tiers ?? []).map((t: StrapiPricingTier) => ({
        id: t.id,
        name: t.name,
        price: t.price,
        priceLabel: t.priceLabel,
        description: t.description,
        period: t.period,
      })),
      background: mapBackground(b.background, strapiURL),
    }),
  },

  "block.club-events": {
    populate: {
      primaryCta: { populate: ["page"] },
      secondaryCta: { populate: ["page"] },
      background: { populate: { image: true } },
    },
    map: (b, strapiURL) => ({
      type: "club-event" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      note: b.note,
      limit: b.limit,
      primaryCta: mapLink(b.primaryCta, CtaVariant.SOLID),
      secondaryCta: mapLink(b.secondaryCta, CtaVariant.UNDERLINE),
      background: mapBackground(b.background, strapiURL),
    }),
  },

  "block.private-event": {
    populate: {
      primaryCta: { populate: ["page"] },
      secondaryCta: { populate: ["page"] },
      background: { populate: { image: true } },
    },
    map: (b, strapiURL) => ({
      type: "private-event" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      description: b.description,
      primaryCta: mapLink(b.primaryCta, CtaVariant.SOLID),
      secondaryCta: mapLink(b.secondaryCta, CtaVariant.UNDERLINE),
      background: mapBackground(b.background, strapiURL),
    }),
  },

  "block.wine-and-dine": {
    populate: {
      venues: {
        populate: {
          cta: { populate: ["page"] },
          image: true,
        },
      },
      background: { populate: { image: true } },
    },
    map: (b, strapiURL) => ({
      type: "wine-and-dine" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      venues: (b.venues ?? []).map((t: StrapiCard) => ({
        id: t.id,
        heading: t.heading,
        description: t.description,
        cta: mapLink(t.cta, CtaVariant.UNDERLINE),
        image: t.image ? mapMedia(t.image, strapiURL) : null,
        imageCaption: t.imageCaption ? t.imageCaption : "",
      })),
      background: mapBackground(b.background, strapiURL),
    }),
  },

  "block.wellness-and-leisure": {
    populate: {
      bentos: {
        populate: {
          images: true,
        },
      },
      background: { populate: { image: true } },
    },
    map: (b, strapiURL) => ({
      type: "wellness-and-leisure" as const,
      id: b.id,
      eyebrow: b.eyebrow,
      heading: b.heading,
      description: b.description,
      bentos: (b.bentos ?? []).map((t: StrapiBento) => ({
        id: t.id,
        heading: t.heading,
        description: t.description,
        images: (t.images ?? [])
          .filter((m) => !!m?.url)
          .map((m) => mapMedia(m, strapiURL)),
        defaultHexColor: t.defaultHexColor,
      })),
      background: mapBackground(b.background, strapiURL),
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
