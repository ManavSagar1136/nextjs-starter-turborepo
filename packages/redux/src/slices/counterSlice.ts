import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CounterState {
  value: number;
  history: number[];
}

const initialState: CounterState = {
  value: 0,
  history: [],
};

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state: CounterState) => {
      state.value += 1;
      state.history.push(state.value);
    },
    decrement: (state: CounterState) => {
      state.value -= 1;
      state.history.push(state.value);
    },
    incrementByAmount: (state: CounterState, action: PayloadAction<number>) => {
      state.value += action.payload;
      state.history.push(state.value);
    },
    reset: (state: CounterState) => {
      state.value = 0;
      state.history = [];
    },
    clearHistory: (state: CounterState) => {
      state.history = [];
    },
  },
});

export const { increment, decrement, incrementByAmount, reset, clearHistory } = counterSlice.actions;
export default counterSlice.reducer;
