import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { ApiError, api, UserDto } from "./api";

const USER_HINT_KEY = "rp_user_hint";

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
  /** False until the initial /api/auth/me round-trip finishes (or times out). */
  sessionChecked: boolean;
  /** @deprecated Use sessionChecked — kept for existing call sites. */
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
        const me = await api.get<UserDto>("/api/auth/me", { timeoutMs: 8_000 });
        if (!cancelled) {
          setUser(me);
          writeUserHint(me);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) {
            setUser(null);
            writeUserHint(null);
          } else {
            // Timeout / cold start — don't block the UI; keep cached hint if any.
            console.warn("Session check failed:", e);
          }
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
    const u = await api.post<UserDto>("/api/auth/login", { email, password });
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
