// server/utils/fetch-strapi.ts
import qs from "qs";

export async function fetchCMS<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { strapiUrl, strapiToken } = useRuntimeConfig();
  const query = qs.stringify(params, { encodeValuesOnly: true });

  const url = `${strapiUrl}/api${path}${query ? `?${query}` : ""}`;

  const res = await $fetch(url, {
    headers: { Authorization: `Bearer ${strapiToken}` },
  });

  // console.log("res:", JSON.stringify(res, null, 2));

  return res as T;
}
