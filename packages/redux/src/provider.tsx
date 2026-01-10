"use client";

import React, { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { persistor, makeStore, AppStore, createStore, PersistConfig } from "./store";
import type { Store } from "@reduxjs/toolkit";

interface ReduxProviderProps {
  children: React.ReactNode;
  /**
   * Additional reducers to add to the store
   * Example: { user: userReducer, cart: cartReducer }
   */
  additionalReducers?: Record<string, any>;
  /**
   * Custom persist configuration
   * If not provided, uses default configuration
   */
  persistConfig?: PersistConfig;
  /**
   * Custom store instance
   * If provided, uses this store instead of creating a new one
   */
  store?: Store;
}

export function ReduxProvider({
  children,
  additionalReducers,
  persistConfig,
  store: providedStore,
}: ReduxProviderProps) {
  const storeRef = useRef<AppStore | Store | undefined>(undefined);
  const persistorRef = useRef<any>(undefined);

  if (!storeRef.current) {
    // Use provided store or create a new one
    if (providedStore) {
      storeRef.current = providedStore;
    } else if (additionalReducers || persistConfig) {
      // Create store with custom reducers/config
      storeRef.current = createStore(additionalReducers, persistConfig);
      // Create persistor for the custom store
      persistorRef.current = persistStore(storeRef.current as any);
    } else {
      // Use default store
      storeRef.current = makeStore();
      persistorRef.current = persistor;
    }
  }

  const store = storeRef.current;
  // Use custom persistor if created, otherwise use default persistor (or undefined for provided store)
  const finalPersistor = providedStore ? undefined : persistorRef.current || persistor;

  return (
    <Provider store={store as any}>
      {finalPersistor ? (
        <PersistGate loading={null} persistor={finalPersistor}>
          {children}
        </PersistGate>
      ) : (
        children
      )}
    </Provider>
  );
}
