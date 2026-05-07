/**
 * Cookie consent state, persisted in a first-party `hsp_consent` cookie.
 *
 * Uses document.cookie rather than localStorage so the value is part of HTTP
 * requests if we ever need server-side personalization, and so it survives
 * sandboxed contexts that block storage but allow cookies. All access is
 * wrapped in try/catch so a hostile environment cannot crash the app.
 */
export type ConsentCategories = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = ConsentCategories & {
  /** ISO timestamp of the most recent decision. */
  decidedAt: string;
};

const COOKIE_NAME = "hsp_consent";
const COOKIE_MAX_AGE_DAYS = 365;
const PREF_EVENT = "hsp:open-cookie-preferences";
const CHANGE_EVENT = "hsp:consent-changed";

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeReadCookie(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = document.cookie || "";
    const parts = raw.split(";");
    for (const part of parts) {
      const [k, ...rest] = part.trim().split("=");
      if (k === COOKIE_NAME) return decodeURIComponent(rest.join("="));
    }
  } catch {
    // ignore
  }
  return null;
}

function safeWriteCookie(value: string) {
  if (!isBrowser()) return;
  try {
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    // ignore
  }
}

export function readConsent(): ConsentRecord | null {
  const raw = safeReadCookie();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(categories: Omit<ConsentCategories, "essential"> & { essential?: true }): ConsentRecord {
  const record: ConsentRecord = {
    essential: true,
    analytics: !!categories.analytics,
    marketing: !!categories.marketing,
    decidedAt: new Date().toISOString(),
  };
  safeWriteCookie(JSON.stringify(record));
  if (isBrowser()) {
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: record }));
    } catch {
      // ignore
    }
  }
  return record;
}

export function acceptAll() {
  return writeConsent({ analytics: true, marketing: true });
}

export function rejectNonEssential() {
  return writeConsent({ analytics: false, marketing: false });
}

export function hasDecided(): boolean {
  return readConsent() !== null;
}

/** Open the cookie preferences modal from anywhere in the app. */
export function openCookiePreferences() {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(new CustomEvent(PREF_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeToPreferencesOpen(handler: () => void): () => void {
  if (!isBrowser()) return () => {};
  const fn = () => handler();
  window.addEventListener(PREF_EVENT, fn as EventListener);
  return () => window.removeEventListener(PREF_EVENT, fn as EventListener);
}

export function subscribeToConsentChange(
  handler: (record: ConsentRecord) => void,
): () => void {
  if (!isBrowser()) return () => {};
  const fn = (e: Event) => {
    const detail = (e as CustomEvent<ConsentRecord>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(CHANGE_EVENT, fn as EventListener);
  return () => window.removeEventListener(CHANGE_EVENT, fn as EventListener);
}
