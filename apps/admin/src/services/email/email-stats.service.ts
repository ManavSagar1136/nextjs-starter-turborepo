import { BaseApiController } from "../base";

export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  queued: number;
  tracking: {
    opens: number;
    clicks: number;
  };
}

export interface EmailStatsOptions {
  workspaceId?: string;
  fromDate?: string;
  toDate?: string;
  period?: "today" | "week" | "month" | "year";
}

export class EmailStatsApis extends BaseApiController {
  protected urlPath: string = "/email/stats";

  /**
   * Get email statistics
   * @param options - Query options (workspaceId, fromDate, toDate, period)
   */
  async getStats(options?: EmailStatsOptions): Promise<EmailStats> {
    const params = options || {};
    return (await this.get(this.urlPath, params)).data;
  }
}
