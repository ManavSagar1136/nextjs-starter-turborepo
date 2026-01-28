import { describe, it, expect } from "vitest";
import { isValidEmail, isValidUrl, isNotEmpty, isValidPhone } from "../validation";

describe("isValidEmail", () => {
  it("returns true for valid emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@example.org")).toBe(true);
  });

  it("returns false for invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("returns true for valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("https://sub.domain.com/path?query=1")).toBe(true);
  });

  it("returns false for invalid URLs", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false); // Missing protocol
  });
});

describe("isNotEmpty", () => {
  it("returns true for non-empty strings", () => {
    expect(isNotEmpty("hello")).toBe(true);
    expect(isNotEmpty("  text  ")).toBe(true);
    expect(isNotEmpty("0")).toBe(true);
  });

  it("returns false for empty/null/undefined", () => {
    expect(isNotEmpty("")).toBe(false);
    expect(isNotEmpty("   ")).toBe(false);
    expect(isNotEmpty(null)).toBe(false);
    expect(isNotEmpty(undefined)).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("returns true for valid phone numbers", () => {
    expect(isValidPhone("+1 234 567 8900")).toBe(true);
    expect(isValidPhone("(123) 456-7890")).toBe(true);
    expect(isValidPhone("1234567890")).toBe(true);
  });

  it("returns false for invalid phone numbers", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("123")).toBe(false); // Too short
    expect(isValidPhone("abc-def-ghij")).toBe(false);
  });
});
