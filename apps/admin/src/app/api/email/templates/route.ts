import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import {
  createEmailTemplate,
  listEmailTemplates,
  type CreateEmailTemplateInput,
  EmailTemplateType,
  EMAIL_TEMPLATE_TYPES,
} from "@buildbase/database";

/**
 * GET /api/email/templates
 * List all email templates with optional filters
 * Requires: Admin role
 */
async function handleGET(request: NextRequest) {
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

    // Transform response to match frontend expectations
    return NextResponse.json({
      docs: result.data,
      totalDocs: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[API] Failed to list email templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

/**
 * POST /api/email/templates
 * Create a new email template
 * Requires: Admin role
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    // Validate required fields: name, subject, and templateType
    if (!body.name || !body.subject || !body.templateType) {
      return NextResponse.json({ error: "Missing required fields: name, subject, templateType" }, { status: 400 });
    }

    // Validate templateType is one of the allowed values
    if (!EMAIL_TEMPLATE_TYPES.includes(body.templateType as EmailTemplateType)) {
      return NextResponse.json(
        { error: `Invalid templateType. Must be one of: ${EMAIL_TEMPLATE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // During creation, content is optional (can be added later in edit mode)
    // But if content is provided, validate it matches the templateType
    if (body.templateType === EmailTemplateType.HTML && body.html === undefined && body.text) {
      return NextResponse.json(
        { error: "Template type is 'html' but 'text' content was provided. Use 'html' field instead." },
        { status: 400 }
      );
    }
    if (body.templateType === EmailTemplateType.TEXT && body.text === undefined && body.html) {
      return NextResponse.json(
        { error: "Template type is 'text' but 'html' content was provided. Use 'text' field instead." },
        { status: 400 }
      );
    }
    if (body.templateType === EmailTemplateType.UNLAYER && body.design === undefined && (body.html || body.text)) {
      return NextResponse.json(
        { error: "Template type is 'unlayer' but html/text content was provided. Use 'design' field instead." },
        { status: 400 }
      );
    }

    // Prepare template data - only include content for the selected template type
    const templateData: Partial<CreateEmailTemplateInput> = {
      slug: body.slug,
      name: body.name,
      description: body.description,
      subject: body.subject,
      category: body.category || "TRANSACTIONAL",
      tags: body.tags || [],
      variables: body.variables,
      workspaceId: body.workspaceId,
      html: "",
      text: "",
      design: "",
    };

    // Only set content fields based on templateType
    if (body.templateType === EmailTemplateType.HTML) {
      templateData.html = body.html || "";
    } else if (body.templateType === EmailTemplateType.TEXT) {
      templateData.text = body.text || "";
    } else if (body.templateType === EmailTemplateType.UNLAYER) {
      templateData.design = body.design || "";
    }

    const template = await createEmailTemplate(prisma, templateData as CreateEmailTemplateInput, user?.userId);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create email template:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
