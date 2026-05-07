import { Link, useLocation } from "wouter";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useTheme, useAuth } from "@/lib/app-context";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Prayer Library" },
  { href: "/custom-prayer", label: "Request Prayer" },
];

export function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, serverUser, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-gold/30 bg-[hsl(var(--background))]/92 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/80">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-20 md:h-24 flex items-center justify-between gap-4">
        <Link href="/" className="hover-elevate rounded-md px-2 py-2 -mx-2" data-testid="link-home">
          <Logo size="sm" orientation="horizontal" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-auto" aria-label="Primary">
          {NAV_LINKS.map((l) => {
            const active = location === l.href || (l.href !== "/" && location.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                data-testid={`link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                  active
                    ? "text-brand-gold"
                    : "text-foreground hover:text-brand-gold"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:ml-4">
          <button
            onClick={toggle}
            data-testid="button-theme-toggle"
            aria-label="Toggle theme"
            className="hover-elevate rounded-md p-2 text-foreground/80"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user || serverUser ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/account">
                <Button variant="outline" size="sm" data-testid="button-account" className="border-brand-gold/60 text-foreground hover:bg-brand-gold hover:text-white hover:border-brand-gold">
                  Account
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} data-testid="button-signout">Sign out</Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-login"
                  className="border-brand-gold/60 text-foreground hover:bg-brand-gold hover:text-white hover:border-brand-gold font-medium"
                >
                  Login
                </Button>
              </Link>
            </div>
          )}

          <button
            className="md:hidden rounded-md p-2 text-foreground hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
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
        <div className="md:hidden border-t border-brand-gold/20 bg-[hsl(var(--background))]">
          <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
                data-testid={`link-mobile-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-brand-gold/20 my-2" />
            {user || serverUser ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm hover-elevate font-medium" data-testid="link-mobile-account">
                  Account
                </Link>
                <button onClick={() => { signOut(); setOpen(false); }} className="text-left px-3 py-2 rounded-md text-sm hover-elevate font-medium">Sign out</button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                data-testid="link-mobile-login"
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
