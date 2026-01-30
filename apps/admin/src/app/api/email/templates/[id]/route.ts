import { NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { getEmailTemplateById, updateEmailTemplate, deleteEmailTemplate, duplicateEmailTemplate } from "@buildbase/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/email/templates/[id]
 * Get a single email template by ID
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

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
      body.userId
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
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
 * POST /api/email/templates/[id]
 * Duplicate an email template (with action=duplicate query param)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action !== "duplicate") {
      return NextResponse.json({ error: "Invalid action. Use action=duplicate" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.newSlug) {
      return NextResponse.json({ error: "newSlug is required for duplication" }, { status: 400 });
    }

    const template = await duplicateEmailTemplate(prisma, id, body.newSlug, body.userId);

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
