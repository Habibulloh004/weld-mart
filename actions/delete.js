import { backUrl } from "@/lib/utils";
import { triggerRevalidate } from "@/actions/revalidate";

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

export async function deleteData(endpoint, tag, revalidate) {
  const url = `${backUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      redirect: "follow",
    });
    const result = await response.json();

    if (response.ok && !result?.error) {
      const baseTags = normalizeList(tag);
      let paths = [];
      if (typeof revalidate === "string" || Array.isArray(revalidate)) {
        paths = normalizeList(revalidate);
      } else if (revalidate?.paths || revalidate?.tags) {
        paths = normalizeList(revalidate.paths);
        baseTags.push(...normalizeList(revalidate.tags));
      }

      await triggerRevalidate({ tags: baseTags, paths });
    }

    if (result.error) {
      return result;
    } else {
      return result;
    }
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null; // Xatolik bo'lsa, `null` qaytariladi
  }
}
