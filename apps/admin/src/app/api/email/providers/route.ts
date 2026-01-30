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

    const encryptedConfig = encryptConfig(body.config || {});

    const isDefault = Boolean(body.isDefault);
    const workspaceId = body.workspaceId ?? null;

    const provider = await prisma.$transaction(async tx => {
      if (isDefault) {
        const existingDefaults = await tx.emailProvider.findMany({
          where: { isDefault: true },
          select: { id: true, workspaceId: true },
        });

        const defaultsToClear = existingDefaults.filter(p => {
          const pWorkspaceId = p.workspaceId ?? null;
          return pWorkspaceId === workspaceId;
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

      const { PROVIDER_REQUIRED_FIELDS } = await import("@buildbase/database");
      const requiredFields = PROVIDER_REQUIRED_FIELDS[body.type as keyof typeof PROVIDER_REQUIRED_FIELDS] ?? [];
      for (const field of requiredFields) {
        if (
          !body.config ||
          body.config[field] === undefined ||
          body.config[field] === null ||
          body.config[field] === ""
        ) {
          throw new Error(`Missing required field for ${body.type} provider: ${field}`);
        }
      }

      return await tx.emailProvider.create({
        data: {
          name: body.name,
          description: body.description,
          type: body.type,
          config: encryptedConfig,
          fromName: body.fromName,
          fromEmail: body.fromEmail,
          replyTo: body.replyTo,
          isDefault: isDefault,
          workspaceId: body.workspaceId,
          createdById: user?.userId,
        },
      });
    });

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
