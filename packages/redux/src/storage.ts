"use client";

// Dynamic import for redux-persist storage (SSR safe)
let createWebStorage: any;

if (typeof window !== "undefined") {
  // Only import on client side
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  createWebStorage = require("redux-persist/lib/storage/createWebStorage").default;
}

// Create a noop storage for SSR (Next.js server-side rendering)
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use localStorage if available (client-side), otherwise use noop storage (SSR)
// This prevents "redux-persist failed to create sync storage" errors in Next.js
const storage = typeof window !== "undefined" && createWebStorage ? createWebStorage("local") : createNoopStorage();

export default storage;
