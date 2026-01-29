import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@buildbase/helpers/auth";
import { prisma } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
 * GET /api/tags/[id] - Get tag details
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;

    const tag = await prisma.mediaTag.findFirst({
      where: { id, workspaceId },
      include: {
        _count: {
          select: { assetTags: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        count: tag._count.assetTags,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting tag:", error);
    return NextResponse.json({ success: false, message: "Failed to get tag" }, { status: 500 });
  }
}

/**
 * PATCH /api/tags/[id] - Update tag
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;

    // Verify tag exists
    const existingTag = await prisma.mediaTag.findFirst({
      where: { id, workspaceId },
    });
    if (!existingTag) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, color } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined && name !== existingTag.name) {
      updateData.name = name;

      // Update slug if name changed
      const baseSlug = generateSlug(name);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await prisma.mediaTag.findFirst({
          where: { workspaceId, slug, NOT: { id } },
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      updateData.slug = slug;
    }

    if (color !== undefined) {
      updateData.color = color || null;
    }

    const tag = await prisma.mediaTag.update({
      where: { id },
      data: updateData,
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
    console.error("Error updating tag:", error);
    return NextResponse.json({ success: false, message: "Failed to update tag" }, { status: 500 });
  }
}

/**
 * DELETE /api/tags/[id] - Delete tag
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = session.user;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No workspace selected" }, { status: 400 });
    }

    const { id } = await params;

    // Verify tag exists
    const tag = await prisma.mediaTag.findFirst({
      where: { id, workspaceId },
    });
    if (!tag) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 });
    }

    // Delete tag (cascade will delete assetTags)
    await prisma.mediaTag.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ success: false, message: "Failed to delete tag" }, { status: 500 });
  }
}
