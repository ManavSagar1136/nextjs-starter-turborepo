import { useDispatch, useSelector, TypedUseSelectorHook, useStore } from "react-redux";
import type { RootState, AppDispatch, AppStore } from "./store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = () => useStore<AppStore>();

// Re-export types for convenience
export type { RootState, AppDispatch, AppStore };
