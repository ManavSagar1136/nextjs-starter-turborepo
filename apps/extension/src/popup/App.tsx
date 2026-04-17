import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { LoadingState } from "./components/LoadingState";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { WorkspaceSelectView } from "./views/WorkspaceSelectView";
import type { ExtSession } from "../types/messages";

type View = "dashboard" | "workspace-select";

export default function App() {
  const { status, session, login, cancelLogin, waitingForLogin, logout, refresh } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [liveSession, setLiveSession] = useState<ExtSession | null>(null);

  // liveSession overrides hook session when workspace was just switched
  const activeSession = liveSession ?? session;

  const handleWorkspaceSelected = (updated: ExtSession) => {
    setLiveSession(updated);
    setView("dashboard");
    // Also refresh the hook state so subsequent re-opens are correct
    refresh();
  };

  if (status === "loading") {
    return (
      <div className="font-sans text-gray-900 antialiased">
        <LoadingState />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="font-sans text-gray-900 antialiased">
        <LoginView onLogin={login} onCancel={cancelLogin} waiting={waitingForLogin} />
      </div>
    );
  }

  // authenticated
  return (
    <div className="font-sans text-gray-900 antialiased">
      {view === "dashboard" && activeSession && (
        <DashboardView
          session={activeSession}
          onLogout={logout}
          onSwitchWorkspace={() => setView("workspace-select")}
        />
      )}

      {view === "workspace-select" && activeSession && (
        <WorkspaceSelectView
          session={activeSession}
          onBack={() => setView("dashboard")}
          onSelected={handleWorkspaceSelected}
        />
      )}
    </div>
  );
}
