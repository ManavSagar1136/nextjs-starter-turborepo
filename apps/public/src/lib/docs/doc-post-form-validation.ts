import { z } from "zod";

// Document post form validation schema
export const docPostFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .refine((val) => val.trim().length > 0, "Title cannot be empty"),

  slug: z
    .string()
    .max(200, "Slug cannot exceed 200 characters")
    .optional()
    .refine(
      (val) => !val || val.trim().length === 0 || /^[a-z0-9-]+$/.test(val),
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),

  subtitle: z
    .string()
    .max(200, "Subtitle cannot exceed 200 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  content: z
    .string()
    .min(1, "Content is required")
    .refine((val) => val.trim().length > 0, "Content cannot be empty"),

  folderId: z.string().optional().nullable(),

  order: z
    .number()
    .int("Order must be an integer")
    .min(0, "Order cannot be negative")
    .optional()
    .nullable(),

  published: z.boolean().default(false),

  seoTitle: z
    .string()
    .max(200, "SEO title cannot exceed 200 characters")
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.trim().length === 0 || val.trim().length > 0,
      "SEO title cannot be empty",
    ),

  seoDescription: z
    .string()
    .max(500, "SEO description cannot exceed 500 characters")
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.trim().length === 0 || val.trim().length > 0,
      "SEO description cannot be empty",
    ),

  seoKeywords: z.array(z.string()).default([]),
});

export type DocPostFormValues = z.infer<typeof docPostFormSchema>;
