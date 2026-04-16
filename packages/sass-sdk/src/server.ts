/**
 * BuildBase server-side factory — re-exports the default BuildBase() from @buildbase/sdk.
 *
 * Import as: import BuildBase from '@buildbase/saas-sdk/server'
 *
 * This is a SERVER-ONLY subpath. Never import it in client components.
 * The ./server subpath is intentionally excluded from the main barrel to prevent
 * server-only code (Node.js crypto, cookie handling) from entering client bundles.
 *
 * ─── Next.js App Router setup ────────────────────────────────────────────────
 *
 * Create apps/user/src/lib/buildbase.ts:
 *
 *   import BuildBase from '@buildbase/saas-sdk/server'
 *   import { cookies } from 'next/headers'
 *
 *   export const {
 *     auth,
 *     workspace,
 *     subscription,
 *     usage,
 *     plans,
 *     invoices,
 *     users,
 *     features,
 *     settings,
 *     notification,
 *     permissions,
 *     withSession,
 *     client,
 *   } = BuildBase({
 *     serverUrl: process.env.NEXT_PUBLIC_SAAS_SERVER_URL!,
 *     orgId:     process.env.NEXT_PUBLIC_SAAS_ORG_ID!,
 *     getSessionId: async () => {
 *       const c = await cookies()
 *       return c.get('saas_session')?.value ?? null
 *     },
 *   })
 *
 * ─── Usage in API routes ──────────────────────────────────────────────────────
 *
 *   // apps/user/src/app/api/workspace/route.ts
 *   import { auth, workspace } from '@/lib/buildbase'
 *
 *   export async function GET() {
 *     const session = await auth()
 *     if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
 *     const workspaces = await workspace.list()
 *     return Response.json({ workspaces })
 *   }
 *
 * ─── Sending notifications ────────────────────────────────────────────────────
 *
 *   import { notification } from '@/lib/buildbase'
 *
 *   await notification.send(workspaceId, 'comment_added', userId, {
 *     title: 'New Comment',
 *     message: 'Alice commented on your project',
 *     url: 'https://app.example.com/projects/123#comments',
 *   })
 *
 * ─── Background jobs / service accounts ──────────────────────────────────────
 *
 *   import BuildBase from '@buildbase/saas-sdk/server'
 *
 *   const bb = BuildBase({
 *     serverUrl: process.env.NEXT_PUBLIC_SAAS_SERVER_URL!,
 *     orgId:     process.env.NEXT_PUBLIC_SAAS_ORG_ID!,
 *   })
 *   const { usage } = bb.withSession(process.env.SERVICE_SESSION_ID!)
 *
 *   await usage.record(workspaceId, { quotaSlug: 'uploads', quantity: 1, source: 'cron' })
 *
 * ─── Factory config options ───────────────────────────────────────────────────
 *
 *   BuildBase({
 *     serverUrl,                 // required
 *     orgId,                     // required
 *     getSessionId,              // async () => string | null  (Next.js: read cookie)
 *     timeout: 30_000,           // request timeout ms (default: 30s)
 *     maxRetries: 2,             // retry on network errors / 5xx
 *     debug: true,               // log all API calls to console
 *     headers: { 'X-Source': 'cron' },  // custom headers on every request
 *     onError: (err, ctx) => {   // centralised error callback (Sentry etc.)
 *       Sentry.captureException(err, { extra: ctx })
 *     },
 *     fetch: customFetch,        // replace global fetch (testing, proxying)
 *   })
 *
 * NOTE: Available in @buildbase/sdk >= 0.0.36. Requires bumping the SDK version
 * and running yarn install before this module can be used.
 */
export { default } from "@buildbase/sdk";
