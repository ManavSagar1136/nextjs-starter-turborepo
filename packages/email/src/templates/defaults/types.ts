/**
 * @buildbase/email - Template Variable Types
 */

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  default?: unknown;
  description?: string;
}
