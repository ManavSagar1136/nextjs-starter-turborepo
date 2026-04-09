"use client";

/**
 * SDK Event Test Page — /test-events
 *
 * Tests every SDK event and workspace operation end-to-end:
 *   • Real operations via useSaaSWorkspaces (fire real events through the SDK)
 *   • Synthetic events via eventEmitter (test the event pipeline without side effects)
 *   • Live session/store state panel (verify JWT + Redux are always in sync)
 *   • Event log panel (tracks every event sent + backend response)
 */

import React, { useState, useCallback, useEffect } from "react";
import { useSaaSWorkspaces, useSaaSAuth, eventEmitter } from "@buildbase/saas-sdk";
import { useSDKAuth } from "@/hooks/useSDKAuth";
import { useUser } from "@/store/hooks";
import { API } from "@/services";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import { Input } from "@buildbase/ui/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@buildbase/ui/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogEntry = {
  id: number;
  ts: string;
  type: "event" | "api" | "error" | "info";
  label: string;
  detail: string;
};

let logCounter = 0;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestEventsPage() {
  const sdkAuth = useSaaSAuth();
  const { isAdmin, isEditor, isViewer, workspaceRole } = useSDKAuth();
  const storeUser = useUser();
  const ws = useSaaSWorkspaces();

  // session state from API (reads the HTTP-only cookie / JWT)
  const [session, setSession] = useState<any>(null);

  // event log
  const [log, setLog] = useState<LogEntry[]>([]);

  // form inputs
  const [newWsName, setNewWsName] = useState("Test Workspace");
  const [updateWsName, setUpdateWsName] = useState("Updated Workspace");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserRole, setAddUserRole] = useState("viewer");
  const [removeUserId, setRemoveUserId] = useState("");
  const [changeRoleUserId, setChangeRoleUserId] = useState("");
  const [changeRoleNew, setChangeRoleNew] = useState("editor");
  const [newProfileName, setNewProfileName] = useState(sdkAuth.user?.name ?? "");
  const [syntheticUserId, setSyntheticUserId] = useState("");
  const [syntheticRole, setSyntheticRole] = useState("editor");
  const [loading, setLoading] = useState<string | null>(null);

  // ── helpers ────────────────────────────────────────────────────────────────

  const addLog = useCallback((type: LogEntry["type"], label: string, detail: any) => {
    const entry: LogEntry = {
      id: ++logCounter,
      ts: new Date().toLocaleTimeString(),
      type,
      label,
      detail: typeof detail === "string" ? detail : JSON.stringify(detail, null, 2),
    };
    setLog(prev => [entry, ...prev].slice(0, 100));
  }, []);

  const run = useCallback(
    async (label: string, fn: () => Promise<any>) => {
      setLoading(label);
      addLog("info", label, "→ started");
      try {
        const result = await fn();
        addLog("api", label, result ?? "✓ done");
      } catch (err: any) {
        addLog("error", label, err?.message ?? String(err));
      } finally {
        setLoading(null);
      }
    },
    [addLog]
  );

  // ── session refresh ────────────────────────────────────────────────────────

  const refreshSession = useCallback(async () => {
    try {
      const s = await API.auth.getSession();
      setSession(s);
      addLog("api", "getSession", s);
    } catch (e: any) {
      addLog("error", "getSession", e?.message);
    }
  }, [addLog]);

  useEffect(() => {
    refreshSession();
  }, []);

  // ── current workspace ──────────────────────────────────────────────────────

  const cw = ws.currentWorkspace;
  const cwId = cw?._id ?? cw?.workspaceId ?? "";
  const cwUsers = (cw as any)?.users ?? [];

  // ── color helpers ──────────────────────────────────────────────────────────

  const logColor: Record<LogEntry["type"], string> = {
    event: "text-blue-600",
    api: "text-green-600",
    error: "text-red-600",
    info: "text-gray-400",
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">SDK Event Test Panel</h1>
        <p className="text-muted-foreground text-sm">
          Use this page to trigger every SDK event and verify the full pipeline: SDK → SaaSProvider → backend → DB →
          JWT.
        </p>
      </div>

      {/* ── State Panel ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* JWT / Session */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">JWT Session (cookie)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">APP role:</span>{" "}
              <Badge variant="outline">{session?.user?.role ?? "—"}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">workspaceRole:</span>{" "}
              <Badge variant={session?.user?.workspaceRole ? "default" : "outline"}>
                {session?.user?.workspaceRole ?? "—"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">workspaceId:</span>{" "}
              <span className="font-mono">{session?.user?.workspaceId ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">workspaceName:</span>{" "}
              <span>{session?.user?.workspaceName ?? "—"}</span>
            </div>
            <Button size="sm" variant="outline" className="mt-2 h-6 text-xs" onClick={refreshSession}>
              Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Redux Store */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Redux Store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">role (APP):</span>{" "}
              <Badge variant="outline">{storeUser.role ?? "—"}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">workspaceRole:</span>{" "}
              <Badge variant={storeUser.workspaceRole ? "default" : "outline"}>{storeUser.workspaceRole ?? "—"}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">isAdmin:</span> {isAdmin ? "✅" : "❌"} &nbsp;
              <span className="text-muted-foreground">isEditor:</span> {isEditor ? "✅" : "❌"} &nbsp;
              <span className="text-muted-foreground">isViewer:</span> {isViewer ? "✅" : "❌"}
            </div>
            <div>
              <span className="text-muted-foreground">workspaceName:</span> {storeUser.workspaceName ?? "—"}
            </div>
          </CardContent>
        </Card>

        {/* Current Workspace */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">SDK Current Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">name:</span> {cw?.name ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">id:</span>{" "}
              <span className="font-mono text-[10px]">{cwId || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">members:</span> {cwUsers.length}
            </div>
            <div>
              <span className="text-muted-foreground">features:</span>{" "}
              {Object.keys((cw as any)?.features ?? {}).join(", ") || "none"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Left column: real operations ──────────────────────────────── */}
        <div className="space-y-4">
          {/* workspace:created */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge className="text-[10px]">workspace:created</Badge>
                Create Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={newWsName}
                onChange={e => setNewWsName(e.target.value)}
                placeholder="Workspace name"
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                disabled={!!loading}
                onClick={() =>
                  run("createWorkspace", async () => {
                    await ws.createWorkspace(newWsName);
                    return `Workspace "${newWsName}" created`;
                  })
                }
              >
                Create
              </Button>
            </CardContent>
          </Card>

          {/* workspace:updated */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge className="text-[10px]">workspace:updated</Badge>
                Update Current Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={updateWsName}
                onChange={e => setUpdateWsName(e.target.value)}
                placeholder="New name"
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                disabled={!!loading || !cw}
                onClick={() =>
                  run("updateWorkspace", async () => {
                    await ws.updateWorkspace(cw!, { name: updateWsName });
                    await refreshSession();
                    return `Workspace renamed to "${updateWsName}"`;
                  })
                }
              >
                Rename
              </Button>
            </CardContent>
          </Card>

          {/* workspace:user-added */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge className="text-[10px]">workspace:user-added</Badge>
                Add Member
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={addUserEmail}
                onChange={e => setAddUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-8 text-xs"
              />
              <Select value={addUserRole} onValueChange={setAddUserRole}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!!loading || !cwId || !addUserEmail}
                onClick={() =>
                  run("addUser", async () => {
                    const r = await ws.addUser(cwId, addUserEmail, addUserRole);
                    return r;
                  })
                }
              >
                Add
              </Button>
            </CardContent>
          </Card>

          {/* workspace:user-removed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge className="text-[10px]">workspace:user-removed</Badge>
                Remove Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-muted-foreground text-xs">
                Members:{" "}
                {cwUsers.map((u: any) => (
                  <span key={u._id ?? u.id} className="mr-2 font-mono">
                    {u.email ?? u._id ?? u.id}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={removeUserId}
                  onChange={e => setRemoveUserId(e.target.value)}
                  placeholder="userId to remove"
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!!loading || !cwId || !removeUserId}
                  onClick={() =>
                    run("removeUser", async () => {
                      const r = await ws.removeUser(cwId, removeUserId);
                      return r;
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* workspace:user-role-changed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge className="text-[10px]">workspace:user-role-changed</Badge>
                Change Member Role
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={changeRoleUserId}
                onChange={e => setChangeRoleUserId(e.target.value)}
                placeholder="userId"
                className="h-8 text-xs"
              />
              <Select value={changeRoleNew} onValueChange={setChangeRoleNew}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!!loading || !cwId || !changeRoleUserId}
                onClick={() =>
                  run("changeRole", async () => {
                    const r = await ws.updateUser(cwId, changeRoleUserId, { role: changeRoleNew } as any);
                    await refreshSession();
                    return r;
                  })
                }
              >
                Change
              </Button>
            </CardContent>
          </Card>

          {/* workspace:deleted */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge variant="destructive" className="text-[10px]">
                  workspace:deleted
                </Badge>
                Delete Current Workspace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="destructive"
                disabled={!!loading || !cwId}
                onClick={() =>
                  run("deleteWorkspace", async () => {
                    const r = await ws.deleteWorkspace(cwId);
                    await refreshSession();
                    return r;
                  })
                }
              >
                Delete &quot;{cw?.name ?? "current"}&quot;
              </Button>
            </CardContent>
          </Card>

          {/* workspace:changed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-[10px]">
                  workspace:changed
                </Badge>
                Switch Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-xs">
                Your workspaces ({ws.workspaces.length}). Click to switch — fires <code>onWorkspaceChange</code>.
              </p>
              <div className="flex flex-wrap gap-2">
                {ws.workspaces.map(w => (
                  <Button
                    key={w._id ?? w.workspaceId}
                    size="sm"
                    variant={cw?._id === w._id ? "default" : "outline"}
                    disabled={!!loading || ws.switching}
                    className="h-7 text-xs"
                    onClick={() =>
                      run(`switchTo:${w.name}`, async () => {
                        await ws.switchToWorkspace(w);
                        await refreshSession();
                        return `Switched to "${w.name}"`;
                      })
                    }
                  >
                    {w.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* user:updated */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-[10px]">
                  user:updated
                </Badge>
                Update Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="New display name"
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                disabled={!!loading || !newProfileName}
                onClick={() =>
                  run("updateProfile", async () => {
                    const r = await ws.updateUserProfile({ name: newProfileName });
                    return r;
                  })
                }
              >
                Update
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: synthetic events + log ──────────────────────── */}
        <div className="space-y-4">
          {/* Synthetic event emitter */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Synthetic Events (eventEmitter)</CardTitle>
              <p className="text-muted-foreground text-xs">
                Fire events directly without touching SDK state — verifies the SaaSProvider → backend pipeline in
                isolation.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={syntheticUserId}
                  onChange={e => setSyntheticUserId(e.target.value)}
                  placeholder="userId (for user events)"
                  className="h-8 text-xs"
                />
                <Select value={syntheticRole} onValueChange={setSyntheticRole}>
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={!cw}
                  onClick={() =>
                    run("emit:workspace:updated", async () => {
                      await eventEmitter.emitWorkspaceUpdated(cw!);
                      return "emitted workspace:updated";
                    })
                  }
                >
                  workspace:updated
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={!cw || !syntheticUserId}
                  onClick={() =>
                    run("emit:user-added", async () => {
                      await eventEmitter.emitWorkspaceUserAdded(syntheticUserId, cw!, syntheticRole);
                      return `emitted workspace:user-added (${syntheticUserId}, ${syntheticRole})`;
                    })
                  }
                >
                  user-added
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={!cw || !syntheticUserId}
                  onClick={() =>
                    run("emit:user-removed", async () => {
                      await eventEmitter.emitWorkspaceUserRemoved(syntheticUserId, cw!, syntheticRole);
                      return `emitted workspace:user-removed (${syntheticUserId})`;
                    })
                  }
                >
                  user-removed
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={!cw || !syntheticUserId}
                  onClick={() =>
                    run("emit:role-changed", async () => {
                      await eventEmitter.emitWorkspaceUserRoleChanged(syntheticUserId, cw!, "viewer", syntheticRole);
                      return `emitted workspace:user-role-changed viewer→${syntheticRole}`;
                    })
                  }
                >
                  role-changed
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={!cw}
                  onClick={() =>
                    run("emit:workspace:deleted", async () => {
                      await eventEmitter.emitWorkspaceDeleted(cw!);
                      return "emitted workspace:deleted";
                    })
                  }
                >
                  workspace:deleted
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={!sdkAuth.user}
                  onClick={() =>
                    run("emit:user:updated", async () => {
                      await eventEmitter.emitUserUpdated(sdkAuth.user! as any, sdkAuth.user! as any);
                      return "emitted user:updated";
                    })
                  }
                >
                  user:updated
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={!sdkAuth.user}
                  onClick={() =>
                    run("emit:user:created", async () => {
                      await eventEmitter.emitUserCreated(sdkAuth.user! as any);
                      return "emitted user:created";
                    })
                  }
                >
                  user:created
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Event / API Log */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Event Log</CardTitle>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setLog([])}>
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[480px] overflow-y-auto rounded border bg-gray-50 p-2 font-mono text-xs dark:bg-gray-900">
                {log.length === 0 && (
                  <p className="text-muted-foreground p-2 text-center">No events yet — trigger an operation above.</p>
                )}
                {log.map(entry => (
                  <div key={entry.id} className="mb-2 border-b pb-2 last:border-0">
                    <div className={`font-semibold ${logColor[entry.type]}`}>
                      [{entry.ts}] {entry.label}
                    </div>
                    <pre className="whitespace-pre-wrap break-all text-[10px] text-gray-600 dark:text-gray-300">
                      {entry.detail}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
