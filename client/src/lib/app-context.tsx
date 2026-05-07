import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";

// ========== THEME ==========
type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; toggle: () => void };
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
  }, [theme]);
  const value = useMemo(() => ({
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme outside ThemeProvider");
  return v;
}

// ========== AUTH ==========
// `serverUser` is the authoritative server-session identity (email + password).
// `user` mirrors it for legacy admin views, with a derived role.
type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};
type ServerUser = {
  id: number;
  email: string | null;
  name: string | null;
  pictureUrl: string | null;
  username: string;
};
type AuthContextValue = {
  user: AuthUser | null;
  serverUser: ServerUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  refreshServerUser: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function deriveRole(email: string | null | undefined): "user" | "admin" {
  return (email || "").toLowerCase().startsWith("admin") ? "admin" : "user";
}

function toAuthUser(srv: ServerUser): AuthUser {
  return {
    id: `srv-${srv.id}`,
    name: srv.name || srv.email || "Friend",
    email: srv.email || "",
    role: deriveRole(srv.email),
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    if (json && typeof json.error === "string") return json.error;
  } catch {}
  return `${res.status} ${res.statusText}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [serverUser, setServerUser] = useState<ServerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applyServerUser = useCallback((srv: ServerUser | null) => {
    setServerUser(srv);
    setUser(srv ? toAuthUser(srv) : null);
  }, []);

  const refreshServerUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        applyServerUser(null);
        return;
      }
      const json = (await res.json()) as { ok: boolean; user: ServerUser | null };
      applyServerUser(json.user);
    } catch {
      applyServerUser(null);
    }
  }, [applyServerUser]);

  useEffect(() => {
    refreshServerUser().finally(() => setLoading(false));
  }, [refreshServerUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const json = (await res.json()) as { ok: boolean; user: ServerUser };
    applyServerUser(json.user);
  }, [applyServerUser]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const json = (await res.json()) as { ok: boolean; user: ServerUser };
    applyServerUser(json.user);
  }, [applyServerUser]);

  const signOut = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    applyServerUser(null);
  }, [applyServerUser]);

  const value = useMemo(
    () => ({ user, serverUser, loading, signIn, signOut, signUp, refreshServerUser }),
    [user, serverUser, loading, signIn, signOut, signUp, refreshServerUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
