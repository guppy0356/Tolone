import { useSyncExternalStore } from "react";
import { isAuthenticated, subscribeAuth } from "./auth-cookie";

export interface Auth {
  isLoggedIn: boolean;
}

export function useAuth(): Auth {
  const isLoggedIn = useSyncExternalStore(
    subscribeAuth,
    isAuthenticated,
    () => false,
  );
  return { isLoggedIn };
}
