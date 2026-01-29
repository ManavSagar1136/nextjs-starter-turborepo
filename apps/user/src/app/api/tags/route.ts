import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * GET /api/tags - List tags
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("$page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("$limit") || "50", 10), 100);
    const skip = (page - 1) * limit;

    // Search
    const search = searchParams.get("search");

    // Build where clause
    const where: Record<string, unknown> = { workspaceId };
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Query tags with usage count
    const [tags, totalDocs] = await Promise.all([
      prisma.mediaTag.findMany({
        where,
        include: {
          _count: {
            select: { assetTags: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.mediaTag.count({ where }),
    ]);

    const docs = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      count: tag._count.assetTags,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(totalDocs / limit);

    return NextResponse.json({
      success: true,
      data: {
        docs,
        total: totalDocs,
        totalDocs,
        limit,
        page,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error listing tags:", error);
    return NextResponse.json({ success: false, message: "Failed to list tags" }, { status: 500 });
  }
}

/**
 * POST /api/tags - Create a tag
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, userId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Tag name is required" }, { status: 400 });
    }

    // Generate slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug within workspace
    while (true) {
      const existing = await prisma.mediaTag.findFirst({
        where: { workspaceId, slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create tag
    const tag = await prisma.mediaTag.create({
      data: {
        name,
        slug,
        color: color || null,
        workspaceId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ success: false, message: "Failed to create tag" }, { status: 500 });
  }
}
