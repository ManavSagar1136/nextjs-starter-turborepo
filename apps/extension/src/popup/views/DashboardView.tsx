import { Avatar } from "../components/Avatar";
import type { ExtSession } from "../../types/messages";

const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3101";
const DASHBOARD_ROUTE: string = import.meta.env.VITE_DASHBOARD_ROUTE || "/dashboard";

interface DashboardViewProps {
  session: ExtSession;
  onLogout: () => Promise<void>;
  onSwitchWorkspace: () => void;
}

function roleBadge(role?: string) {
  const map: Record<string, string> = {
    admin: "bg-indigo-100 text-indigo-700",
    editor: "bg-emerald-100 text-emerald-700",
    viewer: "bg-gray-100 text-gray-600",
  };
  const cls = map[role?.toLowerCase() ?? ""] ?? "bg-gray-100 text-gray-600";
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${cls}`}>{role ?? "member"}</span>;
}

export function DashboardView({ session, onLogout, onSwitchWorkspace }: DashboardViewProps) {
  const { user } = session;
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "User";

  const openDashboard = () => {
    chrome.tabs.create({ url: `${API_URL}${DASHBOARD_ROUTE}` });
  };

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {/* Header — user profile */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={displayName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
            <p className="truncate text-xs text-gray-500">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
        </button>
      </div>

      {/* Current workspace */}
      <div className="px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Workspace</p>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              {(user?.workspaceName ?? "W")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user?.workspaceName ?? "No workspace"}</p>
              <div className="mt-0.5">{roleBadge(user?.workspaceRole)}</div>
            </div>
          </div>
          <button
            onClick={onSwitchWorkspace}
            className="ml-2 flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Switch
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3">
        <button
          onClick={openDashboard}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
        >
          <span>Open dashboard</span>
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
