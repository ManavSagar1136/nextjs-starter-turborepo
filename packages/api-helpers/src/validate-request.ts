/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { HttpStatusCode } from "axios";

/**
 * Safely parse JSON from request body
 */
export async function parseRequestBody<T = any>(
  request: NextRequest
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const data = await request.json();
    return { data, error: null };
  } catch (_error) {
    return {
      data: null,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON in request body",
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }
}

/**
 * Validate ObjectId format (MongoDB ObjectId)
 */
export function isValidObjectId(id: string | null | undefined): boolean {
  if (!id) return false;
  // MongoDB ObjectId is 24 hex characters
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate required string field
 */
export function validateRequiredString(value: any, fieldName: string): { valid: boolean; error?: NextResponse } {
  if (value === undefined || value === null) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `${fieldName} is required`,
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }

  if (typeof value !== "string") {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `${fieldName} must be a string`,
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }

  if (!value.trim()) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `${fieldName} cannot be empty`,
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }

  return { valid: true };
}

/**
 * Validate array field
 */
export function validateArray(value: any, fieldName: string): { valid: boolean; error?: NextResponse } {
  if (value === undefined || value === null) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `${fieldName} is required`,
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }

  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `${fieldName} must be an array`,
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }

  return { valid: true };
}

/**
 * Validate ObjectId field (optional)
 */
export function validateObjectId(
  value: any,
  fieldName: string,
  required: boolean = false
): { valid: boolean; error?: NextResponse } {
  if (value === undefined || value === null) {
    if (required) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `${fieldName} is required`,
            },
          },
          { status: HttpStatusCode.BadRequest }
        ),
      };
    }
    return { valid: true };
  }

  if (typeof value !== "string") {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `${fieldName} must be a string`,
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }

  if (!isValidObjectId(value)) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `${fieldName} must be a valid ObjectId`,
          },
        },
        { status: HttpStatusCode.BadRequest }
      ),
    };
  }

  return { valid: true };
}
