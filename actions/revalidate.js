const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

export const buildRevalidatePayload = ({ tags, paths }) => {
  const normalizedTags = normalizeList(tags);
  const normalizedPaths = normalizeList(paths);
  if (!normalizedTags.length && !normalizedPaths.length) {
    return null;
  }
  return {
    tags: normalizedTags.length ? [...new Set(normalizedTags)] : undefined,
    paths: normalizedPaths.length ? [...new Set(normalizedPaths)] : undefined,
  };
};

export const triggerRevalidate = async ({ tags, paths } = {}) => {
  const payload = buildRevalidatePayload({ tags, paths });
  if (!payload) return;

  await fetch(`${process.env.NEXT_PUBLIC_URL}/api/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};
