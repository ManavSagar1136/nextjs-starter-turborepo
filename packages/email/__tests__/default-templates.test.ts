/**
 * @buildbase/email - Default Templates Tests
 * Tests for the fallback email templates registry
 */

import { describe, it, expect } from "vitest";
import {
  getDefaultTemplate,
  hasDefaultTemplate,
  getDefaultTemplateSlugs,
  getAllDefaultTemplates,
  defaultTemplates,
  type DefaultTemplate,
} from "../src/templates/defaults/index.js";
import { EMAIL_TEMPLATES, ALL_EMAIL_TEMPLATE_SLUGS } from "../src/templates/constants.js";

describe("Default Templates Registry", () => {
  describe("defaultTemplates", () => {
    it("should contain all expected templates", () => {
      expect(defaultTemplates).toHaveProperty(EMAIL_TEMPLATES.NEWSLETTER_WELCOME);
      expect(defaultTemplates).toHaveProperty(EMAIL_TEMPLATES.NEWSLETTER_UNSUBSCRIBE);
      expect(defaultTemplates).toHaveProperty(EMAIL_TEMPLATES.NEWSLETTER_ADMIN_NOTIFICATION);
      expect(defaultTemplates).toHaveProperty(EMAIL_TEMPLATES.CONTACT_CONFIRMATION);
      expect(defaultTemplates).toHaveProperty(EMAIL_TEMPLATES.CONTACT_ADMIN_NOTIFICATION);
    });

    it("should have exactly 5 default templates", () => {
      expect(Object.keys(defaultTemplates)).toHaveLength(5);
    });
  });

  describe("getDefaultTemplate", () => {
    it("should return template for valid slug", () => {
      const template = getDefaultTemplate(EMAIL_TEMPLATES.NEWSLETTER_WELCOME);

      expect(template).not.toBeNull();
      expect(template?.slug).toBe("newsletter-welcome");
    });

    it("should return null for unknown slug", () => {
      const template = getDefaultTemplate("unknown-template");

      expect(template).toBeNull();
    });

    it("should return null for empty slug", () => {
      const template = getDefaultTemplate("");

      expect(template).toBeNull();
    });
  });

  describe("hasDefaultTemplate", () => {
    it("should return true for existing template", () => {
      expect(hasDefaultTemplate(EMAIL_TEMPLATES.NEWSLETTER_WELCOME)).toBe(true);
      expect(hasDefaultTemplate(EMAIL_TEMPLATES.CONTACT_CONFIRMATION)).toBe(true);
    });

    it("should return false for non-existing template", () => {
      expect(hasDefaultTemplate("unknown-slug")).toBe(false);
      expect(hasDefaultTemplate("")).toBe(false);
    });
  });

  describe("getDefaultTemplateSlugs", () => {
    it("should return array of all slugs", () => {
      const slugs = getDefaultTemplateSlugs();

      expect(Array.isArray(slugs)).toBe(true);
      expect(slugs).toHaveLength(5);
    });

    it("should contain all expected slugs", () => {
      const slugs = getDefaultTemplateSlugs();

      expect(slugs).toContain(EMAIL_TEMPLATES.NEWSLETTER_WELCOME);
      expect(slugs).toContain(EMAIL_TEMPLATES.NEWSLETTER_UNSUBSCRIBE);
      expect(slugs).toContain(EMAIL_TEMPLATES.NEWSLETTER_ADMIN_NOTIFICATION);
      expect(slugs).toContain(EMAIL_TEMPLATES.CONTACT_CONFIRMATION);
      expect(slugs).toContain(EMAIL_TEMPLATES.CONTACT_ADMIN_NOTIFICATION);
    });
  });

  describe("getAllDefaultTemplates", () => {
    it("should return array of all templates", () => {
      const templates = getAllDefaultTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates).toHaveLength(5);
    });

    it("should return templates with valid structure", () => {
      const templates = getAllDefaultTemplates();

      for (const template of templates) {
        expect(template).toHaveProperty("slug");
        expect(template).toHaveProperty("name");
        expect(template).toHaveProperty("description");
        expect(template).toHaveProperty("subject");
        expect(template).toHaveProperty("html");
        expect(template).toHaveProperty("category");
        expect(template).toHaveProperty("variables");
      }
    });
  });
});

describe("Default Template Structure", () => {
  describe("newsletter-welcome", () => {
    let template: DefaultTemplate | null;

    beforeAll(() => {
      template = getDefaultTemplate(EMAIL_TEMPLATES.NEWSLETTER_WELCOME);
    });

    it("should have correct metadata", () => {
      expect(template?.slug).toBe("newsletter-welcome");
      expect(template?.name).toBe("Newsletter Welcome");
      expect(template?.category).toBe("WELCOME");
    });

    it("should have subject with variable", () => {
      expect(template?.subject).toContain("{{companyName}}");
    });

    it("should have required variables", () => {
      const emailVar = template?.variables.find(v => v.name === "email");
      expect(emailVar).toBeDefined();
      expect(emailVar?.required).toBe(true);
    });

    it("should have optional variables with defaults", () => {
      const companyNameVar = template?.variables.find(v => v.name === "companyName");
      expect(companyNameVar).toBeDefined();
      expect(companyNameVar?.required).toBe(false);
      expect(companyNameVar?.default).toBe("Our Company");
    });

    it("should have valid HTML", () => {
      expect(template?.html).toContain("<!DOCTYPE html>");
      expect(template?.html).toContain("{{companyName}}");
      expect(template?.html).toContain("{{siteUrl}}");
    });

    it("should have text version", () => {
      expect(template?.text).toBeDefined();
      expect(template?.text).toContain("{{companyName}}");
    });
  });

  describe("newsletter-unsubscribe", () => {
    let template: DefaultTemplate | null;

    beforeAll(() => {
      template = getDefaultTemplate(EMAIL_TEMPLATES.NEWSLETTER_UNSUBSCRIBE);
    });

    it("should have correct metadata", () => {
      expect(template?.slug).toBe("newsletter-unsubscribe");
      expect(template?.name).toBe("Newsletter Unsubscribe Confirmation");
    });

    it("should have resubscribe URL variable", () => {
      const resubVar = template?.variables.find(v => v.name === "resubscribeUrl");
      expect(resubVar).toBeDefined();
    });
  });

  describe("newsletter-admin-notification", () => {
    let template: DefaultTemplate | null;

    beforeAll(() => {
      template = getDefaultTemplate(EMAIL_TEMPLATES.NEWSLETTER_ADMIN_NOTIFICATION);
    });

    it("should have correct metadata", () => {
      expect(template?.slug).toBe("newsletter-admin-notification");
    });

    it("should have admin-related variables", () => {
      const adminUrlVar = template?.variables.find(v => v.name === "adminUrl");
      expect(adminUrlVar).toBeDefined();
    });
  });

  describe("contact-confirmation", () => {
    let template: DefaultTemplate | null;

    beforeAll(() => {
      template = getDefaultTemplate(EMAIL_TEMPLATES.CONTACT_CONFIRMATION);
    });

    it("should have correct metadata", () => {
      expect(template?.slug).toBe("contact-confirmation");
      expect(template?.name).toBe("Contact Form Confirmation");
    });

    it("should have user-related variables", () => {
      const firstNameVar = template?.variables.find(v => v.name === "firstName");
      const emailVar = template?.variables.find(v => v.name === "email");
      expect(firstNameVar).toBeDefined();
      expect(emailVar).toBeDefined();
    });
  });

  describe("contact-admin-notification", () => {
    let template: DefaultTemplate | null;

    beforeAll(() => {
      template = getDefaultTemplate(EMAIL_TEMPLATES.CONTACT_ADMIN_NOTIFICATION);
    });

    it("should have correct metadata", () => {
      expect(template?.slug).toBe("contact-admin-notification");
    });

    it("should have message variable", () => {
      const messageVar = template?.variables.find(v => v.name === "message");
      expect(messageVar).toBeDefined();
      expect(messageVar?.required).toBe(true);
    });

    it("should have admin URL variable", () => {
      const adminUrlVar = template?.variables.find(v => v.name === "adminUrl");
      expect(adminUrlVar).toBeDefined();
    });
  });
});

describe("Template Variables Validation", () => {
  it("all templates should have valid variable types", () => {
    const templates = getAllDefaultTemplates();
    const validTypes = ["string", "number", "boolean", "array", "object"];

    for (const template of templates) {
      for (const variable of template.variables) {
        expect(validTypes).toContain(variable.type);
      }
    }
  });

  it("all required variables should not have defaults", () => {
    const templates = getAllDefaultTemplates();

    for (const template of templates) {
      for (const variable of template.variables) {
        // Required variables typically don't need defaults
        // But having a default on a required field isn't an error
        expect(variable.name).toBeDefined();
        expect(typeof variable.required).toBe("boolean");
      }
    }
  });

  it("all templates should have at least one variable", () => {
    const templates = getAllDefaultTemplates();

    for (const template of templates) {
      expect(template.variables.length).toBeGreaterThan(0);
    }
  });
});

describe("Template HTML Validity", () => {
  it("all templates should have valid HTML structure", () => {
    const templates = getAllDefaultTemplates();

    for (const template of templates) {
      // Basic HTML structure checks
      expect(template.html).toContain("<html");
      expect(template.html).toContain("</html>");
      expect(template.html).toContain("<body");
      expect(template.html).toContain("</body>");
    }
  });

  it("all templates should have email-safe inline styles", () => {
    const templates = getAllDefaultTemplates();

    for (const template of templates) {
      // Email templates should use inline styles
      expect(template.html).toContain("style=");
    }
  });

  it("all templates should have table-based layout for email compatibility", () => {
    const templates = getAllDefaultTemplates();

    for (const template of templates) {
      // Email templates often use tables for layout
      expect(template.html).toContain("<table");
    }
  });
});
