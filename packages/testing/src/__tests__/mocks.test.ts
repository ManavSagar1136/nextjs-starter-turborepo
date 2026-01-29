/**
 * Mock Tests
 *
 * Verify that mock utilities work correctly
 */

import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock, createPrismaMock, setupPrismaMock } from "../mocks/prisma.mock";
import {
  mockRouter,
  mockSearchParams,
  mockHeaders,
  mockCookies,
  mockRedirect,
  mockNotFound,
  resetNextMocks,
  setMockSearchParams,
  setMockPathname,
  getMockPathname,
  setMockHeaders,
  setMockCookies,
} from "../mocks/next.mock";

describe("Prisma Mock", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  describe("prismaMock", () => {
    it("provides a deep mock of PrismaClient", () => {
      expect(prismaMock).toBeDefined();
      expect(prismaMock.user).toBeDefined();
      expect(prismaMock.workspace).toBeDefined();
    });

    it("allows mocking method return values", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await prismaMock.user.findUnique({ where: { id: "1" } });

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("tracks method calls", async () => {
      await prismaMock.user.create({ data: { email: "new@example.com" } });

      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { email: "new@example.com" },
      });
    });
  });

  describe("resetPrismaMock", () => {
    it("clears all mock implementations", async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      await prismaMock.user.findMany();

      expect(prismaMock.user.findMany).toHaveBeenCalled();

      resetPrismaMock();

      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe("createPrismaMock", () => {
    it("creates a new independent mock instance", () => {
      const mock1 = createPrismaMock();
      const mock2 = createPrismaMock();

      expect(mock1).not.toBe(mock2);
    });
  });

  describe("setupPrismaMock", () => {
    it("returns a mock with reset function", () => {
      const { prisma, reset } = setupPrismaMock();

      prisma.user.findFirst.mockResolvedValue({ id: "1" });
      expect(prisma.user.findFirst).toBeDefined();

      reset();
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });
  });
});

describe("Next.js Mocks", () => {
  beforeEach(() => {
    resetNextMocks();
  });

  describe("mockRouter", () => {
    it("provides router methods", () => {
      expect(mockRouter.push).toBeDefined();
      expect(mockRouter.replace).toBeDefined();
      expect(mockRouter.back).toBeDefined();
      expect(mockRouter.forward).toBeDefined();
      expect(mockRouter.refresh).toBeDefined();
      expect(mockRouter.prefetch).toBeDefined();
    });

    it("tracks router method calls", () => {
      mockRouter.push("/dashboard");

      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("mockSearchParams", () => {
    it("works like URLSearchParams", () => {
      setMockSearchParams({ page: "1", sort: "name" });

      expect(mockSearchParams.get("page")).toBe("1");
      expect(mockSearchParams.get("sort")).toBe("name");
    });

    it("clears previous params on setMockSearchParams", () => {
      setMockSearchParams({ old: "value" });
      setMockSearchParams({ new: "value" });

      expect(mockSearchParams.get("old")).toBeNull();
      expect(mockSearchParams.get("new")).toBe("value");
    });
  });

  describe("mockPathname", () => {
    it("returns current pathname", () => {
      expect(getMockPathname()).toBe("/");

      setMockPathname("/dashboard");
      expect(getMockPathname()).toBe("/dashboard");
    });
  });

  describe("mockHeaders", () => {
    it("allows setting and getting headers", () => {
      setMockHeaders({ "Content-Type": "application/json" });

      expect(mockHeaders.get("Content-Type")).toBe("application/json");
      expect(mockHeaders.has("Content-Type")).toBe(true);
    });
  });

  describe("mockCookies", () => {
    it("allows setting and getting cookies", () => {
      setMockCookies({ session: "abc123" });

      expect(mockCookies.get("session")).toEqual({
        name: "session",
        value: "abc123",
      });
    });
  });

  describe("mockRedirect", () => {
    it("throws NEXT_REDIRECT error", () => {
      expect(() => mockRedirect("/login")).toThrow("NEXT_REDIRECT:/login");
    });
  });

  describe("mockNotFound", () => {
    it("throws NEXT_NOT_FOUND error", () => {
      expect(() => mockNotFound()).toThrow("NEXT_NOT_FOUND");
    });
  });

  describe("resetNextMocks", () => {
    it("resets all mocks to initial state", () => {
      mockRouter.push("/test");
      setMockSearchParams({ foo: "bar" });
      setMockPathname("/test");

      resetNextMocks();

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockSearchParams.get("foo")).toBeNull();
      expect(getMockPathname()).toBe("/");
    });
  });
});
