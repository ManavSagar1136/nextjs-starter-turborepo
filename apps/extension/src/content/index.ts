/**
 * Content script — injected into every page on the user app domain.
 *
 * Runs inside the page's security context so fetch() is a same-origin
 * request and the browser automatically includes HttpOnly cookies.
 *
 * On each page load:
 *   1. Fetches /api/auth/extension-token and relays JWT to the background.
 *      If the endpoint returns unauthenticated, notifies background so the
 *      extension can auto-detect web app logouts.
 *   2. Checks for a pending workspace switch stored by the background after
 *      the extension's workspace switcher was used with no tab open.
 *
 * Message listeners:
 *   EXT_SWITCH_WORKSPACE — updates saas-workspace-current and reloads so
 *     the Buildbase SDK re-initialises with the new workspace.
 *   EXT_LOGOUT — calls /api/auth/logout (same-origin) then redirects to /login.
 */

async function sendTokenToBackground(): Promise<void> {
  try {
    const res = await fetch("/api/auth/extension-token", {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      // Web app session gone — tell background to clear extension session too
      chrome.runtime.sendMessage({ type: "CMS_SESSION_GONE" });
      return;
    }

    const data = (await res.json()) as { authenticated: boolean; token?: string };

    if (data.authenticated && data.token) {
      chrome.runtime.sendMessage({ type: "CMS_JWT_RECEIVED", token: data.token });
    } else {
      chrome.runtime.sendMessage({ type: "CMS_SESSION_GONE" });
    }
  } catch {
    // Endpoint not available on this page — ignore silently
  }
}

async function applyPendingLogout(): Promise<void> {
  try {
    const res = await new Promise<any>(resolve => chrome.runtime.sendMessage({ type: "GET_PENDING_LOGOUT" }, resolve));
    if (!res?.pending) return;

    chrome.runtime.sendMessage({ type: "CLEAR_PENDING_LOGOUT" });
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    window.location.href = "/login";
  } catch {
    // Non-critical — ignore
  }
}

async function applyPendingWorkspaceSwitch(): Promise<void> {
  try {
    const res = await new Promise<any>(resolve =>
      chrome.runtime.sendMessage({ type: "GET_PENDING_WORKSPACE" }, resolve)
    );
    const pendingId: string | null = res?.workspaceId ?? null;
    if (!pendingId) return;

    const currentId = localStorage.getItem("saas-workspace-current");
    if (currentId === pendingId) {
      // Already on the right workspace — just clear the pending flag
      chrome.runtime.sendMessage({ type: "CLEAR_PENDING_WORKSPACE" });
      return;
    }

    chrome.runtime.sendMessage({ type: "CLEAR_PENDING_WORKSPACE" });
    localStorage.setItem("saas-workspace-current", pendingId);
    window.location.reload();
  } catch {
    // Non-critical — ignore
  }
}

chrome.runtime.onMessage.addListener(message => {
  if (message.type === "EXT_SWITCH_WORKSPACE" && message.workspaceId) {
    localStorage.setItem("saas-workspace-current", message.workspaceId);
    window.location.reload();
  }

  if (message.type === "EXT_LOGOUT") {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      .catch(() => {})
      .finally(() => {
        window.location.href = "/login";
      });
  }
});

applyPendingLogout();
applyPendingWorkspaceSwitch();
sendTokenToBackground();
