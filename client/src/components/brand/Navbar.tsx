import { Link, useLocation } from "wouter";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useTheme, useAuth } from "@/lib/app-context";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/library", label: "Library" },
  { href: "/custom-prayer", label: "Custom Prayer" },
  { href: "/free-prayer", label: "Free Prayer" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/82">
      <div className="mx-auto max-w-7xl px-4 md:px-6 min-h-24 flex items-center justify-between gap-4">
        <Link href="/" className="hover-elevate rounded-md px-2 py-2 -mx-2" data-testid="link-home">
          <Logo size="sm" orientation="stacked" />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV_LINKS.map((l) => {
            const active = location === l.href || (l.href !== "/" && location.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                data-testid={`link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`px-3 py-2 rounded-md text-sm hover-elevate font-medium ${
                  active ? "text-foreground bg-accent" : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            data-testid="button-theme-toggle"
            aria-label="Toggle theme"
            className="hover-elevate rounded-md p-2 text-foreground/80"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                <Button variant="outline" size="sm" data-testid="button-dashboard">{user.role === "admin" ? "Admin" : "Dashboard"}</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} data-testid="button-signout">Sign out</Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm" data-testid="button-login">Log in</Button></Link>
              <Link href="/register">
                <Button size="sm" className="bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold" data-testid="button-register">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          <button
            className="md:hidden hover-elevate rounded-md p-2 text-foreground/80"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            data-testid="button-menu-toggle"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="md:hidden border-t border-border/60 bg-background">
          <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm hover-elevate font-medium"
                data-testid={`link-mobile-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            {user ? (
              <>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm hover-elevate font-medium">
                  {user.role === "admin" ? "Admin" : "Dashboard"}
                </Link>
                <button onClick={() => { signOut(); setOpen(false); }} className="text-left px-3 py-2 rounded-md text-sm hover-elevate font-medium">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm hover-elevate font-medium">Log in</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm hover-elevate font-semibold bg-brand-gold text-white">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
