import { useEffect } from "react";
import { LoadingState } from "../components/LoadingState";
import { useWorkspaces } from "../hooks/useWorkspaces";
import type { ExtSession, ExtWorkspace } from "../../types/messages";

interface WorkspaceSelectViewProps {
  session: ExtSession;
  onBack: () => void;
  onSelected: (updated: ExtSession) => void;
}

export function WorkspaceSelectView({ session, onBack, onSelected }: WorkspaceSelectViewProps) {
  const { workspaces, loading, error, fetchWorkspaces, switchWorkspace } = useWorkspaces();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSelect = async (ws: ExtWorkspace) => {
    if (ws.id === session.user?.workspaceId) {
      onBack();
      return;
    }
    const updated = await switchWorkspace(ws, session.user);
    if (updated) onSelected(updated);
  };

  if (loading) return <LoadingState message="Loading workspaces…" />;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-gray-900">Switch Workspace</h2>
      </div>

      {/* Workspace list */}
      <div className="max-h-[440px] overflow-y-auto py-2">
        {error && <p className="px-4 py-3 text-sm text-red-500">{error}</p>}

        {!error && workspaces.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-400">No workspaces found.</p>
        )}

        {workspaces.map(ws => {
          const isActive = ws.id === session.user?.workspaceId;
          return (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
                  {ws.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{ws.name}</p>
                  <p className="text-xs capitalize text-gray-500">{ws.role}</p>
                </div>
              </div>
              {isActive && (
                <svg
                  className="ml-2 h-4 w-4 flex-shrink-0 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
