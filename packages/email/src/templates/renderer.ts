/**
 * @buildbase/email - Template Renderer
 * Handlebars-based template rendering with variable extraction
 */

import Handlebars from "handlebars";
import { convert } from "html-to-text";
import type { TemplateVariable, TemplateVariableType, VariableValidationResult } from "./types.js";

/**
 * Compile and render a template with variables
 */
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template);
  return compiled(variables);
}

/**
 * Extract variables from a template string
 * Supports: {{variable}}, {{nested.variable}}, {{#if condition}}, {{#each items}}
 */
export function extractVariables(template: string): TemplateVariable[] {
  const variableRegex = /\{\{([^{}]+)\}\}/g;
  const variables = new Map<string, TemplateVariable>();

  let match;
  while ((match = variableRegex.exec(template)) !== null) {
    const content = match[1]?.trim();
    if (!content) continue;

    // Skip helpers like #if, #each, /if, /each, else
    if (content.startsWith("#") || content.startsWith("/") || content === "else") {
      // Extract variable from helper (e.g., "#if showButton" -> "showButton")
      const helperMatch = content.match(/^#(?:if|unless)\s+(\w+)/);
      if (helperMatch?.[1]) {
        const varName = helperMatch[1];
        if (!variables.has(varName)) {
          variables.set(varName, {
            name: varName,
            type: "boolean",
            required: true,
          });
        }
      }

      // Extract variable from each (e.g., "#each items" -> "items")
      const eachMatch = content.match(/^#each\s+(\w+)/);
      if (eachMatch?.[1]) {
        const varName = eachMatch[1];
        if (!variables.has(varName)) {
          variables.set(varName, {
            name: varName,
            type: "array",
            required: true,
          });
        }
      }
      continue;
    }

    // Handle nested paths like user.name -> extract "user"
    const rootVar = content.split(".")[0]?.split(" ")[0];

    // Skip special variables like "this", "@index", "@key"
    if (!rootVar || rootVar.startsWith("@") || rootVar === "this") {
      continue;
    }

    if (!variables.has(rootVar)) {
      variables.set(rootVar, {
        name: rootVar,
        type: inferType(content),
        required: true,
      });
    }
  }

  return Array.from(variables.values());
}

/**
 * Infer variable type from usage context
 */
function inferType(content: string): TemplateVariableType {
  // If it has a dot, it's likely an object
  if (content.includes(".")) {
    return "object";
  }
  // Default to string
  return "string";
}

/**
 * Validate variables against template requirements
 */
export function validateVariables(
  templateVariables: TemplateVariable[],
  providedVariables: Record<string, unknown>
): VariableValidationResult {
  const missing: string[] = [];
  const extra: string[] = [];
  const typeErrors: Array<{
    variable: string;
    expected: TemplateVariableType;
    received: string;
  }> = [];

  const requiredVars = new Set(templateVariables.filter(v => v.required).map(v => v.name));
  const allVars = new Set(templateVariables.map(v => v.name));

  // Check for missing required variables
  for (const varDef of templateVariables) {
    if (varDef.required && !(varDef.name in providedVariables)) {
      // Check if there's a default
      if (varDef.default === undefined) {
        missing.push(varDef.name);
      }
    }

    // Type check
    if (varDef.name in providedVariables) {
      const value = providedVariables[varDef.name];
      const actualType = getValueType(value);

      if (!isTypeCompatible(varDef.type, actualType)) {
        typeErrors.push({
          variable: varDef.name,
          expected: varDef.type,
          received: actualType,
        });
      }
    }
  }

  // Check for extra variables (warning only)
  for (const key of Object.keys(providedVariables)) {
    if (!allVars.has(key)) {
      extra.push(key);
    }
  }

  return {
    valid: missing.length === 0 && typeErrors.length === 0,
    missing,
    extra,
    typeErrors,
  };
}

/**
 * Get the type of a value
 */
function getValueType(value: unknown): string {
  if (value === null || value === undefined) {
    return "undefined";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}

/**
 * Check if types are compatible
 */
function isTypeCompatible(expected: TemplateVariableType, actual: string): boolean {
  if (expected === actual) return true;
  if (expected === "string" && actual !== "undefined") return true; // Anything can be string
  if (expected === "object" && actual === "object") return true;
  return false;
}

/**
 * Apply default values to variables
 */
export function applyDefaults(
  templateVariables: TemplateVariable[],
  providedVariables: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...providedVariables };

  for (const varDef of templateVariables) {
    if (!(varDef.name in result) && varDef.default !== undefined) {
      result[varDef.name] = varDef.default;
    }
  }

  return result;
}

/**
 * Convert HTML to plain text
 */
export function htmlToText(html: string): string {
  return convert(html, {
    wordwrap: 80,
    selectors: [
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "img", format: "skip" },
    ],
  });
}

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

/**
 * Register custom Handlebars helpers
 */
export function registerHelpers(): void {
  // Date formatting helper
  Handlebars.registerHelper("formatDate", function (date: Date | string) {
    const d = new Date(date);
    return d.toLocaleDateString();
  });

  // Uppercase helper
  Handlebars.registerHelper("uppercase", function (str: string) {
    return str?.toUpperCase() ?? "";
  });

  // Lowercase helper
  Handlebars.registerHelper("lowercase", function (str: string) {
    return str?.toLowerCase() ?? "";
  });

  // Capitalize helper
  Handlebars.registerHelper("capitalize", function (str: string) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Default value helper
  Handlebars.registerHelper("default", function (value: unknown, defaultValue: unknown) {
    return value ?? defaultValue;
  });

  // Equals comparison
  Handlebars.registerHelper("eq", function (a: unknown, b: unknown) {
    return a === b;
  });

  // Not equals comparison
  Handlebars.registerHelper("neq", function (a: unknown, b: unknown) {
    return a !== b;
  });
}

// Register helpers on module load
registerHelpers();
