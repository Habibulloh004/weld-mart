import { backUrl } from "@/lib/utils";

const normalizeTags = (tag) => {
  if (!tag) return undefined;
  const tags = Array.isArray(tag) ? tag : [tag];
  const normalized = tags
    .map((value) => String(value).trim())
    .filter(Boolean);
  return normalized.length ? normalized : undefined;
};

export async function getData(endpoint, tag) {
  const url = `${backUrl}${endpoint}`;
  const isServer = typeof window === "undefined";
  const tags = normalizeTags(tag);
  try {
    const response = await fetch(
      url,
      isServer
        ? {
            method: "GET",
            cache: "force-cache",
            ...(tags ? { next: { tags } } : {}),
            redirect: "follow",
          }
        : { method: "GET", redirect: "follow" }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return await response?.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null; // Xatolik bo'lsa, `null` qaytariladi
  }
}
