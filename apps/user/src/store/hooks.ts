import { useAppDispatch, useAppSelector } from "@buildbase/redux/hooks";
import type { UserState } from "./slices/userSlice";

// Extended RootState that includes user slice
export interface RootState {
  counter: any; // From @buildbase/redux default store
  user: UserState;
}

// User selectors
export const useUser = () => useAppSelector((state: any) => state.user as UserState);

// User actions
export { useAppDispatch };
export { setUser, updateUser, clearUser } from "./index";
