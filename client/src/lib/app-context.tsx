import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, ReactNode } from "react";
import { Prayer, demoUser } from "./data";

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
// `user` mirrors it for legacy dashboard/admin views, with a derived role.
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
  // demo only — toggles between user & admin
  switchRole: (role: "user" | "admin") => void;
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

  const switchRole = useCallback((role: "user" | "admin") => {
    setUser((u) => (u ? { ...u, role } : { id: role === "admin" ? "u11" : "u-demo", name: role === "admin" ? "Admin" : demoUser.name, email: role === "admin" ? "admin@holyspiritprayers.com" : demoUser.email, role }));
  }, []);

  const value = useMemo(
    () => ({ user, serverUser, loading, signIn, signOut, signUp, switchRole, refreshServerUser }),
    [user, serverUser, loading, signIn, signOut, signUp, switchRole, refreshServerUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

// ========== AUDIO PLAYER (global persistent mini-player) ==========
type PlayerState = {
  prayer: Prayer | null;
  isPlaying: boolean;
  position: number; // simulated seconds
  // Tracks which prayers have been "unlocked" for download (post-purchase or free-prayer email gate)
  unlocked: Set<string>;
  ownedSlugs: Set<string>;
  favorites: Set<string>;
};
type PlayerContextValue = PlayerState & {
  play: (prayer: Prayer) => void;
  toggle: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  close: () => void;
  unlockDownload: (slug: string) => void;
  purchase: (slug: string) => void;
  toggleFavorite: (slug: string) => void;
  isOwned: (slug: string) => boolean;
  isFavorite: (slug: string) => boolean;
};
const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [ownedSlugs, setOwnedSlugs] = useState<Set<string>>(() => new Set(demoUser.owned));
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(demoUser.favorites));

  const tickRef = useRef<number | null>(null);
  // Simulated playback timer (no real audio file in this prototype)
  useEffect(() => {
    if (!isPlaying || !prayer) return;
    tickRef.current = window.setInterval(() => {
      setPosition((p) => {
        const next = p + 1;
        if (next >= prayer.durationSeconds) {
          setIsPlaying(false);
          return prayer.durationSeconds;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [isPlaying, prayer]);

  const play = useCallback((next: Prayer) => {
    setPrayer((cur) => {
      if (!cur || cur.id !== next.id) {
        setPosition(0);
      }
      return next;
    });
    setIsPlaying(true);
  }, []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const seek = useCallback((s: number) => setPosition(Math.max(0, s)), []);
  const close = useCallback(() => { setPrayer(null); setIsPlaying(false); setPosition(0); }, []);

  const unlockDownload = useCallback((slug: string) => {
    setUnlocked((set) => new Set(set).add(slug));
  }, []);
  const purchase = useCallback((slug: string) => {
    setOwnedSlugs((set) => new Set(set).add(slug));
    setUnlocked((set) => new Set(set).add(slug));
  }, []);
  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((set) => {
      const next = new Set(set);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);
  const isOwned = useCallback((slug: string) => ownedSlugs.has(slug), [ownedSlugs]);
  const isFavorite = useCallback((slug: string) => favorites.has(slug), [favorites]);

  const value = useMemo<PlayerContextValue>(() => ({
    prayer, isPlaying, position, unlocked, ownedSlugs, favorites,
    play, toggle, pause, seek, close, unlockDownload, purchase, toggleFavorite, isOwned, isFavorite,
  }), [prayer, isPlaying, position, unlocked, ownedSlugs, favorites, play, toggle, pause, seek, close, unlockDownload, purchase, toggleFavorite, isOwned, isFavorite]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const v = useContext(PlayerContext);
  if (!v) throw new Error("usePlayer outside PlayerProvider");
  return v;
}
