/**
 * Re-export commonly used Redux Toolkit functions and types
 * This allows apps to import from @buildbase/redux instead of @reduxjs/toolkit directly
 */

// Core Redux Toolkit functions
export {
  configureStore,
  createSlice,
  createAsyncThunk,
  createAction,
  createReducer,
  combineReducers,
  createSelector,
  createEntityAdapter,
  isAllOf,
  isAnyOf,
  isFulfilled,
  isPending,
  isRejected,
  isRejectedWithValue,
  unwrapResult,
  miniSerializeError,
} from "@reduxjs/toolkit";

// Redux Toolkit types
export type {
  PayloadAction,
  AsyncThunk,
  AsyncThunkAction,
  AsyncThunkOptions,
  AsyncThunkPayloadCreator,
  CaseReducer,
  CaseReducers,
  Slice,
  SliceCaseReducers,
  ValidateSliceCaseReducers,
  ActionCreatorWithPayload,
  ActionCreatorWithoutPayload,
  ActionCreatorWithPreparedPayload,
  ActionCreatorWithNonInferrablePayload,
  ActionReducerMapBuilder,
  Draft,
  EntityAdapter,
  EntityId,
  EntityState,
  IdSelector,
  Comparer,
  Update,
  EntitySelectors,
  SerializedError,
  PrepareAction,
  Reducer,
  ReducersMapObject,
  StateFromReducersMapObject,
  ActionFromReducersMapObject,
  ThunkAction,
  ThunkDispatch,
  UnknownAction,
  AnyAction,
  Store,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  Dispatch,
  Middleware,
  MiddlewareAPI,
  ConfigureStoreOptions,
  EnhancedStore,
  ImmutableStateInvariantMiddlewareOptions,
  SerializableStateInvariantMiddlewareOptions,
  ActionCreatorWithOptionalPayload,
} from "@reduxjs/toolkit";

// Re-export our own exports
export * from "./provider";
export * from "./hooks";
export * from "./store";
export * from "./storage";
export * from "./slices/counterSlice";
