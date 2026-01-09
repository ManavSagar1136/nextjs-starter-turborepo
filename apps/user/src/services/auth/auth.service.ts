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

export interface IWorkspaceEventPayload {
  eventType: string;
  workspace?: unknown;
  previousWorkspace?: unknown;
  userId?: string;
  role?: string;
  previousRole?: string;
  newRole?: string;
}

export interface IWorkspaceEventResponse {
  success: boolean;
  message?: string;
  workspace?: unknown;
  membership?: unknown;
  user?: unknown;
  error?: string;
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

  /**
   * Handle workspace events (created, changed, updated, deleted, user-added, user-removed, user-role-changed)
   * @param payload - Workspace event payload
   * @returns Event handling response
   */
  async handleWorkspaceEvent(payload: IWorkspaceEventPayload): Promise<IWorkspaceEventResponse> {
    return (await this.post<IWorkspaceEventResponse>(`${this.urlPath}/workspace-event`, {}, {}, payload)).data;
  }
}
