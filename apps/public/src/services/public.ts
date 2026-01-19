import { BaseApiController } from "./base";
import type {
  ApiResponse,
  NewsletterSubscribeRequest,
  NewsletterUnsubscribeRequest,
  WaitlistSubscribeRequest,
  WaitlistUnsubscribeRequest,
} from "@/types/api";

export class PublicApi extends BaseApiController {
  protected urlPath: string = "/public";

  async subscribeToNewsletter(
    data: NewsletterSubscribeRequest,
  ): Promise<ApiResponse> {
    const result = await this.post<ApiResponse>(
      `${this.urlPath}/newsletter`,
      {},
      {},
      data,
    );
    return result.data;
  }

  async unsubscribeFromNewsletter(
    data: NewsletterUnsubscribeRequest,
  ): Promise<ApiResponse> {
    const result = await this.post<ApiResponse>(
      `${this.urlPath}/newsletter/unsubscribe`,
      {},
      {},
      data,
    );
    return result.data;
  }

  async subscribeToWaitlist(
    data: WaitlistSubscribeRequest,
  ): Promise<ApiResponse> {
    const result = await this.post<ApiResponse>(
      `${this.urlPath}/waitlist`,
      {},
      {},
      data,
    );
    return result.data;
  }

  async unsubscribeFromWaitlist(
    data: WaitlistUnsubscribeRequest,
  ): Promise<ApiResponse> {
    const result = await this.post<ApiResponse>(
      `${this.urlPath}/waitlist/unsubscribe`,
      {},
      {},
      data,
    );
    return result.data;
  }

  async getVersion(): Promise<ApiResponse<{ version: string }>> {
    const result = await this.get(
      `${this.urlPath}/version`,
      {},
      {},
    );
    return result.data as ApiResponse<{ version: string }>;
  }
}
