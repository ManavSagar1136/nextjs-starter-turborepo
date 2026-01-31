import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { getEmailProviderById, updateEmailProvider, deleteEmailProvider, setDefaultEmailProvider } from "@buildbase/database";
import { encryptConfig, decryptConfig } from "@buildbase/email";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/email/providers/[id]
 * Get a single email provider by ID
 * Requires: Admin role
 */
async function handleGET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeConfig = searchParams.get("includeConfig") === "true";

    const provider = await getEmailProviderById(prisma, id);

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Decrypt config if requested (for edit mode)
    if (includeConfig) {
      try {
        const decryptedConfig = decryptConfig<Record<string, unknown>>(provider.config);
        return NextResponse.json({
          ...provider,
          config: decryptedConfig,
        });
      } catch (error) {
        console.error("[API] Failed to decrypt config:", error);
        return NextResponse.json({ error: "Failed to decrypt provider config" }, { status: 500 });
      }
    }

    // Don't return decrypted config by default
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

    const existing = await getEmailProviderById(prisma, id);
    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    let encryptedConfig: string | undefined;
    if (body.config) {
      encryptedConfig = encryptConfig(body.config);
    }

    const isDefault = body.isDefault !== undefined ? Boolean(body.isDefault) : undefined;
    const workspaceId = existing.workspaceId ?? null;

    const provider = await prisma.$transaction(async tx => {
      if (isDefault === true) {
        const existingDefaults = await tx.emailProvider.findMany({
          where: { isDefault: true },
          select: { id: true, workspaceId: true },
        });

        const defaultsToClear = existingDefaults.filter(p => {
          const pWorkspaceId = p.workspaceId ?? null;
          return p.id !== id && pWorkspaceId === workspaceId;
        });

        if (defaultsToClear.length > 0) {
          const idsToClear = defaultsToClear.map(p => p.id);
          await tx.emailProvider.updateMany({
            where: {
              id: { in: idsToClear },
              isDefault: true,
            },
            data: { isDefault: false },
          });
        }
      }

      return await tx.emailProvider.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(encryptedConfig && { config: encryptedConfig }),
          ...(body.fromName && { fromName: body.fromName }),
          ...(body.fromEmail && { fromEmail: body.fromEmail }),
          ...(body.replyTo !== undefined && { replyTo: body.replyTo }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(isDefault !== undefined && { isDefault: isDefault }),
          updatedById: user?.userId,
        },
      });
    });

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
      const { EmailFactory } = await import("@buildbase/email");
      const { sendTestEmail } = await import("@buildbase/email");

      if (!EmailFactory.isInitialized()) {
        const { prisma: dbPrisma } = await import("@buildbase/database");
        const { EmailService } = await import("@buildbase/email");
        await EmailService.initialize(dbPrisma);
      }

      const factory = EmailFactory.getInstance();
      const provider = await factory.getProvider(id);

      // First, validate credentials
      const connectionTest = await provider.testConnection();
      if (!connectionTest.success) {
        return NextResponse.json({
          success: false,
          error: connectionTest.error || "Connection test failed",
          connectionValid: false,
        });
      }

      // If email is provided, send a real test email
      const body = await request.json().catch(() => ({}));
      const testEmail = body.email;

      if (testEmail) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testEmail)) {
          return NextResponse.json({
            success: false,
            error: "Invalid email address format",
            connectionValid: true,
          });
        }

        // Send real test email
        const emailResult = await sendTestEmail(testEmail, id);
        return NextResponse.json({
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          connectionValid: true,
          emailSent: emailResult.success,
        });
      }

      // If no email provided, just return connection test result
      return NextResponse.json({
        success: true,
        connectionValid: true,
        message: "Connection test successful. Provide an email address to send a test email.",
      });
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
