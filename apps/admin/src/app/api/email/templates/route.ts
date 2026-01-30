import { NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { createEmailTemplate, listEmailTemplates, type CreateEmailTemplateInput } from "@buildbase/database";

/**
 * GET /api/email/templates
 * List all email templates with optional filters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive");

    const result = await listEmailTemplates(prisma, {
      page,
      limit,
      category: category as CreateEmailTemplateInput["category"],
      search,
      isActive: isActive ? isActive === "true" : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Failed to list email templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

/**
 * POST /api/email/templates
 * Create a new email template
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.subject || !body.html) {
      return NextResponse.json({ error: "Missing required fields: name, subject, html" }, { status: 400 });
    }

    const template = await createEmailTemplate(
      prisma,
      {
        slug: body.slug,
        name: body.name,
        description: body.description,
        subject: body.subject,
        html: body.html,
        text: body.text,
        design: body.design,
        category: body.category || "TRANSACTIONAL",
        tags: body.tags || [],
        variables: body.variables,
        workspaceId: body.workspaceId,
      },
      body.userId
    );

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create email template:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
