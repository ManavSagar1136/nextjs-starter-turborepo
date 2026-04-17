// ── Popup → Background ────────────────────────────────────────────────────────

export type ExtMessage =
  | { type: "OPEN_AUTH" }
  | { type: "CANCEL_AUTH" }
  | { type: "GET_SESSION" }
  | { type: "GET_WORKSPACES" }
  | { type: "CHANGE_WORKSPACE"; workspace: ExtWorkspace; user: ExtUser }
  | { type: "GET_PENDING_WORKSPACE" }
  | { type: "CLEAR_PENDING_WORKSPACE" }
  | { type: "GET_PENDING_LOGOUT" }
  | { type: "CLEAR_PENDING_LOGOUT" }
  | { type: "LOGOUT" };

// ── Background → Popup ────────────────────────────────────────────────────────

export type ExtResponse =
  | { type: "OK" }
  | { type: "ERROR"; error: string }
  | { type: "SESSION_RESULT"; data: ExtSession }
  | { type: "WORKSPACES_RESULT"; data: ExtWorkspace[] }
  | { type: "PENDING_WORKSPACE_RESULT"; workspaceId: string | null }
  | { type: "PENDING_LOGOUT_RESULT"; pending: boolean };

// ── Shared data shapes ─────────────────────────────────────────────────────────

export interface ExtSession {
  authenticated: boolean;
  user?: ExtUser;
}

export interface ExtUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  workspaceId?: string;
  workspaceName?: string;
  workspaceRole?: string;
}

export interface ExtWorkspace {
  id: string;
  name: string;
  image?: string | null;
  role: string;
}
