import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getEmailProviderById, updateEmailProvider, deleteEmailProvider, setDefaultEmailProvider } from "@buildbase/database";
import { encryptConfig } from "@buildbase/email";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/email/providers/[id]
 * Get a single email provider by ID
 * Requires: Admin role
 */
async function handleGET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const provider = await getEmailProviderById(prisma, id);

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Don't return decrypted config
    return NextResponse.json({
      ...provider,
      config: "[encrypted]",
    });
  } catch (error) {
    console.error("[API] Failed to get email provider:", error);
    return NextResponse.json({ error: "Failed to fetch provider" }, { status: 500 });
  }
}

/**
 * PATCH /api/email/providers/[id]
 * Update an email provider
 * Requires: Admin role
 */
async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    // Handle special action for setting default
    if (body.action === "setDefault") {
      const provider = await setDefaultEmailProvider(prisma, id);
      return NextResponse.json({ ...provider, config: "[encrypted]" });
    }

    // Encrypt config if provided
    let encryptedConfig: string | undefined;
    if (body.config) {
      encryptedConfig = encryptConfig(body.config);
    }

    const provider = await updateEmailProvider(
      prisma,
      id,
      {
        name: body.name,
        description: body.description,
        fromName: body.fromName,
        fromEmail: body.fromEmail,
        replyTo: body.replyTo,
        isActive: body.isActive,
        isDefault: body.isDefault,
      },
      encryptedConfig,
      user?.userId
    );

    return NextResponse.json({ ...provider, config: "[encrypted]" });
  } catch (error) {
    console.error("[API] Failed to update email provider:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
  }
}

/**
 * DELETE /api/email/providers/[id]
 * Delete an email provider
 * Requires: Admin role
 */
async function handleDELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteEmailProvider(prisma, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete email provider:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete provider" }, { status: 500 });
  }
}

/**
 * POST /api/email/providers/[id]?action=test
 * Test provider connection
 * Requires: Admin role
 */
async function handlePOST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "test") {
      // Import dynamically to avoid circular deps
      const { EmailFactory } = await import("@buildbase/email");

      if (!EmailFactory.isInitialized()) {
        const { prisma: dbPrisma } = await import("@buildbase/database");
        const { EmailService } = await import("@buildbase/email");
        await EmailService.initialize(dbPrisma);
      }

      const factory = EmailFactory.getInstance();
      const provider = await factory.getProvider(id);
      const testResult = await provider.testConnection();

      return NextResponse.json(testResult);
    }

    return NextResponse.json({ error: "Invalid action. Use action=test" }, { status: 400 });
  } catch (error) {
    console.error("[API] Failed to perform provider action:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Action failed",
      },
      { status: 500 }
    );
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const PATCH = withAuth(handlePATCH, [APP_ROLES.ADMIN]);
export const DELETE = withAuth(handleDELETE, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
