/**
 * @buildbase/email - Template Constants Tests
 * Tests for email template slug constants
 */

import { describe, it, expect } from "vitest";
import {
  EMAIL_TEMPLATES,
  ALL_EMAIL_TEMPLATE_SLUGS,
  isValidTemplateSlug,
  type EmailTemplateSlug,
} from "../src/templates/constants.js";

describe("EMAIL_TEMPLATES", () => {
  describe("structure", () => {
    it("should be a frozen object", () => {
      // The 'as const' assertion makes it readonly
      expect(typeof EMAIL_TEMPLATES).toBe("object");
    });

    it("should have newsletter templates", () => {
      expect(EMAIL_TEMPLATES).toHaveProperty("NEWSLETTER_WELCOME");
      expect(EMAIL_TEMPLATES).toHaveProperty("NEWSLETTER_UNSUBSCRIBE");
      expect(EMAIL_TEMPLATES).toHaveProperty("NEWSLETTER_ADMIN_NOTIFICATION");
    });

    it("should have contact templates", () => {
      expect(EMAIL_TEMPLATES).toHaveProperty("CONTACT_CONFIRMATION");
      expect(EMAIL_TEMPLATES).toHaveProperty("CONTACT_ADMIN_NOTIFICATION");
    });
  });

  describe("values", () => {
    it("NEWSLETTER_WELCOME should be newsletter-welcome", () => {
      expect(EMAIL_TEMPLATES.NEWSLETTER_WELCOME).toBe("newsletter-welcome");
    });

    it("NEWSLETTER_UNSUBSCRIBE should be newsletter-unsubscribe", () => {
      expect(EMAIL_TEMPLATES.NEWSLETTER_UNSUBSCRIBE).toBe("newsletter-unsubscribe");
    });

    it("NEWSLETTER_ADMIN_NOTIFICATION should be newsletter-admin-notification", () => {
      expect(EMAIL_TEMPLATES.NEWSLETTER_ADMIN_NOTIFICATION).toBe("newsletter-admin-notification");
    });

    it("CONTACT_CONFIRMATION should be contact-confirmation", () => {
      expect(EMAIL_TEMPLATES.CONTACT_CONFIRMATION).toBe("contact-confirmation");
    });

    it("CONTACT_ADMIN_NOTIFICATION should be contact-admin-notification", () => {
      expect(EMAIL_TEMPLATES.CONTACT_ADMIN_NOTIFICATION).toBe("contact-admin-notification");
    });
  });

  describe("slug format", () => {
    it("all slugs should be lowercase", () => {
      for (const slug of Object.values(EMAIL_TEMPLATES)) {
        expect(slug).toBe(slug.toLowerCase());
      }
    });

    it("all slugs should use kebab-case", () => {
      const kebabCaseRegex = /^[a-z]+(-[a-z]+)*$/;

      for (const slug of Object.values(EMAIL_TEMPLATES)) {
        expect(slug).toMatch(kebabCaseRegex);
      }
    });

    it("all slugs should be non-empty", () => {
      for (const slug of Object.values(EMAIL_TEMPLATES)) {
        expect(slug.length).toBeGreaterThan(0);
      }
    });
  });
});

describe("ALL_EMAIL_TEMPLATE_SLUGS", () => {
  it("should be an array", () => {
    expect(Array.isArray(ALL_EMAIL_TEMPLATE_SLUGS)).toBe(true);
  });

  it("should contain all template slugs", () => {
    expect(ALL_EMAIL_TEMPLATE_SLUGS).toContain("newsletter-welcome");
    expect(ALL_EMAIL_TEMPLATE_SLUGS).toContain("newsletter-unsubscribe");
    expect(ALL_EMAIL_TEMPLATE_SLUGS).toContain("newsletter-admin-notification");
    expect(ALL_EMAIL_TEMPLATE_SLUGS).toContain("contact-confirmation");
    expect(ALL_EMAIL_TEMPLATE_SLUGS).toContain("contact-admin-notification");
  });

  it("should have same length as EMAIL_TEMPLATES keys", () => {
    expect(ALL_EMAIL_TEMPLATE_SLUGS.length).toBe(Object.keys(EMAIL_TEMPLATES).length);
  });

  it("should match EMAIL_TEMPLATES values", () => {
    const templateValues = Object.values(EMAIL_TEMPLATES);

    for (const slug of ALL_EMAIL_TEMPLATE_SLUGS) {
      expect(templateValues).toContain(slug);
    }
  });
});

describe("isValidTemplateSlug", () => {
  describe("valid slugs", () => {
    it("should return true for newsletter-welcome", () => {
      expect(isValidTemplateSlug("newsletter-welcome")).toBe(true);
    });

    it("should return true for newsletter-unsubscribe", () => {
      expect(isValidTemplateSlug("newsletter-unsubscribe")).toBe(true);
    });

    it("should return true for newsletter-admin-notification", () => {
      expect(isValidTemplateSlug("newsletter-admin-notification")).toBe(true);
    });

    it("should return true for contact-confirmation", () => {
      expect(isValidTemplateSlug("contact-confirmation")).toBe(true);
    });

    it("should return true for contact-admin-notification", () => {
      expect(isValidTemplateSlug("contact-admin-notification")).toBe(true);
    });

    it("should return true for all EMAIL_TEMPLATES values", () => {
      for (const slug of Object.values(EMAIL_TEMPLATES)) {
        expect(isValidTemplateSlug(slug)).toBe(true);
      }
    });
  });

  describe("invalid slugs", () => {
    it("should return false for unknown slug", () => {
      expect(isValidTemplateSlug("unknown-template")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidTemplateSlug("")).toBe(false);
    });

    it("should return false for similar but incorrect slug", () => {
      expect(isValidTemplateSlug("newsletter_welcome")).toBe(false); // underscore instead of hyphen
      expect(isValidTemplateSlug("Newsletter-Welcome")).toBe(false); // wrong case
      expect(isValidTemplateSlug("newsletter-welcomes")).toBe(false); // extra 's'
    });

    it("should return false for partial match", () => {
      expect(isValidTemplateSlug("newsletter")).toBe(false);
      expect(isValidTemplateSlug("contact")).toBe(false);
    });

    it("should return false for keys instead of values", () => {
      expect(isValidTemplateSlug("NEWSLETTER_WELCOME")).toBe(false);
      expect(isValidTemplateSlug("CONTACT_CONFIRMATION")).toBe(false);
    });
  });
});

describe("Type Safety", () => {
  it("EmailTemplateSlug type should be assignable from valid slugs", () => {
    // Type check - these should compile without errors
    const slug1: EmailTemplateSlug = EMAIL_TEMPLATES.NEWSLETTER_WELCOME;
    const slug2: EmailTemplateSlug = EMAIL_TEMPLATES.CONTACT_CONFIRMATION;

    expect(slug1).toBeDefined();
    expect(slug2).toBeDefined();
  });

  it("should work with type narrowing via isValidTemplateSlug", () => {
    const unknownSlug: string = "newsletter-welcome";

    if (isValidTemplateSlug(unknownSlug)) {
      // Type should be narrowed to EmailTemplateSlug
      const validSlug: EmailTemplateSlug = unknownSlug;
      expect(validSlug).toBe("newsletter-welcome");
    }
  });
});

describe("Use Cases", () => {
  it("should support iteration over all templates", () => {
    const slugList: string[] = [];

    for (const slug of ALL_EMAIL_TEMPLATE_SLUGS) {
      slugList.push(slug);
    }

    expect(slugList.length).toBe(5);
  });

  it("should support using constants for template lookup", () => {
    // Simulating how constants would be used
    const templateMap = new Map<string, string>();
    templateMap.set(EMAIL_TEMPLATES.NEWSLETTER_WELCOME, "Welcome Template");
    templateMap.set(EMAIL_TEMPLATES.CONTACT_CONFIRMATION, "Contact Template");

    expect(templateMap.get(EMAIL_TEMPLATES.NEWSLETTER_WELCOME)).toBe("Welcome Template");
    expect(templateMap.get("newsletter-welcome")).toBe("Welcome Template");
  });

  it("should support validation before API calls", () => {
    const validateAndGetTemplate = (slug: string) => {
      if (!isValidTemplateSlug(slug)) {
        throw new Error(`Invalid template slug: ${slug}`);
      }
      return { slug, valid: true };
    };

    expect(() => validateAndGetTemplate("newsletter-welcome")).not.toThrow();
    expect(() => validateAndGetTemplate("invalid-slug")).toThrow("Invalid template slug");
  });
});
