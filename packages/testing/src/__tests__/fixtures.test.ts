/**
 * Fixture Tests
 *
 * Verify that fixture factories work correctly
 */

import { describe, it, expect } from "vitest";
import {
  createUserFixture,
  createAdminFixture,
  createUsersFixture,
  createUserWithWorkspaceFixture,
  createWorkspaceFixture,
  createInactiveWorkspaceFixture,
  createWorkspacesFixture,
  createWorkspaceWithSlugFixture,
} from "../fixtures";

describe("User Fixtures", () => {
  describe("createUserFixture", () => {
    it("creates a user with all required fields", () => {
      const user = createUserFixture();

      expect(user.id).toBeDefined();
      expect(user.sdkUserId).toMatch(/^sdk_/);
      expect(user.email).toContain("@");
      expect(user.name).toBeDefined();
      expect(user.role).toBe("user");
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("creates unique users on each call", () => {
      const user1 = createUserFixture();
      const user2 = createUserFixture();

      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).not.toBe(user2.email);
    });

    it("accepts partial overrides", () => {
      const customEmail = "custom@example.com";
      const user = createUserFixture({ email: customEmail });

      expect(user.email).toBe(customEmail);
      expect(user.name).toBeDefined(); // Other fields still generated
    });
  });

  describe("createAdminFixture", () => {
    it("creates a user with admin role", () => {
      const admin = createAdminFixture();

      expect(admin.role).toBe("admin");
    });

    it("accepts additional overrides", () => {
      const admin = createAdminFixture({ email: "admin@example.com" });

      expect(admin.role).toBe("admin");
      expect(admin.email).toBe("admin@example.com");
    });
  });

  describe("createUsersFixture", () => {
    it("creates the specified number of users", () => {
      const users = createUsersFixture(5);

      expect(users).toHaveLength(5);
      users.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.email).toContain("@");
      });
    });

    it("applies overrides to all users", () => {
      const users = createUsersFixture(3, { role: "editor" });

      users.forEach(user => {
        expect(user.role).toBe("editor");
      });
    });
  });

  describe("createUserWithWorkspaceFixture", () => {
    it("creates a user with workspace assignment", () => {
      const workspaceId = "ws_123";
      const user = createUserWithWorkspaceFixture(workspaceId);

      expect(user.currentWorkspaceId).toBe(workspaceId);
    });
  });
});

describe("Workspace Fixtures", () => {
  describe("createWorkspaceFixture", () => {
    it("creates a workspace with all required fields", () => {
      const workspace = createWorkspaceFixture();

      expect(workspace.id).toBeDefined();
      expect(workspace.sdkWorkspaceId).toMatch(/^ws_/);
      expect(workspace.name).toBeDefined();
      expect(workspace.slug).toBeDefined();
      expect(workspace.isActive).toBe(true);
      expect(workspace.createdAt).toBeInstanceOf(Date);
      expect(workspace.updatedAt).toBeInstanceOf(Date);
    });

    it("generates slug from name", () => {
      const workspace = createWorkspaceFixture({ name: "My Test Workspace" });

      expect(workspace.slug).toBe("my-test-workspace");
    });

    it("creates unique workspaces on each call", () => {
      const ws1 = createWorkspaceFixture();
      const ws2 = createWorkspaceFixture();

      expect(ws1.id).not.toBe(ws2.id);
    });
  });

  describe("createInactiveWorkspaceFixture", () => {
    it("creates an inactive workspace", () => {
      const workspace = createInactiveWorkspaceFixture();

      expect(workspace.isActive).toBe(false);
    });
  });

  describe("createWorkspacesFixture", () => {
    it("creates the specified number of workspaces", () => {
      const workspaces = createWorkspacesFixture(3);

      expect(workspaces).toHaveLength(3);
      workspaces.forEach(ws => {
        expect(ws.id).toBeDefined();
        expect(ws.isActive).toBe(true);
      });
    });
  });

  describe("createWorkspaceWithSlugFixture", () => {
    it("creates a workspace with specific slug", () => {
      const workspace = createWorkspaceWithSlugFixture("custom-slug");

      expect(workspace.slug).toBe("custom-slug");
    });
  });
});
