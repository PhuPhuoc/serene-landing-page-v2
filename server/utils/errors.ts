// server/utils/errors.ts
type FetchError = {
  statusCode?: number;
  data?: unknown;
  message?: string;
};

export function handleStrapiError(err: unknown, context: string): never {
  const e = err as FetchError;

  console.error(`[Strapi] ${context}:`, e?.data ?? e?.message ?? err);

  throw createError({
    statusCode: e?.statusCode ?? 500,
    statusMessage: "Unable to fetch content",
  });
}
