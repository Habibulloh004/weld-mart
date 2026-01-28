// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

export async function POST(req) {
  try {
    const { tag, tags, path, paths } = await req.json();
    const resolvedTags = [
      ...new Set([...normalizeList(tag), ...normalizeList(tags)]),
    ];
    const resolvedPaths = [
      ...new Set([...normalizeList(path), ...normalizeList(paths)]),
    ];

    if (!resolvedTags.length && !resolvedPaths.length) {
      return NextResponse.json(
        { success: false, error: "Tag or path is required" },
        { status: 400 }
      );
    }

    resolvedTags.forEach((tagItem) => revalidateTag(tagItem));
    resolvedPaths.forEach((pathItem) => revalidatePath(pathItem));

    return NextResponse.json({
      success: true,
      revalidated: {
        tags: resolvedTags,
        paths: resolvedPaths,
      },
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
