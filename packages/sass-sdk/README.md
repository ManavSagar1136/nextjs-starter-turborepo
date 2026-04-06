# @buildbase/saas-sdk

Wrapper around `@buildbase/sdk` that provides authentication, workspace management, subscription gating, feature flags, and quota usage tracking for React/Next.js applications.

---

## Table of Contents

- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Feature Flags](#feature-flags)
- [Subscription Gates](#subscription-gates)
- [Quota Usage Tracking](#quota-usage-tracking)
  - [Client-Side (SDK hooks)](#client-side-sdk-hooks)
  - [Server-Side (secure, HttpOnly cookie)](#server-side-secure-httonly-cookie)
- [Quota Gates](#quota-gates)
- [Combined Pattern: Feature + Quota](#combined-pattern-feature--quota)
- [Token Verification](#token-verification)

---

## Setup

Wrap your app with `SaaSProvider`. It reads SDK config from environment variables automatically.

```tsx
// apps/user/src/components/providers/SaaSProvider.tsx
import { SaaSProvider as BaseSaaSProvider } from "@buildbase/saas-sdk";
import { API } from "@/services";

export function SaaSProvider({ children }: { children: React.ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3001";

  return (
    <BaseSaaSProvider
      redirectUrl={`${baseUrl}/login`}
      onSignOut={async () => {
        await API.auth.logout().catch(console.error);
        window.location.reload();
      }}
      handleAuthentication={async (code: string) => {
        const data = await API.auth.verify(code);
        if (data.success && data.sessionId) return { sessionId: data.sessionId };
        throw new Error(data.message ?? "Authentication failed");
      }}
      handleEvent={(eventType, data) => {
        API.auth.handleWorkspaceEvent({ eventType, ...data }).catch(console.error);
      }}
      onWorkspaceChange={async (payload) => {
        await API.auth.changeWorkspace(payload.workspace, payload.user, payload.role);
      }}
    >
      {children}
    </BaseSaaSProvider>
  );
}
```

---

## Environment Variables

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SAAS_SERVER_URL` | Public | Buildbase server URL |
| `NEXT_PUBLIC_SAAS_ORG_ID` | Public | Your organisation ID |
| `NEXT_PUBLIC_SAAS_CLIENT_ID` | Public | OAuth client ID |
| `SAAS_CLIENT_SECRET` | Server-only | OAuth client secret (token verification) |
| `SAAS_API_TOKEN_SECRET` | Server-only | API secret for server-side usage recording |

---

## Authentication

```tsx
"use client";
import { useSaaSAuth, WhenAuthenticated, WhenUnauthenticated } from "@buildbase/saas-sdk";

export function Header() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useSaaSAuth();

  if (isLoading) return <Spinner />;

  return (
    <header>
      <WhenAuthenticated>
        <span>Hello, {user?.name}</span>
        <button onClick={() => signOut()}>Sign out</button>
      </WhenAuthenticated>

      <WhenUnauthenticated>
        <button onClick={() => signIn()}>Sign in</button>
      </WhenUnauthenticated>
    </header>
  );
}
```

### Role-based rendering

```tsx
import { WhenRoles, WhenWorkspaceRoles } from "@buildbase/saas-sdk";

// Global app role
<WhenRoles roles={["admin"]}>
  <AdminPanel />
</WhenRoles>

// Workspace role
<WhenWorkspaceRoles roles={["admin", "editor"]}>
  <EditButton />
</WhenWorkspaceRoles>
```

---

## Feature Flags

Features are enabled or disabled per workspace (plan) and per user. Use HOC components for conditional rendering, or hooks for imperative checks.

### Workspace feature flags

Features are tied to the workspace's subscription plan. If the plan includes a feature, it is enabled for that workspace.

```tsx
import {
  WhenWorkspaceFeatureEnabled,
  WhenWorkspaceFeatureDisabled,
} from "@buildbase/saas-sdk";

// Show component only when "email-campaigns" feature is enabled on the plan
<WhenWorkspaceFeatureEnabled slug="email-campaigns">
  <EmailCampaignBuilder />
</WhenWorkspaceFeatureEnabled>

// Show upgrade prompt when feature is not on the plan
<WhenWorkspaceFeatureDisabled slug="email-campaigns">
  <UpgradePrompt feature="Email Campaigns" />
</WhenWorkspaceFeatureDisabled>
```

### User feature flags

User-level flags are independent of the plan — they are toggled per individual user.

```tsx
import {
  WhenUserFeatureEnabled,
  WhenUserFeatureDisabled,
  useUserFeatures,
} from "@buildbase/saas-sdk";

// HOC
<WhenUserFeatureEnabled slug="beta-editor">
  <BetaEditor />
</WhenUserFeatureEnabled>

// Hook (imperative check)
function EditorPage() {
  const { isFeatureEnabled } = useUserFeatures();

  if (!isFeatureEnabled("beta-editor")) {
    return <StandardEditor />;
  }
  return <BetaEditor />;
}
```

### Checking features from subscription data

To check multiple features programmatically from the subscription:

```tsx
import { useSubscriptionManagement, useSaaSWorkspaces } from "@buildbase/saas-sdk";

function FeatureChecker() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { subscription, planVersion } = useSubscriptionManagement(currentWorkspace?._id);

  // Plan features (boolean flags)
  const features = planVersion?.features ?? {};
  const hasEmailCampaigns = features["email-campaigns"] === true;
  const hasAdvancedAnalytics = features["advanced-analytics"] === true;

  // Plan limits (numeric caps)
  const limits = planVersion?.limits ?? {};
  const maxUsers = limits["max-users"] ?? 5;
  const maxProjects = limits["max-projects"] ?? 3;

  return (
    <div>
      <p>Email campaigns: {hasEmailCampaigns ? "Enabled" : "Disabled"}</p>
      <p>Max users: {maxUsers}</p>
    </div>
  );
}
```

---

## Subscription Gates

Gate entire sections of UI based on whether the workspace has a subscription.

```tsx
import {
  WhenSubscription,
  WhenNoSubscription,
  WhenSubscriptionToPlans,
} from "@buildbase/saas-sdk";

function Dashboard() {
  return (
    <div>
      {/* Show only when ANY active subscription exists */}
      <WhenSubscription>
        <PaidFeatures />
      </WhenSubscription>

      {/* Show upgrade banner when no subscription */}
      <WhenNoSubscription>
        <UpgradeBanner />
      </WhenNoSubscription>

      {/* Show only on specific plans */}
      <WhenSubscriptionToPlans plans={["pro", "enterprise"]}>
        <EnterpriseFeatures />
      </WhenSubscriptionToPlans>
    </div>
  );
}
```

### Reading subscription details

```tsx
import { useSubscription, useSaaSWorkspaces } from "@buildbase/saas-sdk";

function SubscriptionBadge() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { subscription, loading } = useSubscription(currentWorkspace?._id);

  if (loading) return <Skeleton />;
  if (!subscription) return <span>Free</span>;

  return (
    <span>
      {subscription.plan?.name} · {subscription.subscriptionStatus}
    </span>
  );
}
```

---

## Quota Usage Tracking

Quotas are metered limits on your plan (e.g. emails sent, API calls, reports generated). You need to record usage every time a resource is consumed.

### When to record where

| Scenario | Where to record | Reason |
|---|---|---|
| User clicks "Send Email" button | Client-side SDK hook | User-initiated, immediate UI feedback |
| API route processes a request | Server-side (route handler) | Backend controls the resource |
| Background job / cron | Server-side (route handler) | No browser context |
| File upload completes | Either | Depends on where validation runs |

---

### Client-Side (SDK hooks)

Use the SDK's built-in hooks when usage is triggered directly from a user action in the browser. Quota gate components refresh automatically after recording.

#### Record usage

```tsx
"use client";
import { useRecordUsage, useSaaSWorkspaces } from "@buildbase/saas-sdk";

export function SendEmailButton({ recipientCount }: { recipientCount: number }) {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { recordUsage, loading, error } = useRecordUsage(currentWorkspace?._id);

  const handleSend = async () => {
    const result = await recordUsage({
      quotaSlug: "emails",
      quantity: recipientCount,
      source: "web-app",                   // optional: where usage came from
      idempotencyKey: `send-${Date.now()}`, // optional: prevent duplicates on retry
    });

    console.log(`Consumed: ${result.consumed} / ${result.included}`);
    console.log(`Available: ${result.available}`);

    if (result.overage > 0) {
      console.warn(`Overage: ${result.overage} units — billed to Stripe`);
    }
  };

  return (
    <button onClick={handleSend} disabled={loading}>
      {loading ? "Sending…" : `Send to ${recipientCount} recipients`}
    </button>
  );
}
```

#### Check single quota status

```tsx
"use client";
import { useQuotaUsageStatus, useSaaSWorkspaces } from "@buildbase/saas-sdk";

export function EmailQuotaBar() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { status, loading, refetch } = useQuotaUsageStatus(currentWorkspace?._id, "emails");

  if (loading) return <Skeleton className="h-4" />;
  if (!status) return null;

  const pct = Math.min(Math.round((status.consumed / status.included) * 100), 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>Emails this month</span>
        <span>{status.consumed.toLocaleString()} / {status.included.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded bg-muted">
        <div
          className={`h-full rounded ${status.hasOverage ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {status.hasOverage && (
        <p className="text-xs text-destructive">
          {status.overage.toLocaleString()} units over limit — overage billing active
        </p>
      )}
    </div>
  );
}
```

#### Check all quotas at once

```tsx
"use client";
import { useAllQuotaUsage, useSaaSWorkspaces } from "@buildbase/saas-sdk";

export function QuotaDashboard() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { quotas, loading, refetch } = useAllQuotaUsage(currentWorkspace?._id);

  if (loading) return <Spinner />;
  if (!quotas) return <p>No quota data available.</p>;

  return (
    <div className="space-y-4">
      {Object.entries(quotas).map(([slug, usage]) => (
        <div key={slug} className="flex items-center justify-between">
          <span className="capitalize">{slug.replace(/-/g, " ")}</span>
          <span className="text-sm text-muted-foreground">
            {usage.consumed.toLocaleString()} / {usage.included.toLocaleString()}
            {usage.hasOverage && (
              <span className="ml-2 text-destructive">
                +{usage.overage.toLocaleString()} overage
              </span>
            )}
          </span>
        </div>
      ))}
      <button onClick={refetch} className="text-xs text-muted-foreground">
        Refresh
      </button>
    </div>
  );
}
```

#### View usage history

```tsx
"use client";
import { useUsageLogs, useSaaSWorkspaces } from "@buildbase/saas-sdk";

export function UsageLogsTable({ quotaSlug }: { quotaSlug?: string }) {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { logs, totalDocs, totalPages, page, hasNextPage, loading, refetch } = useUsageLogs(
    currentWorkspace?._id,
    quotaSlug,           // optional — omit to show all quotas
    { limit: 20, page: 1 },
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Quota</th>
            <th>Qty</th>
            <th>Source</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{log.quotaSlug}</td>
              <td>{log.quantity}</td>
              <td>{log.source ?? "—"}</td>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">
        Page {page} of {totalPages} ({totalDocs} total)
      </p>
    </div>
  );
}
```

---

### Server-Side (secure, HttpOnly cookie)

Use this when usage is recorded from a Next.js API route (e.g. after processing a request on the backend). The org-level `sessionId` is stored in an HttpOnly cookie — it never reaches the browser.

#### Step 1 — Register route handlers (once per app)

```ts
// apps/user/src/app/api/saas/usage/record/route.ts
import { createRecordUsageHandler } from "@buildbase/saas-sdk/route-handlers";
export const POST = createRecordUsageHandler();

// apps/user/src/app/api/saas/usage/status/route.ts
import { createQuotaStatusHandler } from "@buildbase/saas-sdk/route-handlers";
export const GET = createQuotaStatusHandler();

// apps/user/src/app/api/saas/usage/all/route.ts
import { createAllQuotasHandler } from "@buildbase/saas-sdk/route-handlers";
export const GET = createAllQuotasHandler();
```

The route handlers automatically:
- Exchange your `SAAS_API_TOKEN_SECRET` for a session (on first call)
- Store the session in an HttpOnly cookie (valid 30 days)
- Refresh the session transparently when it's close to expiry
- Proxy the request to the Buildbase API

#### Step 2 — Record usage from an API route

```ts
// apps/user/src/app/api/reports/generate/route.ts
import { withAuth } from "@/middleware/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (request: NextRequest) => {
  const { workspaceId } = request.authenticatedUser;

  // Record BEFORE doing the work so you can gate on the response
  const usageRes = await fetch(
    `${process.env.NEXT_PUBLIC_USER_APP_URL}/api/saas/usage/record`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
      body: JSON.stringify({ workspaceId, quotaSlug: "reports", quantity: 1, source: "api" }),
    },
  );
  const usage = await usageRes.json();

  if (!usage.success) {
    return NextResponse.json({ error: "Failed to record usage" }, { status: 502 });
  }

  if (usage.available <= 0 && !usage.billedAsync) {
    return NextResponse.json(
      { error: "Report quota exceeded. Upgrade your plan to continue." },
      { status: 429 },
    );
  }

  // ... generate the report ...

  return NextResponse.json({
    success: true,
    quotaRemaining: usage.available,
    overage: usage.overage,
  });
});
```

#### Step 3 — Use proxy hooks from the browser (optional)

If you need to trigger server-side usage recording from a button click (so the sessionId stays on the server):

```tsx
"use client";
import { useServerRecordUsage, useSaaSWorkspaces } from "@buildbase/saas-sdk";

export function GenerateReportButton() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { record, isLoading, error, data } = useServerRecordUsage();

  const handleClick = async () => {
    const result = await record({
      workspaceId: currentWorkspace!._id,
      quotaSlug: "reports",
      quantity: 1,
      source: "web-app",
    });

    if (!result.success) {
      alert("Failed to record usage");
      return;
    }

    if (result.available === 0 && !result.billedAsync) {
      alert("Report quota exhausted — please upgrade.");
      return;
    }

    // Proceed with generating the report
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Recording…" : "Generate Report"}
    </button>
  );
}
```

---

## Quota Gates

Show or hide UI based on current quota status. Gates refresh automatically when `useRecordUsage` records consumption.

```tsx
import {
  WhenQuotaAvailable,
  WhenQuotaExhausted,
  WhenQuotaOverage,
  WhenQuotaThreshold,
} from "@buildbase/saas-sdk";

function EmailSection() {
  return (
    <div>
      {/* Show send button only when quota has remaining units */}
      <WhenQuotaAvailable
        slug="emails"
        loadingComponent={<Skeleton className="h-10 w-32" />}
        fallbackComponent={
          <p className="text-sm text-muted-foreground">
            Email quota exhausted.{" "}
            <a href="/settings/billing" className="underline">Upgrade</a>
          </p>
        }
      >
        <SendEmailButton />
      </WhenQuotaAvailable>

      {/* Warn at 80% usage */}
      <WhenQuotaThreshold slug="emails" threshold={80}>
        <div className="rounded border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
          You have used over 80% of your email quota this month.
        </div>
      </WhenQuotaThreshold>

      {/* Show overage billing notice */}
      <WhenQuotaOverage slug="emails">
        <div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm">
          Overage billing is active — additional emails will be charged to your card.
        </div>
      </WhenQuotaOverage>

      {/* Exhausted state */}
      <WhenQuotaExhausted slug="emails">
        <UpgradePrompt />
      </WhenQuotaExhausted>
    </div>
  );
}
```

### Quota gate component reference

| Component | Renders when | Props |
|---|---|---|
| `WhenQuotaAvailable` | `available > 0` | `slug`, `loadingComponent?`, `fallbackComponent?` |
| `WhenQuotaExhausted` | `available <= 0` | `slug`, `loadingComponent?`, `fallbackComponent?` |
| `WhenQuotaOverage` | `hasOverage === true` | `slug`, `loadingComponent?`, `fallbackComponent?` |
| `WhenQuotaThreshold` | usage `%` >= threshold | `slug`, `threshold` (0–100), `loadingComponent?`, `fallbackComponent?` |

---

## Combined Pattern: Feature + Quota

The most complete pattern: check if the feature is on the plan, then check quota availability, then record usage.

```tsx
"use client";
import {
  WhenWorkspaceFeatureEnabled,
  WhenWorkspaceFeatureDisabled,
  WhenQuotaAvailable,
  WhenQuotaExhausted,
  WhenQuotaThreshold,
  useRecordUsage,
  useSaaSWorkspaces,
} from "@buildbase/saas-sdk";

export function EmailCampaignSection() {
  return (
    <div>
      {/* Feature not on plan → show upgrade */}
      <WhenWorkspaceFeatureDisabled slug="email-campaigns">
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="font-medium">Email Campaigns</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upgrade to the Pro plan to access email campaigns.
          </p>
          <a href="/settings/billing" className="btn-primary mt-4">
            Upgrade
          </a>
        </div>
      </WhenWorkspaceFeatureDisabled>

      {/* Feature on plan → show campaign UI with quota gating */}
      <WhenWorkspaceFeatureEnabled slug="email-campaigns">
        {/* Warn when approaching quota limit */}
        <WhenQuotaThreshold slug="emails" threshold={80}>
          <QuotaWarningBanner quotaSlug="emails" />
        </WhenQuotaThreshold>

        {/* Show action when quota is available */}
        <WhenQuotaAvailable
          slug="emails"
          fallbackComponent={<QuotaExhaustedCard quotaSlug="emails" />}
        >
          <SendCampaignButton />
        </WhenQuotaAvailable>
      </WhenWorkspaceFeatureEnabled>
    </div>
  );
}

// The actual send button — records usage on click
function SendCampaignButton() {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { recordUsage, loading } = useRecordUsage(currentWorkspace?._id);

  const handleSend = async () => {
    const result = await recordUsage({
      quotaSlug: "emails",
      quantity: 1,
      source: "email-campaigns",
    });

    if (result.overage > 0) {
      // Optionally warn user that they are now in overage
      toast.warning(`Overage billing active — ${result.overage} units over limit.`);
    }

    // Continue with sending the campaign...
  };

  return (
    <button onClick={handleSend} disabled={loading}>
      {loading ? "Sending…" : "Send Campaign"}
    </button>
  );
}

// Reusable quota warning banner
function QuotaWarningBanner({ quotaSlug }: { quotaSlug: string }) {
  const { currentWorkspace } = useSaaSWorkspaces();
  const { status } = useQuotaUsageStatus(currentWorkspace?._id, quotaSlug);
  if (!status) return null;
  const pct = Math.round((status.consumed / status.included) * 100);
  return (
    <div className="rounded border border-yellow-400 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
      You have used {pct}% of your {quotaSlug} quota this month.{" "}
      <a href="/settings/billing" className="font-medium underline">Manage plan</a>
    </div>
  );
}

// Reusable exhausted card
function QuotaExhaustedCard({ quotaSlug }: { quotaSlug: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="font-medium">Quota Exhausted</p>
      <p className="text-sm text-muted-foreground mt-1">
        You have reached your {quotaSlug} limit for this billing period.
      </p>
      <a href="/settings/billing" className="btn-primary mt-4">
        Upgrade plan
      </a>
    </div>
  );
}
```

### Full feature + quota checklist

```
Plan has feature?
  ├── No  → WhenWorkspaceFeatureDisabled → show upgrade CTA
  └── Yes → WhenWorkspaceFeatureEnabled
              ├── Approaching limit? → WhenQuotaThreshold → show warning
              ├── Has quota left?    → WhenQuotaAvailable → show action button
              │     └── On action → useRecordUsage() → check result.overage
              └── Exhausted?         → WhenQuotaExhausted → show upgrade CTA
```

---

## Token Verification

Used in your `/api/auth/verify` route to exchange the SDK OAuth code for a session.

```typescript
// apps/user/src/app/api/auth/verify/route.ts
import { verifySDKToken } from "@buildbase/saas-sdk/token-verification";

export async function POST(request: Request) {
  const { code } = await request.json();

  const result = await verifySDKToken({ code });

  if (!result.success || !result.sessionId) {
    return Response.json({ success: false, message: result.message }, { status: 401 });
  }

  // Sync user + workspaces to your database here...

  return Response.json({ success: true, sessionId: result.sessionId, user: result.user });
}
```

---

## Hook & Component Reference

### Auth
| Export | Type | Description |
|---|---|---|
| `useSaaSAuth()` | Hook | Auth state: `user`, `isAuthenticated`, `isLoading`, `signIn()`, `signOut()` |
| `useSDKAuth()` | Hook | Enhanced auth with `userId`, `userEmail`, `userRole`, `isReady`, `hasUser` |
| `WhenAuthenticated` | Component | Renders children when user is signed in |
| `WhenUnauthenticated` | Component | Renders children when user is signed out |
| `WhenRoles` | Component | Renders when user has one of the specified global roles |
| `WhenWorkspaceRoles` | Component | Renders when user has one of the specified workspace roles |

### Workspaces
| Export | Type | Description |
|---|---|---|
| `useSaaSWorkspaces()` | Hook | `currentWorkspace`, `workspaces`, `switchToWorkspace()`, user management |
| `WorkspaceSwitcher` | Component | Workspace selector UI |

### Features
| Export | Type | Description |
|---|---|---|
| `useUserFeatures()` | Hook | `isFeatureEnabled(slug)` for user-level flags |
| `WhenWorkspaceFeatureEnabled` | Component | Renders when workspace plan has the feature |
| `WhenWorkspaceFeatureDisabled` | Component | Renders when workspace plan does NOT have the feature |
| `WhenUserFeatureEnabled` | Component | Renders when user-level feature is enabled |
| `WhenUserFeatureDisabled` | Component | Renders when user-level feature is disabled |

### Subscription
| Export | Type | Description |
|---|---|---|
| `useSubscription(workspaceId)` | Hook | Current subscription data |
| `useSubscriptionManagement(workspaceId)` | Hook | Subscription + plan group + update combined |
| `usePlanGroup(workspaceId)` | Hook | Plan group with versions |
| `useCreateCheckoutSession(workspaceId)` | Hook | Creates Stripe checkout session |
| `useUpdateSubscription(workspaceId)` | Hook | Upgrade / downgrade plan |
| `useCancelSubscription(workspaceId)` | Hook | Cancel at period end |
| `useResumeSubscription(workspaceId)` | Hook | Resume cancelled subscription |
| `useInvoices(workspaceId)` | Hook | Paginated invoice history |
| `usePublicPlans(slug)` | Hook | Public pricing page data (no auth) |
| `WhenSubscription` | Component | Renders when workspace has active subscription |
| `WhenNoSubscription` | Component | Renders when no subscription |
| `WhenSubscriptionToPlans` | Component | Renders only on specified plan slugs |

### Quota Usage — Client-Side
| Export | Type | Description |
|---|---|---|
| `useRecordUsage(workspaceId)` | Hook | Record quota consumption — `recordUsage({ quotaSlug, quantity, source?, idempotencyKey? })` |
| `useQuotaUsageStatus(workspaceId, quotaSlug)` | Hook | Single quota status — `{ status, loading, refetch }` |
| `useAllQuotaUsage(workspaceId)` | Hook | All quotas — `{ quotas, loading, refetch }` |
| `useUsageLogs(workspaceId, quotaSlug?, options?)` | Hook | Paginated usage history |
| `useQuotaUsageContext()` | Hook | Raw quota data + manual `refetch()` |
| `WhenQuotaAvailable` | Component | Renders when `available > 0` |
| `WhenQuotaExhausted` | Component | Renders when `available <= 0` |
| `WhenQuotaOverage` | Component | Renders when `hasOverage === true` |
| `WhenQuotaThreshold` | Component | Renders when usage % >= `threshold` prop |

### Quota Usage — Server-Side Proxy
| Export | Type | Description |
|---|---|---|
| `createRecordUsageHandler()` | Route handler | `POST /api/saas/usage/record` — reads sessionId from HttpOnly cookie |
| `createQuotaStatusHandler()` | Route handler | `GET /api/saas/usage/status?workspaceId=&quotaSlug=` |
| `createAllQuotasHandler()` | Route handler | `GET /api/saas/usage/all?workspaceId=` |
| `useServerRecordUsage()` | Hook | Calls your app's `/api/saas/usage/record` — sessionId never leaves server |
| `useServerQuotaStatus(options)` | Hook | Calls your app's `/api/saas/usage/status` |
| `useServerAllQuotas(options)` | Hook | Calls your app's `/api/saas/usage/all` |
| `exchangeToken(config)` | Utility | Exchange API token for sessionId (server-only) |
| `getOrRefreshSession(options)` | Utility | Get or refresh session from CookieStore (server components / actions) |
| `getOrRefreshSessionFromRequest(request)` | Utility | Get or refresh session from Request headers (route handlers) |
