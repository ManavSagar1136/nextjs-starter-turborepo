import { useState, useCallback } from "react";
import type { ExtWorkspace, ExtSession } from "../../types/messages";
import { sendMessage } from "./useAuth";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<ExtWorkspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await sendMessage({ type: "GET_WORKSPACES" });
    if (res.type === "WORKSPACES_RESULT") {
      setWorkspaces(res.data);
    } else if (res.type === "ERROR") {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  const switchWorkspace = useCallback(
    async (workspace: ExtWorkspace, currentUser: ExtSession["user"]): Promise<ExtSession | null> => {
      setLoading(true);
      const res = await sendMessage({
        type: "CHANGE_WORKSPACE",
        workspace,
        user: currentUser ?? {},
      });
      setLoading(false);

      if (res.type === "SESSION_RESULT") return res.data;
      if (res.type === "ERROR") setError(res.error);
      return null;
    },
    []
  );

  return { workspaces, loading, error, fetchWorkspaces, switchWorkspace };
}
