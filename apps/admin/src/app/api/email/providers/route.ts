import { NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { createEmailProvider, listEmailProviders } from "@buildbase/database";
import { encryptConfig } from "@buildbase/email";

/**
 * GET /api/email/providers
 * List all email providers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const providers = activeOnly
      ? await listEmailProviders(prisma, workspaceId)
      : await listEmailProviders(prisma, workspaceId);

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
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

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
      body.userId
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
