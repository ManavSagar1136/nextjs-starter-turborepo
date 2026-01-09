import { BaseApiPaginationController } from "../base";

export interface IAuthUser {
  id: string;
  _id?: string;
  email?: string;
  name?: string;
  image?: string;
  role?: string;
  workspaceId?: string;
  currentWorkspaceId?: string;
  workspaceName?: string;
  [key: string]: unknown;
}

export interface IAuth {
  token?: string;
  success?: boolean;
  valid?: boolean;
  user?: IAuthUser;
  error?: string;
  message?: string;
  sessionId?: string;
}

export interface IVerifyResponse {
  success: boolean;
  message: string;
  sessionId: string;
  user: IAuthUser;
  workspaces?: {
    synced: number;
    total: number;
  };
}

export class AuthApis extends BaseApiPaginationController<IAuth> {
  protected urlPath: string = "/auth";

  /**
   * Verify authentication code and create session
   * @param code - Authentication code from SDK
   * @returns Verification response with sessionId and user data
   */
  async verify(code: string): Promise<IVerifyResponse> {
    return (await this.post<IVerifyResponse>(`${this.urlPath}/verify`, {}, {}, { code })).data;
  }

  /**
   * Logout user and clear authentication cookie
   * @returns Success response
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    return (await this.post<{ success: boolean; message: string }>(`${this.urlPath}/logout`, {}, {}, {})).data;
  }
}
