import { describe, it, expect } from "vitest";
import { formatDate, formatCurrency, formatNumber, truncate, capitalize } from "../format";

describe("formatDate", () => {
  it("formats Date object", () => {
    const date = new Date("2026-01-28");
    expect(formatDate(date)).toBe("January 28, 2026");
  });

  it("formats date string", () => {
    expect(formatDate("2026-12-25")).toBe("December 25, 2026");
  });
});

describe("formatCurrency", () => {
  it("formats as USD by default", () => {
    expect(formatCurrency(99.99)).toBe("$99.99");
    expect(formatCurrency(1000)).toBe("$1,000.00");
  });

  it("formats other currencies", () => {
    expect(formatCurrency(100, "EUR")).toBe("€100.00");
    expect(formatCurrency(100, "GBP")).toBe("£100.00");
  });

  it("handles zero and negative", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(-50)).toBe("-$50.00");
  });
});

describe("formatNumber", () => {
  it("adds commas to large numbers", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("handles small numbers", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(0)).toBe("0");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("does not truncate short strings", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });

  it("handles exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("WORLD")).toBe("World");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });
});
