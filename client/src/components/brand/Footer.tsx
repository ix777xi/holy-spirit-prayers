import { Link } from "wouter";
import { Mail, Instagram, Youtube, Facebook } from "lucide-react";
import { LogoMark } from "./Logo";

const CONTACT_EMAIL = "hello@holyspiritprayers.com";

export function Footer() {
  return (
    <footer
      className="mt-24 surface-hero-navy border-t border-brand-gold/30"
      data-testid="footer"
    >
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <span
              className="text-brand-cream font-semibold tracking-tight text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Holy Spirit Prayers
            </span>
          </div>
          <hr className="w-20 h-px bg-brand-gold border-0 opacity-70" />
          <nav
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm font-sans text-brand-cream/80"
            aria-label="Footer"
          >
            <Link href="/library" className="hover:text-brand-gold transition-colors" data-testid="footer-link-library">
              Prayer Library
            </Link>
            <Link href="/custom-prayer" className="hover:text-brand-gold transition-colors" data-testid="footer-link-custom">
              Request Prayer
            </Link>
            <Link href="/about" className="hover:text-brand-gold transition-colors" data-testid="footer-link-about">
              About
            </Link>
            <Link href="/contact" className="hover:text-brand-gold transition-colors" data-testid="footer-link-contact">
              Contact
            </Link>
            <Link href="/legal" className="hover:text-brand-gold transition-colors" data-testid="footer-link-legal">
              Legal
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <a
              href="#"
              aria-label="Instagram"
              className="p-2 rounded-full text-brand-cream/80 hover:text-brand-gold hover:bg-brand-cream/10 transition-colors"
              data-testid="footer-social-instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="p-2 rounded-full text-brand-cream/80 hover:text-brand-gold hover:bg-brand-cream/10 transition-colors"
              data-testid="footer-social-youtube"
            >
              <Youtube className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="p-2 rounded-full text-brand-cream/80 hover:text-brand-gold hover:bg-brand-cream/10 transition-colors"
              data-testid="footer-social-facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              aria-label="Email"
              className="p-2 rounded-full text-brand-cream/80 hover:text-brand-gold hover:bg-brand-cream/10 transition-colors"
              data-testid="footer-social-email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm font-sans text-brand-cream/70 hover:text-brand-gold transition-colors"
            data-testid="footer-contact-email"
          >
            {CONTACT_EMAIL}
          </a>

          <div className="text-xs font-sans text-brand-cream/55 text-center max-w-2xl">
            © {new Date().getFullYear()} Holy Spirit Prayers · Spirit-led prayers rooted in Scripture.
          </div>
        </div>
      </div>
    </footer>
  );
}
