import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { createEmailProvider, listEmailProviders } from "@buildbase/database";
import { encryptConfig } from "@buildbase/email";

/**
 * GET /api/email/providers
 * List all email providers
 * Requires: Admin role
 */
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;

    const providers = await listEmailProviders(prisma, workspaceId);

    // Don't return decrypted config in list
    const safeProviders = providers.map(p => ({
      ...p,
      config: "[encrypted]",
    }));

    return NextResponse.json(safeProviders);
  } catch (error) {
    console.error("[API] Failed to list email providers:", error);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}

/**
 * POST /api/email/providers
 * Create a new email provider
 * Requires: Admin role
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = (request as any).authenticatedUser;

    // Validate required fields
    if (!body.name || !body.type || !body.fromName || !body.fromEmail) {
      return NextResponse.json({ error: "Missing required fields: name, type, fromName, fromEmail" }, { status: 400 });
    }

    // Encrypt the configuration
    const encryptedConfig = encryptConfig(body.config || {});

    const provider = await createEmailProvider(
      prisma,
      {
        name: body.name,
        description: body.description,
        type: body.type,
        config: body.config || {},
        fromName: body.fromName,
        fromEmail: body.fromEmail,
        replyTo: body.replyTo,
        isDefault: body.isDefault || false,
        workspaceId: body.workspaceId,
      },
      encryptedConfig,
      user?.userId
    );

    // Don't return config in response
    return NextResponse.json({ ...provider, config: "[encrypted]" }, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create email provider:", error);

    if (error instanceof Error && error.message.includes("Missing required")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create provider" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
