import { backUrl } from "@/lib/utils";
import { triggerRevalidate } from "@/actions/revalidate";

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

const buildProductPaths = ({ data, result, endpoint }) => {
  const endpointMatch = endpoint?.match(/\/api\/products\/([^/?]+)/);
  const productId =
    result?.id ??
    result?.product?.id ??
    result?.data?.id ??
    data?.id ??
    endpointMatch?.[1];
  if (!productId) return [];

  const categoryId =
    data?.category_id ??
    result?.category_id ??
    result?.product?.category_id ??
    result?.data?.category_id;
  const brandId =
    data?.brand_id ??
    result?.brand_id ??
    result?.product?.brand_id ??
    result?.data?.brand_id;
  const bottomCategoryId =
    data?.bottom_category_id ??
    result?.bottom_category_id ??
    result?.product?.bottom_category_id ??
    result?.data?.bottom_category_id;

  const paths = [];
  if (categoryId) {
    paths.push(`/category/${categoryId}/product/${productId}`);
  }
  if (brandId) {
    paths.push(`/brand/${brandId}/product/${productId}`);
  }
  if (bottomCategoryId) {
    paths.push(`/podCategory/${bottomCategoryId}/product/${productId}`);
  }
  return paths;
};

export async function putData(data, endpoint, tag, revalidate) {
  const url = `${backUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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

      if (tag === "product") {
        paths.push(...buildProductPaths({ data, result, endpoint }));
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
