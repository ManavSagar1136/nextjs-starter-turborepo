/**
 * @buildbase/email - Template Tests
 */

import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  extractVariables,
  validateVariables,
  applyDefaults,
  htmlToText,
  generateSlug,
} from "../src/templates/renderer.js";
import type { TemplateVariable } from "../src/templates/types.js";

describe("Template Renderer", () => {
  describe("renderTemplate", () => {
    it("should render simple variables", () => {
      const template = "Hello, {{name}}!";
      const result = renderTemplate(template, { name: "John" });
      expect(result).toBe("Hello, John!");
    });

    it("should render nested variables", () => {
      const template = "Hello, {{user.name}}!";
      const result = renderTemplate(template, { user: { name: "Jane" } });
      expect(result).toBe("Hello, Jane!");
    });

    it("should handle missing variables", () => {
      const template = "Hello, {{name}}!";
      const result = renderTemplate(template, {});
      expect(result).toBe("Hello, !");
    });

    it("should render conditionals", () => {
      const template = "{{#if showButton}}<button>Click</button>{{/if}}";
      expect(renderTemplate(template, { showButton: true })).toContain("button");
      expect(renderTemplate(template, { showButton: false })).toBe("");
    });

    it("should render loops", () => {
      const template = "{{#each items}}<li>{{this}}</li>{{/each}}";
      const result = renderTemplate(template, { items: ["A", "B", "C"] });
      expect(result).toContain("<li>A</li>");
      expect(result).toContain("<li>B</li>");
      expect(result).toContain("<li>C</li>");
    });

    it("should render object loops", () => {
      const template = "{{#each users}}<p>{{name}}</p>{{/each}}";
      const result = renderTemplate(template, {
        users: [{ name: "Alice" }, { name: "Bob" }],
      });
      expect(result).toContain("<p>Alice</p>");
      expect(result).toContain("<p>Bob</p>");
    });

    it("should use custom helpers", () => {
      const template = "{{uppercase name}}";
      const result = renderTemplate(template, { name: "john" });
      expect(result).toBe("JOHN");
    });

    it("should handle capitalize helper", () => {
      const template = "{{capitalize name}}";
      const result = renderTemplate(template, { name: "john" });
      expect(result).toBe("John");
    });

    it("should handle default helper", () => {
      const template = "Hello, {{default name 'Guest'}}!";
      expect(renderTemplate(template, { name: "John" })).toBe("Hello, John!");
      expect(renderTemplate(template, {})).toBe("Hello, Guest!");
    });
  });

  describe("extractVariables", () => {
    it("should extract simple variables", () => {
      const template = "Hello, {{name}}! Your email is {{email}}.";
      const vars = extractVariables(template);

      expect(vars).toHaveLength(2);
      expect(vars.map(v => v.name)).toContain("name");
      expect(vars.map(v => v.name)).toContain("email");
    });

    it("should extract nested variables as root object", () => {
      const template = "Hello, {{user.name}}! Your city is {{user.address.city}}.";
      const vars = extractVariables(template);

      expect(vars).toHaveLength(1);
      expect(vars[0].name).toBe("user");
      expect(vars[0].type).toBe("object");
    });

    it("should extract variables from conditionals", () => {
      const template = "{{#if showButton}}<button>Click</button>{{/if}}";
      const vars = extractVariables(template);

      expect(vars).toHaveLength(1);
      expect(vars[0].name).toBe("showButton");
      expect(vars[0].type).toBe("boolean");
    });

    it("should extract variables from loops", () => {
      const template = "{{#each items}}<li>{{this}}</li>{{/each}}";
      const vars = extractVariables(template);

      expect(vars).toHaveLength(1);
      expect(vars[0].name).toBe("items");
      expect(vars[0].type).toBe("array");
    });

    it("should not include special variables", () => {
      const template = "{{#each items}}<li>{{@index}}: {{this}}</li>{{/each}}";
      const vars = extractVariables(template);

      expect(vars).toHaveLength(1);
      expect(vars[0].name).toBe("items");
    });

    it("should deduplicate variables", () => {
      const template = "{{name}} - {{name}} - {{name}}";
      const vars = extractVariables(template);

      expect(vars).toHaveLength(1);
    });
  });

  describe("validateVariables", () => {
    it("should pass with all required variables", () => {
      const templateVars: TemplateVariable[] = [
        { name: "name", type: "string", required: true },
        { name: "email", type: "string", required: true },
      ];

      const result = validateVariables(templateVars, {
        name: "John",
        email: "john@example.com",
      });

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should fail with missing required variables", () => {
      const templateVars: TemplateVariable[] = [
        { name: "name", type: "string", required: true },
        { name: "email", type: "string", required: true },
      ];

      const result = validateVariables(templateVars, { name: "John" });

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("email");
    });

    it("should pass with default values", () => {
      const templateVars: TemplateVariable[] = [
        { name: "name", type: "string", required: true },
        { name: "greeting", type: "string", required: true, default: "Hello" },
      ];

      const result = validateVariables(templateVars, { name: "John" });

      expect(result.valid).toBe(true);
    });

    it("should detect extra variables", () => {
      const templateVars: TemplateVariable[] = [{ name: "name", type: "string", required: true }];

      const result = validateVariables(templateVars, {
        name: "John",
        extra: "value",
      });

      expect(result.extra).toContain("extra");
    });

    it("should detect type errors", () => {
      const templateVars: TemplateVariable[] = [{ name: "count", type: "number", required: true }];

      const result = validateVariables(templateVars, { count: "not a number" });

      expect(result.typeErrors).toHaveLength(1);
      expect(result.typeErrors[0].variable).toBe("count");
    });
  });

  describe("applyDefaults", () => {
    it("should apply default values", () => {
      const templateVars: TemplateVariable[] = [
        { name: "name", type: "string", required: true },
        { name: "greeting", type: "string", required: true, default: "Hello" },
      ];

      const result = applyDefaults(templateVars, { name: "John" });

      expect(result.name).toBe("John");
      expect(result.greeting).toBe("Hello");
    });

    it("should not override provided values", () => {
      const templateVars: TemplateVariable[] = [{ name: "greeting", type: "string", required: true, default: "Hello" }];

      const result = applyDefaults(templateVars, { greeting: "Hi" });

      expect(result.greeting).toBe("Hi");
    });
  });

  describe("htmlToText", () => {
    it("should convert basic HTML", () => {
      const html = "<h1>Hello</h1><p>World</p>";
      const text = htmlToText(html);

      // html-to-text uppercases headings
      expect(text.toLowerCase()).toContain("hello");
      expect(text).toContain("World");
      expect(text).not.toContain("<");
    });

    it("should preserve links", () => {
      const html = '<a href="https://example.com">Click here</a>';
      const text = htmlToText(html);

      expect(text).toContain("Click here");
    });

    it("should handle lists", () => {
      const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
      const text = htmlToText(html);

      expect(text).toContain("Item 1");
      expect(text).toContain("Item 2");
    });
  });

  describe("generateSlug", () => {
    it("should generate lowercase slug", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
    });

    it("should replace special characters", () => {
      expect(generateSlug("Hello! @World#")).toBe("hello-world");
    });

    it("should trim leading/trailing dashes", () => {
      expect(generateSlug("--Hello World--")).toBe("hello-world");
    });

    it("should handle unicode", () => {
      expect(generateSlug("Café Délice")).toBe("caf-d-lice");
    });

    it("should truncate long names", () => {
      const longName = "a".repeat(200);
      const slug = generateSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(100);
    });
  });
});
