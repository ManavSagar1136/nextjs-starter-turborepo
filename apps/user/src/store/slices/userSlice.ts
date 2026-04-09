import { createSlice, PayloadAction } from "@buildbase/redux";

export interface UserState {
  id: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string | null; // APP_ROLE: "admin" | "user"
  sdkUserId: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  workspaceRole: string | null; // WORKSPACE_ROLE: "admin" | "editor" | "viewer"
}

const initialState: UserState = {
  id: null,
  email: null,
  name: null,
  image: null,
  role: null,
  sdkUserId: null,
  workspaceId: null,
  workspaceName: null,
  workspaceRole: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state: UserState, action: PayloadAction<Partial<UserState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    updateUser: (state: UserState, action: PayloadAction<Partial<UserState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    clearUser: (state: UserState) => {
      return initialState;
    },
  },
});

export const { setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
