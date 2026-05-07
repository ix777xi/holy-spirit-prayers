import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  acceptAll,
  hasDecided,
  readConsent,
  rejectNonEssential,
  subscribeToPreferencesOpen,
  writeConsent,
} from "@/lib/cookie-consent";

export function CookieConsent() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Initial decision state — show banner only if undecided.
  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setBannerVisible(true);
    } else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
  }, []);

  // Allow other components to open the preferences modal.
  useEffect(() => {
    const unsubscribe = subscribeToPreferencesOpen(() => {
      const existing = readConsent();
      if (existing) {
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
      }
      setPrefsOpen(true);
    });
    return unsubscribe;
  }, []);

  const handleAcceptAll = () => {
    acceptAll();
    setBannerVisible(false);
    setPrefsOpen(false);
  };

  const handleRejectAll = () => {
    rejectNonEssential();
    setBannerVisible(false);
    setPrefsOpen(false);
  };

  const handleSavePrefs = () => {
    writeConsent({ analytics, marketing });
    setBannerVisible(false);
    setPrefsOpen(false);
  };

  const openPreferences = () => {
    const existing = readConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
    setPrefsOpen(true);
  };

  return (
    <>
      {bannerVisible && !prefsOpen ? (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 sm:pb-6"
          data-testid="cookie-consent-banner"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-brand-gold/40 bg-card/95 backdrop-blur shadow-xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="text-sm text-foreground/90 leading-relaxed">
                <h2 className="font-serif text-lg font-semibold mb-1">
                  We use cookies to keep this sanctuary running
                </h2>
                <p>
                  We only set essential cookies by default. You may allow optional analytics or marketing
                  cookies to help us improve. Read our{" "}
                  <Link
                    href="/legal/cookies"
                    className="underline font-semibold"
                    data-testid="cookie-banner-link-policy"
                  >
                    Cookie Policy
                  </Link>{" "}
                  or visit{" "}
                  <Link
                    href="/privacy-choices"
                    className="underline font-semibold"
                    data-testid="cookie-banner-link-privacy-choices"
                  >
                    Privacy Choices
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={openPreferences}
                data-testid="cookie-banner-manage"
              >
                Manage preferences
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRejectAll}
                data-testid="cookie-banner-reject"
              >
                Reject non-essential
              </Button>
              <Button
                type="button"
                onClick={handleAcceptAll}
                className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
                data-testid="cookie-banner-accept"
              >
                Accept all
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="cookie-preferences-modal">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Choose which categories of cookies we may set. Essential cookies are always on because the site
              cannot work without them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <PreferenceRow
              testid="cookie-pref-essential"
              title="Essential"
              description="Required for login, checkout, and remembering your cookie choices."
              checked
              disabled
              onChange={() => undefined}
            />
            <PreferenceRow
              testid="cookie-pref-analytics"
              title="Analytics"
              description="Aggregate usage statistics that help us improve the site. None loaded by default."
              checked={analytics}
              onChange={setAnalytics}
            />
            <PreferenceRow
              testid="cookie-pref-marketing"
              title="Marketing"
              description="Measurement for any future marketing campaigns. None loaded by default."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={handleRejectAll}
              data-testid="cookie-preferences-reject"
            >
              Reject non-essential
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSavePrefs}
              data-testid="cookie-preferences-save"
            >
              Save preferences
            </Button>
            <Button
              type="button"
              onClick={handleAcceptAll}
              className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
              data-testid="cookie-preferences-accept-all"
            >
              Accept all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled,
  onChange,
  testid,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  testid: string;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 rounded-md border border-border/60 bg-background/50 p-3"
      data-testid={testid}
    >
      <div className="text-sm">
        <div className="font-semibold">{title}</div>
        <p className="text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={`${title} cookies`}
        data-testid={`${testid}-switch`}
      />
    </div>
  );
}

// Avoid TS unused-import error if hasDecided ever becomes useful elsewhere.
void hasDecided;
