# User App (`apps/user`)

The primary workspace-scoped Next.js app. Users log in here, manage their workspace, and interact with all plan-gated features.

---

## Development

```bash
yarn dev
```

Open [http://localhost:3101](http://localhost:3101) with your browser.

---

## Subscription Model

**There is no free plan.** New workspaces start with `null` features/limits in the database and are blocked from all plan-gated operations until a paid subscription or trial is active.

### Workspace lifecycle

| Event                      | `workspace.features`   | `workspace.limits`     | Plan-gated routes  |
| -------------------------- | ---------------------- | ---------------------- | ------------------ |
| `workspace:created`        | `null`                 | `null`                 | All blocked — 403  |
| Trial / subscription start | Populated by Buildbase | Populated by Buildbase | Unblocked per plan |
| Subscription cancelled     | `{}` (empty)           | `{}` (empty)           | All blocked — 403  |

Trials (7 or 14 days) are configured in the Buildbase dashboard. They fire the same
`workspace:updated` event as a paid subscription — no code changes needed.

### Client-side note

Client hooks (`useFeatureGate`, `useLimitCheck`) read from Buildbase's live `planVersion`.
When there is no subscription, `planVersion` is `null` and these hooks are fail-open
on the client (UI shows features as enabled). The server always enforces correctly.
Add a subscription wall in your dashboard layout to surface the subscribe prompt:

```tsx
// apps/user/src/app/(dashboard)/layout.tsx
const { response } = useSubscriptionContext();
if (!response?.planVersion) {
  redirect("/billing");
}
```

---

## Plan Items

| Type    | Constant                      | Slug            | Controls                               |
| ------- | ----------------------------- | --------------- | -------------------------------------- |
| Feature | `PLAN_FEATURES.API_ACCESS`    | `api-access`    | API key creation + programmatic access |
| Feature | `PLAN_FEATURES.MEDIA_LIBRARY` | `media-library` | File upload + asset management         |
| Limit   | `PLAN_LIMITS.MAX_API_KEYS`    | `max-api-keys`  | Max active API keys (null = unlimited) |
| Quota   | `PLAN_QUOTAS.API_CALLS`       | `api-calls`     | Monthly API call budget (metered)      |
| Quota   | `PLAN_QUOTAS.MEDIA_STORAGE`   | `media-storage` | Storage in MB per billing period       |

See `PLAN_DESIGN.md` (repo root) for the full developer checklist and CLAUDE.md for the complete architectural playbook.

---

## Feature / Plan Gate Architecture

| Layer  | Tool                                                              | Import                                |
| ------ | ----------------------------------------------------------------- | ------------------------------------- |
| Server | `withPermissionCheck`, `withPlanCheck`, `withQuotaCheck`          | `@buildbase/helpers/auth`                   |
| Client | `useFeatureGate`, `useLimitCheck`, `FeatureGate`, `FeatureButton` | `@buildbase/saas-sdk`                       |
| Roles  | `WORKSPACE_ROLES`, `WhenWorkspaceRoles`                           | `@buildbase/database/user`, `@buildbase/saas-sdk` |

All plan slug constants are defined once in `packages/sass-sdk/src/plan-slugs.ts`.

---

## Key Directories

```
src/
  app/
    (dashboard)/          — Authenticated workspace pages
    api/
      auth/               — Auth, workspace, and session handlers
      v1/                 — Versioned API endpoints (API keys, etc.)
      saas/usage/         — Quota proxy routes (record, status, all)
  components/
    feature-gate/         — FeatureGate, FeatureButton, FeatureAccessDeniedDialog
    providers/            — SaaSProvider, AppProviders
  hooks/
    useSDKAuth.ts         — Workspace-role-aware auth hook (isAdmin, isEditor, isViewer)
    useInitWorkspace.ts   — Syncs workspaceId/workspaceRole from session on page load
  store/                  — Redux slice (user state, workspaceId, workspaceRole)
```
