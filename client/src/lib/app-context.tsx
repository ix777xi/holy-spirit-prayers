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

// ========== AUTH (demo, in-memory) ==========
type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};
type AuthContextValue = {
  user: AuthUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
  signUp: (name: string, email: string) => void;
  // demo only — toggles between user & admin
  switchRole: (role: "user" | "admin") => void;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const signIn = useCallback((email: string) => {
    const role = email.toLowerCase().startsWith("admin") ? "admin" : "user";
    setUser({
      id: role === "admin" ? "u11" : "u-demo",
      name: role === "admin" ? "Admin" : demoUser.name,
      email,
      role,
    });
  }, []);
  const signUp = useCallback((name: string, email: string) => {
    setUser({ id: "u-new", name, email, role: "user" });
  }, []);
  const signOut = useCallback(() => setUser(null), []);
  const switchRole = useCallback((role: "user" | "admin") => {
    setUser((u) => (u ? { ...u, role } : { id: role === "admin" ? "u11" : "u-demo", name: role === "admin" ? "Admin" : demoUser.name, email: role === "admin" ? "admin@holyspiritprayers.com" : demoUser.email, role }));
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut, signUp, switchRole }), [user, signIn, signOut, signUp, switchRole]);
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
