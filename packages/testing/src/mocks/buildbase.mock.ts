/**
 * Buildbase SDK Mock
 *
 * Provides mock for Buildbase SDK auth, workspace, and billing operations.
 *
 * @example
 * ```ts
 * import {
 *   buildbaseMock,
 *   mockBuildbaseUser,
 *   mockBuildbaseWorkspace,
 *   resetBuildbaseMock,
 * } from '@buildbase/testing/mocks/buildbase';
 *
 * vi.mock('@buildbase/sdk', () => ({
 *   default: buildbaseMock,
 *   useBuildbase: () => buildbaseMock,
 * }));
 *
 * describe('Auth flow', () => {
 *   beforeEach(() => {
 *     resetBuildbaseMock();
 *   });
 *
 *   it('gets current session', async () => {
 *     const session = await buildbaseMock.auth.getSession();
 *     expect(session.user).toEqual(mockBuildbaseUser);
 *   });
 * });
 * ```
 */

import { vi } from "vitest";

// ============================================================================
// Mock User
// ============================================================================

export interface BuildbaseUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Default mock Buildbase user
 */
export const mockBuildbaseUser: BuildbaseUser = {
  id: "user_mock123456",
  email: "test@example.com",
  name: "Test User",
  image: "https://example.com/avatar.png",
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Create a custom mock user
 */
export function createMockBuildbaseUser(overrides: Partial<BuildbaseUser> = {}): BuildbaseUser {
  return {
    ...mockBuildbaseUser,
    id: `user_${Math.random().toString(36).slice(2, 12)}`,
    ...overrides,
  };
}

// ============================================================================
// Mock Workspace
// ============================================================================

export interface BuildbaseWorkspace {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Default mock Buildbase workspace
 */
export const mockBuildbaseWorkspace: BuildbaseWorkspace = {
  id: "ws_mock123456",
  name: "Test Workspace",
  slug: "test-workspace",
  image: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Create a custom mock workspace
 */
export function createMockBuildbaseWorkspace(overrides: Partial<BuildbaseWorkspace> = {}): BuildbaseWorkspace {
  return {
    ...mockBuildbaseWorkspace,
    id: `ws_${Math.random().toString(36).slice(2, 12)}`,
    ...overrides,
  };
}

// ============================================================================
// Mock Session
// ============================================================================

export interface BuildbaseSession {
  user: BuildbaseUser;
  accessToken: string;
  expiresAt: string;
}

/**
 * Default mock session
 */
export const mockBuildbaseSession: BuildbaseSession = {
  user: mockBuildbaseUser,
  accessToken: "mock_access_token_123",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

// ============================================================================
// Mock Subscription
// ============================================================================

export interface BuildbaseSubscription {
  id: string;
  status: "active" | "trialing" | "canceled" | "past_due";
  plan: {
    id: string;
    name: string;
    price: number;
    interval: "month" | "year";
  };
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

/**
 * Default mock subscription
 */
export const mockBuildbaseSubscription: BuildbaseSubscription = {
  id: "sub_mock123456",
  status: "active",
  plan: {
    id: "plan_pro",
    name: "Pro",
    price: 29,
    interval: "month",
  },
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
};

// ============================================================================
// Buildbase SDK Mock
// ============================================================================

/**
 * Mock Buildbase SDK
 * Provides mocked implementations of all SDK methods
 */
export const buildbaseMock = {
  // ============== Auth ==============
  auth: {
    /**
     * Get current session
     */
    getSession: vi.fn().mockResolvedValue(mockBuildbaseSession),

    /**
     * Sign in user
     */
    signIn: vi.fn().mockResolvedValue({ success: true }),

    /**
     * Sign out user
     */
    signOut: vi.fn().mockResolvedValue({ success: true }),

    /**
     * Verify auth code
     */
    verifyCode: vi.fn().mockResolvedValue({
      success: true,
      session: mockBuildbaseSession,
    }),

    /**
     * Request password reset
     */
    requestPasswordReset: vi.fn().mockResolvedValue({ success: true }),

    /**
     * Reset password
     */
    resetPassword: vi.fn().mockResolvedValue({ success: true }),
  },

  // ============== Workspace ==============
  workspace: {
    /**
     * Get current workspace
     */
    getCurrent: vi.fn().mockResolvedValue(mockBuildbaseWorkspace),

    /**
     * List user's workspaces
     */
    list: vi.fn().mockResolvedValue([mockBuildbaseWorkspace]),

    /**
     * Switch to another workspace
     */
    switch: vi.fn().mockResolvedValue({ success: true }),

    /**
     * Create a new workspace
     */
    create: vi.fn().mockResolvedValue(mockBuildbaseWorkspace),

    /**
     * Update workspace
     */
    update: vi.fn().mockResolvedValue(mockBuildbaseWorkspace),

    /**
     * Delete workspace
     */
    delete: vi.fn().mockResolvedValue({ success: true }),

    /**
     * Get workspace members
     */
    getMembers: vi.fn().mockResolvedValue([{ userId: mockBuildbaseUser.id, role: "admin", user: mockBuildbaseUser }]),

    /**
     * Invite member to workspace
     */
    inviteMember: vi.fn().mockResolvedValue({ success: true }),

    /**
     * Remove member from workspace
     */
    removeMember: vi.fn().mockResolvedValue({ success: true }),
  },

  // ============== Billing ==============
  billing: {
    /**
     * Get current subscription
     */
    getSubscription: vi.fn().mockResolvedValue(mockBuildbaseSubscription),

    /**
     * Create checkout session
     */
    createCheckout: vi.fn().mockResolvedValue({
      url: "https://checkout.stripe.com/mock",
    }),

    /**
     * Create customer portal session
     */
    createPortalSession: vi.fn().mockResolvedValue({
      url: "https://billing.stripe.com/mock",
    }),

    /**
     * Get available plans
     */
    getPlans: vi.fn().mockResolvedValue([
      { id: "plan_free", name: "Free", price: 0, interval: "month" },
      { id: "plan_pro", name: "Pro", price: 29, interval: "month" },
      { id: "plan_enterprise", name: "Enterprise", price: 99, interval: "month" },
    ]),

    /**
     * Cancel subscription
     */
    cancelSubscription: vi.fn().mockResolvedValue({ success: true }),
  },
};

// ============================================================================
// Reset Function
// ============================================================================

/**
 * Reset all Buildbase mock functions
 * Call in beforeEach for test isolation
 */
export function resetBuildbaseMock(): void {
  // Reset auth mocks
  buildbaseMock.auth.getSession.mockClear().mockResolvedValue(mockBuildbaseSession);
  buildbaseMock.auth.signIn.mockClear().mockResolvedValue({ success: true });
  buildbaseMock.auth.signOut.mockClear().mockResolvedValue({ success: true });
  buildbaseMock.auth.verifyCode.mockClear().mockResolvedValue({
    success: true,
    session: mockBuildbaseSession,
  });
  buildbaseMock.auth.requestPasswordReset.mockClear().mockResolvedValue({ success: true });
  buildbaseMock.auth.resetPassword.mockClear().mockResolvedValue({ success: true });

  // Reset workspace mocks
  buildbaseMock.workspace.getCurrent.mockClear().mockResolvedValue(mockBuildbaseWorkspace);
  buildbaseMock.workspace.list.mockClear().mockResolvedValue([mockBuildbaseWorkspace]);
  buildbaseMock.workspace.switch.mockClear().mockResolvedValue({ success: true });
  buildbaseMock.workspace.create.mockClear().mockResolvedValue(mockBuildbaseWorkspace);
  buildbaseMock.workspace.update.mockClear().mockResolvedValue(mockBuildbaseWorkspace);
  buildbaseMock.workspace.delete.mockClear().mockResolvedValue({ success: true });
  buildbaseMock.workspace.getMembers
    .mockClear()
    .mockResolvedValue([{ userId: mockBuildbaseUser.id, role: "admin", user: mockBuildbaseUser }]);
  buildbaseMock.workspace.inviteMember.mockClear().mockResolvedValue({ success: true });
  buildbaseMock.workspace.removeMember.mockClear().mockResolvedValue({ success: true });

  // Reset billing mocks
  buildbaseMock.billing.getSubscription.mockClear().mockResolvedValue(mockBuildbaseSubscription);
  buildbaseMock.billing.createCheckout.mockClear().mockResolvedValue({
    url: "https://checkout.stripe.com/mock",
  });
  buildbaseMock.billing.createPortalSession.mockClear().mockResolvedValue({
    url: "https://billing.stripe.com/mock",
  });
  buildbaseMock.billing.getPlans.mockClear().mockResolvedValue([
    { id: "plan_free", name: "Free", price: 0, interval: "month" },
    { id: "plan_pro", name: "Pro", price: 29, interval: "month" },
    { id: "plan_enterprise", name: "Enterprise", price: 99, interval: "month" },
  ]);
  buildbaseMock.billing.cancelSubscription.mockClear().mockResolvedValue({ success: true });
}

// Default export
export default buildbaseMock;
