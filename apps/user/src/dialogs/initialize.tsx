"use client";

/**
 * Client-side dialog initialization component
 * This component initializes dialogs when the app loads on the client
 */
import { useEffect } from "react";
import { setupUserDialogs } from "./setup";

export function InitializeDialogs() {
  useEffect(() => {
    setupUserDialogs();
  }, []);

  return null;
}
