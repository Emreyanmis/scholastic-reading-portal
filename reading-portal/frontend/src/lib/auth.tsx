import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { ApiError, api, COLD_START_TIMEOUT_MS, UserDto, wakeBackend } from "./api";

const USER_HINT_KEY = "rp_user_hint";
const SESSION_OPTS = { timeoutMs: COLD_START_TIMEOUT_MS, retries: 2 } as const;

function readUserHint(): UserDto | null {
  try {
    const raw = sessionStorage.getItem(USER_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserDto;
    if (parsed?.id && parsed?.email && parsed?.role) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function writeUserHint(user: UserDto | null) {
  try {
    if (user) sessionStorage.setItem(USER_HINT_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_HINT_KEY);
  } catch {
    /* private mode / quota */
  }
}

type AuthState = {
  user: UserDto | null;
  sessionChecked: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserDto>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(() => readUserHint());
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get<UserDto>("/api/auth/me", SESSION_OPTS);
        if (!cancelled) {
          setUser(me);
          writeUserHint(me);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) {
            setUser(null);
            writeUserHint(null);
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
    writeUserHint(u);
    setSessionChecked(true);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
    writeUserHint(null);
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
