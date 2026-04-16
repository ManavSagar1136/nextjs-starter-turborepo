/**
 * Shared session-less BuildBase factory for server-side use.
 *
 * Imported by route-handlers.ts and re-exported via @buildbase/saas-sdk/server so that
 * server middleware in @buildbase/helpers (e.g. withQuotaCheck) can use the same instance.
 *
 * Usage:
 *   import { bb } from "@buildbase/saas-sdk/server"
 *   const client = bb.withSession(sessionId)
 *
 * This module is SERVER-ONLY. Never import it in client components.
 * It is intentionally not re-exported from the main "@buildbase/saas-sdk" barrel.
 */
import { BuildBase } from "@buildbase/sdk";
import { env } from "@buildbase/env";

/**
 * Lazy singleton — created on first use, not at module load time.
 *
 * Mirrors the same env-reading pattern as SaaSProvider (packages/sass-sdk/src/provider/SaaSProvider.tsx):
 *   - Reads from @buildbase/env (centralised validated env, same source as the client provider)
 *   - Logs a warning if vars are missing rather than throwing, so a misconfigured env
 *     produces a clear console message instead of a cryptic 500 at the call site.
 */
let _bb: ReturnType<typeof BuildBase> | null = null;

export function getBB(): ReturnType<typeof BuildBase> {
  if (!_bb) {
    const serverUrl = env.NEXT_PUBLIC_SAAS_SERVER_URL;
    const orgId = env.NEXT_PUBLIC_SAAS_ORG_ID;

    if (!serverUrl || !orgId) {
      console.error("[bb] Missing required environment variables:", {
        NEXT_PUBLIC_SAAS_SERVER_URL: !!serverUrl,
        NEXT_PUBLIC_SAAS_ORG_ID: !!orgId,
      });
    }

    _bb = BuildBase({
      serverUrl: serverUrl ?? "",
      orgId: orgId ?? "",
    });
  }
  return _bb;
}

/**
 * Convenience proxy — allows callers to write `bb.withSession(...)` instead of `getBB().withSession(...)`.
 * All property accesses are forwarded to the lazily-created instance.
 */
export const bb = new Proxy({} as ReturnType<typeof BuildBase>, {
  get(_target, prop) {
    return (getBB() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
