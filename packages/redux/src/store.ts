import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "./storage";

// Import default slices
import counterSlice from "./slices/counterSlice";

// Persist configuration
// Apps can override this by passing their own persistConfig
export interface PersistConfig {
  key: string;
  whitelist?: string[];
  blacklist?: string[];
}

const defaultPersistConfig = {
  key: "cms-redux",
  storage,
  whitelist: ["counter"], // Only persist counter reducer by default
};

// Root reducer type - apps can extend this
export interface RootReducer {
  counter: ReturnType<typeof counterSlice>;
}

// Default root reducer
const defaultRootReducer = combineReducers({
  counter: counterSlice,
}) as any;

// Create store factory function
// Apps can pass their own reducers and persist config
export const createStore = (additionalReducers?: Record<string, any>, persistConfig?: PersistConfig) => {
  // Combine default reducers with additional reducers
  const rootReducer = additionalReducers
    ? combineReducers({
        ...defaultRootReducer,
        ...additionalReducers,
      })
    : defaultRootReducer;

  // Use provided persist config or default
  const finalPersistConfig: any = persistConfig
    ? {
        ...defaultPersistConfig,
        ...persistConfig,
        storage,
      }
    : defaultPersistConfig;

  // Persisted reducer
  const persistedReducer = persistReducer(finalPersistConfig, rootReducer);

  // Configure store
  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            "persist/PERSIST",
            "persist/REHYDRATE",
            "persist/PAUSE",
            "persist/PURGE",
            "persist/REGISTER",
          ],
          ignoredPaths: ["_persist"],
        },
      }),
    devTools: process.env.NODE_ENV !== "production",
  });

  return store;
};

// Default store instance
export const store = createStore();
export const makeStore = () => store;

// Persistor - cast to any to avoid type issues with redux-persist
export const persistor = persistStore(store as any);

// Types
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = AppStore["dispatch"];
