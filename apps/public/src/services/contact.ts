import { BaseApiController } from "./base";
import type { ApiResponse, ContactFormRequest } from "@/types/api";

export class ContactApi extends BaseApiController {
  protected urlPath: string = "/public/email";

  async sendContactUsEmail(data: ContactFormRequest): Promise<ApiResponse> {
    const result = await this.post<ApiResponse>(this.urlPath, {}, {}, data);
    return result.data;
  }
}
