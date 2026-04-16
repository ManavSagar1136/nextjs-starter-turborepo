/**
 * Quota Usage — shared type definitions.
 *
 * These types are used by the server-side proxy hooks in hooks/useUsage.ts.
 * The actual API calls go through BuildBase().withSession().usage.* (see bb.ts).
 */

// ─── Record Usage ─────────────────────────────────────────────────────────────

export interface RecordUsageResponse {
  success: boolean;
  /** Units consumed in this call */
  used?: number;
  /** Total consumed this period */
  consumed?: number;
  /** Units included in the plan */
  included?: number;
  /** Units still available (0 when overage starts) */
  available?: number;
  /** Units billed as overage */
  overage?: number;
  /** Whether billing is processed asynchronously */
  billedAsync?: boolean;
  message?: string;
}

// ─── Single Quota Status ──────────────────────────────────────────────────────

export interface QuotaStatus {
  quotaSlug: string;
  consumed: number;
  included: number;
  available: number;
  overage: number;
  hasOverage: boolean;
}

// ─── All Quotas ───────────────────────────────────────────────────────────────

export type QuotaMap = Record<string, QuotaStatus>;

// ─── Batch Record Usage ───────────────────────────────────────────────────────

export interface BatchRecordUsageResponse {
  success: boolean;
  total?: number;
  succeeded?: number;
  failed?: number;
  results?: Array<{
    success: boolean;
    error?: string;
    used?: number;
    consumed?: number;
    included?: number;
    available?: number;
    overage?: number;
  }>;
  message?: string;
}

// ─── Usage Logs ───────────────────────────────────────────────────────────────

export interface UsageLogEntry {
  _id: string;
  quotaSlug: string;
  quantity: number;
  source?: string;
  createdAt: string;
}
