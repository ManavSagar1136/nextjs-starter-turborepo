import { NextRequest, NextResponse } from "next/server";
import type { ContactFormData } from "@/types/contact";

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();

    // Log the request
    console.log("[Contact Form API] Received contact form submission:", {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement email sending logic here
    // TODO: Implement database storage here

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Contact Form API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit contact form",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
