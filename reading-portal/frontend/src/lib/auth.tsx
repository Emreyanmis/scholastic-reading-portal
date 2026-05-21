import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { ApiError, api, SESSION_OPTS, UserDto, wakeBackend } from "./api";

type AuthState = {
  user: UserDto | null;
  sessionChecked: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserDto>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Older builds cached a user hint. Clear it so we never show a logged-in
    // shell unless the backend has verified the cookie.
    try {
      sessionStorage.removeItem("rp_user_hint");
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await api.get<UserDto>("/api/auth/me", SESSION_OPTS);
        if (!cancelled) {
          setUser(me);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) {
            setUser(null);
          }
          // Timeouts / cold start: stay on login, no UI error (background check only).
        }
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await wakeBackend();
    const u = await api.post<UserDto>(
      "/api/auth/login",
      { email, password },
      SESSION_OPTS
    );
    setUser(u);
    setSessionChecked(true);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
    setSessionChecked(true);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        sessionChecked,
        loading: !sessionChecked,
        login,
        logout,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
