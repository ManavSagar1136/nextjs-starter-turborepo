/**
 * Extension background service worker (Manifest V3).
 *
 * Auth strategy — content script relay:
 *   chrome.cookies cannot read localhost cookies reliably. Instead, a content
 *   script injected into the user app page calls /api/auth/extension-token
 *   (same-origin fetch, so HttpOnly cookies are sent automatically) and relays
 *   the JWT here via chrome.runtime.sendMessage({ type: 'CMS_JWT_RECEIVED' }).
 *
 *   All subsequent API calls from the service worker attach the JWT as the
 *   x-extension-token header, which withAuth / withPermissionCheck accept.
 */

import type { ExtMessage, ExtResponse, ExtSession, ExtWorkspace } from "../types/messages";

const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3101";
const JWT_KEY = "ext_jwt";
const AUTH_TAB_KEY = "ext_auth_tab_id";
const PENDING_WORKSPACE_KEY = "ext_pending_workspace_id";
const PENDING_LOGOUT_KEY = "ext_pending_logout";

// ── Stored JWT helpers ─────────────────────────────────────────────────────────

async function getStoredJwt(): Promise<string | null> {
  const result = await chrome.storage.session.get(JWT_KEY);
  return (result[JWT_KEY] as string | undefined) ?? null;
}

async function storeJwt(token: string): Promise<void> {
  await chrome.storage.session.set({ [JWT_KEY]: token });
}

async function clearStoredJwt(): Promise<void> {
  await chrome.storage.session.remove(JWT_KEY);
}

/** Decodes the JWT payload without signature verification (expiry check only). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp as number | undefined;
  if (!exp) return false;
  return exp < Math.floor(Date.now() / 1000);
}

// ── Pending workspace helpers ──────────────────────────────────────────────────

async function setPendingWorkspace(workspaceId: string): Promise<void> {
  await chrome.storage.session.set({ [PENDING_WORKSPACE_KEY]: workspaceId });
}

async function getPendingWorkspace(): Promise<string | null> {
  const r = await chrome.storage.session.get(PENDING_WORKSPACE_KEY);
  return (r[PENDING_WORKSPACE_KEY] as string | undefined) ?? null;
}

async function clearPendingWorkspace(): Promise<void> {
  await chrome.storage.session.remove(PENDING_WORKSPACE_KEY);
}

async function setPendingLogout(): Promise<void> {
  await chrome.storage.session.set({ [PENDING_LOGOUT_KEY]: true });
}

async function getPendingLogout(): Promise<boolean> {
  const r = await chrome.storage.session.get(PENDING_LOGOUT_KEY);
  return !!r[PENDING_LOGOUT_KEY];
}

async function clearPendingLogout(): Promise<void> {
  await chrome.storage.session.remove(PENDING_LOGOUT_KEY);
}

// ── API fetch helpers ──────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getStoredJwt();
  if (!token) throw new Error("Not authenticated");

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-extension-token": token,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

// ── Auth tab management ────────────────────────────────────────────────────────

let authTabId: number | null = null;

async function getPersistedAuthTabId(): Promise<number | null> {
  const r = await chrome.storage.session.get(AUTH_TAB_KEY);
  return (r[AUTH_TAB_KEY] as number | undefined) ?? null;
}

async function setPersistedAuthTabId(id: number | null): Promise<void> {
  if (id === null) {
    await chrome.storage.session.remove(AUTH_TAB_KEY);
  } else {
    await chrome.storage.session.set({ [AUTH_TAB_KEY]: id });
  }
}

// Persistent tab listener — survives SW restarts because it's registered at
// module level. The content script will fire CMS_JWT_RECEIVED once the page
// loads, which is more reliable than reading cookies from the service worker.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const trackedId = authTabId ?? (await getPersistedAuthTabId());
  if (tabId !== trackedId) return;

  const url = new URL(tab.url);
  const apiOrigin = new URL(API_URL).origin;

  if (url.origin === apiOrigin && !url.pathname.startsWith("/login")) {
    authTabId = null;
    await setPersistedAuthTabId(null);
  }
});

// Detect when the auth tab is closed before login completes
chrome.tabs.onRemoved.addListener(async tabId => {
  const trackedId = authTabId ?? (await getPersistedAuthTabId());
  if (tabId !== trackedId) return;
  authTabId = null;
  await setPersistedAuthTabId(null);
  // Notify popup so it can reset the "waiting" state
  chrome.runtime.sendMessage({ type: "AUTH_CANCELLED" }).catch(() => {});
});

// ── Message handlers ───────────────────────────────────────────────────────────

async function handleOpenAuth(): Promise<ExtResponse> {
  const tab = await chrome.tabs.create({ url: `${API_URL}/login` });
  authTabId = tab.id ?? null;
  await setPersistedAuthTabId(authTabId);
  return { type: "OK" };
}

async function handleCancelAuth(): Promise<ExtResponse> {
  const trackedId = authTabId ?? (await getPersistedAuthTabId());
  if (trackedId) {
    chrome.tabs.remove(trackedId).catch(() => {});
  }
  authTabId = null;
  await setPersistedAuthTabId(null);
  return { type: "OK" };
}

async function handleGetSession(): Promise<ExtResponse> {
  const token = await getStoredJwt();

  if (!token) {
    return { type: "SESSION_RESULT", data: { authenticated: false } };
  }

  const payload = decodeJwtPayload(token);

  if (!payload || isTokenExpired(payload)) {
    await clearStoredJwt();
    return { type: "SESSION_RESULT", data: { authenticated: false } };
  }

  const nestedUser = payload.user as Record<string, unknown> | undefined;
  const session: ExtSession = {
    authenticated: true,
    user: {
      id: payload.userId as string | undefined,
      name: (nestedUser?.name ?? payload.name) as string | undefined,
      email: (nestedUser?.email ?? payload.email) as string | undefined,
      role: payload.role as string | undefined,
      workspaceId: payload.workspaceId as string | undefined,
      workspaceName: payload.workspaceName as string | undefined,
      workspaceRole: payload.workspaceRole as string | undefined,
    },
  };

  return { type: "SESSION_RESULT", data: session };
}

async function handleGetWorkspaces(): Promise<ExtResponse> {
  try {
    const res = await apiFetch("/api/auth/workspaces");
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      return { type: "ERROR", error: err.error ?? `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { workspaces: ExtWorkspace[] };
    return { type: "WORKSPACES_RESULT", data: data.workspaces ?? [] };
  } catch (err) {
    return { type: "ERROR", error: String(err) };
  }
}

async function handleChangeWorkspace(workspace: ExtWorkspace, user: Record<string, unknown>): Promise<ExtResponse> {
  try {
    const res = await apiFetch("/api/auth/workspace-change", {
      method: "POST",
      body: JSON.stringify({ workspace, user, role: workspace.role }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      return { type: "ERROR", error: err.error ?? `HTTP ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { token?: string };
    if (data.token) {
      await storeJwt(data.token);
    }

    // Store as pending so content scripts on future page loads can apply it
    await setPendingWorkspace(workspace.id);

    // Tell any already-open web app tabs to switch immediately
    const apiOrigin = new URL(API_URL).origin;
    const tabs = await chrome.tabs.query({ url: `${apiOrigin}/*` });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, {
            type: "EXT_SWITCH_WORKSPACE",
            workspaceId: workspace.id,
          })
          .catch(() => {});
      }
    }

    return handleGetSession();
  } catch (err) {
    return { type: "ERROR", error: String(err) };
  }
}

async function handleLogout(): Promise<ExtResponse> {
  await clearStoredJwt();
  // Flag pending so the content script applies logout on next page load
  // even if no web app tab is currently open
  await setPendingLogout();

  const apiOrigin = new URL(API_URL).origin;
  const tabs = await chrome.tabs.query({ url: `${apiOrigin}/*` });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "EXT_LOGOUT" }).catch(() => {});
    }
  }

  return { type: "OK" };
}

// ── Message router ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const msg = message as { type?: string; token?: string };

  // Content script relay — JWT received from the user app page
  if (msg.type === "CMS_JWT_RECEIVED") {
    const token = msg.token;
    if (token) {
      storeJwt(token).then(() => {
        chrome.runtime.sendMessage({ type: "AUTH_DETECTED" }).catch(() => {});
      });
    }
    sendResponse({ ok: true });
    return;
  }

  // Content script reports the web app session has gone (user logged out on web)
  if (msg.type === "CMS_SESSION_GONE") {
    clearStoredJwt().then(() => {
      chrome.runtime.sendMessage({ type: "AUTH_CANCELLED" }).catch(() => {});
    });
    sendResponse({ ok: true });
    return;
  }

  // Popup messages
  (async () => {
    const msg = message as ExtMessage;
    switch (msg.type) {
      case "OPEN_AUTH":
        return handleOpenAuth();
      case "CANCEL_AUTH":
        return handleCancelAuth();
      case "GET_SESSION":
        return handleGetSession();
      case "GET_WORKSPACES":
        return handleGetWorkspaces();
      case "CHANGE_WORKSPACE":
        return handleChangeWorkspace(msg.workspace, msg.user as unknown as Record<string, unknown>);
      case "GET_PENDING_WORKSPACE":
        return { type: "PENDING_WORKSPACE_RESULT", workspaceId: await getPendingWorkspace() } as ExtResponse;
      case "CLEAR_PENDING_WORKSPACE":
        await clearPendingWorkspace();
        return { type: "OK" } as ExtResponse;
      case "GET_PENDING_LOGOUT":
        return { type: "PENDING_LOGOUT_RESULT", pending: await getPendingLogout() } as ExtResponse;
      case "CLEAR_PENDING_LOGOUT":
        await clearPendingLogout();
        return { type: "OK" } as ExtResponse;
      case "LOGOUT":
        return handleLogout();
      default:
        return { type: "ERROR", error: "Unknown message type" } as ExtResponse;
    }
  })().then(sendResponse);

  return true;
});
