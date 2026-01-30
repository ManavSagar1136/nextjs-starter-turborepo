import { NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { getEmailProviderById, updateEmailProvider, deleteEmailProvider, setDefaultEmailProvider } from "@buildbase/database";
import { encryptConfig } from "@buildbase/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/email/providers/[id]
 * Get a single email provider by ID
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

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
      body.userId
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
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
 * POST /api/email/providers/[id]
 * Special actions (test connection)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
