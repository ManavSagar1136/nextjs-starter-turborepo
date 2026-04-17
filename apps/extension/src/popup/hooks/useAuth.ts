import { useState, useEffect, useCallback } from "react";
import type { ExtMessage, ExtResponse, ExtSession } from "../../types/messages";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

function sendMessage(msg: ExtMessage): Promise<ExtResponse> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(msg, (response: ExtResponse) => {
      resolve(response ?? { type: "ERROR", error: "No response from background" });
    });
  });
}

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<ExtSession | null>(null);
  const [waitingForLogin, setWaitingForLogin] = useState(false);

  const checkSession = useCallback(async () => {
    setStatus("loading");
    const res = await sendMessage({ type: "GET_SESSION" });
    if (res.type === "SESSION_RESULT" && res.data.authenticated) {
      setSession(res.data);
      setStatus("authenticated");
      setWaitingForLogin(false);
    } else {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkSession();

    const onMessage = (msg: { type: string }) => {
      if (msg.type === "AUTH_DETECTED") {
        setWaitingForLogin(false);
        checkSession();
      }
      // Auth tab closed before login, or web app logout detected
      if (msg.type === "AUTH_CANCELLED") {
        setWaitingForLogin(false);
        setSession(null);
        setStatus("unauthenticated");
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [checkSession]);

  const login = useCallback(async () => {
    setWaitingForLogin(true);
    await sendMessage({ type: "OPEN_AUTH" });
  }, []);

  const cancelLogin = useCallback(async () => {
    await sendMessage({ type: "CANCEL_AUTH" });
    setWaitingForLogin(false);
  }, []);

  const logout = useCallback(async () => {
    await sendMessage({ type: "LOGOUT" });
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return { status, session, login, cancelLogin, waitingForLogin, logout, refresh: checkSession };
}

export { sendMessage };
