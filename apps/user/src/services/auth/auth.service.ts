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

export interface ISessionResponse {
  authenticated: boolean;
  message?: string;
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export class AuthApis extends BaseApiPaginationController<IAuth> {
  protected urlPath: string = "/auth";

  /**
   * Check current session status by validating the HTTP-only cookie
   * Used to verify if server recognizes the session before trusting client-side auth state
   * @returns Session status with authenticated flag
   */
  async getSession(): Promise<ISessionResponse> {
    try {
      const response = await this.get(`${this.urlPath}/session`, {}, {});
      return response.data as ISessionResponse;
    } catch (error: any) {
      // Return not authenticated for 401 errors
      if (error?.response?.status === 401) {
        return { authenticated: false, message: "No valid session" };
      }
      throw error;
    }
  }

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

  /**
   * Change workspace - called when user switches workspaces via SDK's WorkspaceSwitcher
   * @param workspace - Workspace object from SDK
   * @param user - User object from SDK
   * @param role - User's role in the workspace
   * @returns Response with updated token
   */
  async changeWorkspace(workspace: any, user: any, role: string): Promise<IWorkspaceEventResponse> {
    return (
      await this.post<IWorkspaceEventResponse>(`${this.urlPath}/workspace-change`, {}, {}, { workspace, user, role })
    ).data;
  }
}
