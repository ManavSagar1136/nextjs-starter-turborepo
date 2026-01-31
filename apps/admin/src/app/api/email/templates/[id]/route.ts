import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getEmailTemplateById, updateEmailTemplate, deleteEmailTemplate, duplicateEmailTemplate } from "@buildbase/database";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/email/templates/[id]
 * Get a single email template by ID
 * Requires: Admin role
 */
async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const template = await getEmailTemplateById(prisma, id);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[API] Failed to get email template:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

/**
 * PATCH /api/email/templates/[id]
 * Update an email template
 * Requires: Admin role
 */
async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    const template = await updateEmailTemplate(
      prisma,
      id,
      {
        name: body.name,
        description: body.description,
        subject: body.subject,
        html: body.html,
        text: body.text,
        design: body.design,
        category: body.category,
        tags: body.tags,
        variables: body.variables,
        isActive: body.isActive,
      },
      user?.userId
    );

    return NextResponse.json(template);
  } catch (error) {
    console.error("[API] Failed to update email template:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

/**
 * DELETE /api/email/templates/[id]
 * Delete an email template
 * Requires: Admin role
 */
async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteEmailTemplate(prisma, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete email template:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}

/**
 * POST /api/email/templates/[id]?action=duplicate
 * Duplicate an email template
 * Requires: Admin role
 */
async function handlePOST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const user = (request as any).authenticatedUser;

    if (action !== "duplicate") {
      return NextResponse.json({ error: "Invalid action. Use action=duplicate" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.newSlug) {
      return NextResponse.json({ error: "newSlug is required for duplication" }, { status: 400 });
    }

    const template = await duplicateEmailTemplate(prisma, id, body.newSlug, user?.userId);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to duplicate email template:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Failed to duplicate template" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
