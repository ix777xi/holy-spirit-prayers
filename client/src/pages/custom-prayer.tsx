import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Check, ChevronRight, ChevronLeft, ShieldCheck, Loader2 } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Scripture } from "@/components/brand/Scripture";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const TONES = [
  "Gentle & Comforting",
  "Powerful & Bold",
  "Prophetic & Declarative",
  "Scripture-Heavy",
  "Deliverance-Focused",
  "Peace & Stillness",
];

type FormState = {
  name: string;
  email: string;
  category: string;
  description: string;
  tones: string[];
  wantAudio: boolean;
};

export default function CustomPrayerPage() {
  useDocumentMeta({
    title: "Request a Custom Prayer — Holy Spirit Prayers",
    description:
      "Request a personalized, Spirit-led prayer rooted in Scripture. Delivered in 24–48 hours as audio, text, or both.",
    canonicalPath: "/custom-prayer",
  });
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "", email: "", category: "", description: "", tones: [], wantAudio: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(s: number): boolean {
    const next: typeof errors = {};
    if (s === 1) {
      if (!form.name.trim()) next.name = "Please enter your name.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = "Please enter a valid email.";
    } else if (s === 2) {
      if (!form.category) next.category = "Choose a prayer category.";
      if (form.description.trim().length < 20) next.description = "Share at least a few sentences so we can craft something meaningful.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const next = () => { if (validate(step)) setStep((s) => Math.min(3, s + 1)); };
  const back = () => setStep((s) => Math.max(1, s - 1));

  async function submit() {
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/custom-prayers", form);
      navigate("/custom-prayer/success");
    } catch (e) {
      // even on failure, route to success in this demo
      navigate("/custom-prayer/success");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <section className="surface-cathedral border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">Personalized · $10</div>
          <h1 className="headline text-3xl md:text-5xl mb-4">Request a Custom Prayer</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Share your need, and we’ll craft a personalized, Spirit-led prayer just for you. Audio delivered in 24–48 hours.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <Stepper step={step} />

        <form
          className="mt-10 space-y-8"
          onSubmit={(e) => { e.preventDefault(); if (step < 3) next(); else submit(); }}
          data-testid="form-custom-prayer"
        >
          {step === 1 && (
            <fieldset className="space-y-5">
              <legend className="font-serif text-2xl font-semibold mb-2">Your information</legend>
              <Field label="Full name" error={errors.name}>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="form-input"
                  placeholder="Hannah Cole"
                  data-testid="input-cp-name"
                />
              </Field>
              <Field label="Email" error={errors.email} hint="We’ll send your finished prayer here.">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                  data-testid="input-cp-email"
                />
              </Field>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="space-y-5">
              <legend className="font-serif text-2xl font-semibold mb-2">Prayer details</legend>
              <Field label="Prayer category" error={errors.category}>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="form-input"
                  data-testid="select-cp-category"
                >
                  <option value="">Select a category…</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Describe your prayer need" error={errors.description}>
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className="form-input"
                  placeholder="Please share what you’re going through so we can craft the most meaningful prayer…"
                  data-testid="textarea-cp-description"
                />
              </Field>
              <Field label="Preferred tone (select any)">
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => {
                    const on = form.tones.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update("tones", on ? form.tones.filter((x) => x !== t) : [...form.tones, t])}
                        data-testid={`chip-tone-${t.toLowerCase().replace(/\W+/g, "-")}`}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          on ? "border-brand-gold bg-brand-gold/15 text-foreground" : "border-input bg-card text-foreground/80 hover-elevate"
                        }`}
                      >
                        {on ? <Check className="inline h-3 w-3 mr-1" /> : null}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Audio version">
                <label className="inline-flex items-center gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.wantAudio}
                    onChange={(e) => update("wantAudio", e.target.checked)}
                    className="h-4 w-4 accent-brand-gold"
                    data-testid="checkbox-cp-audio"
                  />
                  <span className="text-sm">Yes, please include an audio recording (default).</span>
                </label>
              </Field>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="space-y-5">
              <legend className="font-serif text-2xl font-semibold mb-2">Review &amp; payment</legend>
              <div className="rounded-xl border border-card-border bg-card p-5 space-y-3 text-sm">
                <Row label="Name" value={form.name} />
                <Row label="Email" value={form.email} />
                <Row label="Category" value={categories.find((c) => c.slug === form.category)?.name ?? form.category ?? "—"} />
                <Row label="Tones" value={form.tones.length ? form.tones.join(", ") : "Any"} />
                <Row label="Audio" value={form.wantAudio ? "Included" : "Written only"} />
                <div className="pt-3 mt-3 border-t border-card-border">
                  <Row label={<span className="font-medium">Total</span>} value={<span className="font-serif text-lg font-semibold">$10.00</span>} />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Description: <span className="not-italic">{form.description}</span>
                </p>
              </div>
              <div className="rounded-md bg-brand-cream/70 dark:bg-brand-gold/10 border border-brand-gold/30 p-4 flex items-start gap-3 text-sm">
                <ShieldCheck className="h-4 w-4 text-brand-gold mt-0.5" />
                <div>
                  Stripe checkout is stubbed in this preview. In production this button opens a Stripe-hosted checkout page; on success you’ll land on the confirmation page.
                </div>
              </div>
            </fieldset>
          )}

          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={back} data-testid="button-cp-back">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : <span />}
            {step < 3 ? (
              <Button type="submit" className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-cp-next">
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting} className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-cp-submit">
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Pay $10 &amp; Submit Request
              </Button>
            )}
          </div>
        </form>

        <div className="mt-12">
          <Scripture reference="Jeremiah 33:3">
            Call to Me, and I will answer you, and show you great and mighty things, which you do not know.
          </Scripture>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--input));
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.95rem;
        }
        .form-input:focus { outline: 2px solid hsl(var(--ring)); outline-offset: 1px; }
      `}</style>
    </PageShell>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Your info", "Prayer details", "Review & pay"];
  return (
    <ol className="flex items-center gap-3 text-sm">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step, done = n < step;
        return (
          <li key={s} className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
              done ? "bg-brand-gold text-brand-navy" : active ? "bg-brand-navy text-white dark:bg-brand-gold dark:text-brand-navy" : "bg-muted text-muted-foreground"
            }`} aria-current={active ? "step" : undefined}>
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={`${active ? "text-foreground font-medium" : "text-muted-foreground"} hidden sm:inline`}>{s}</span>
            {i < steps.length - 1 ? <span className="w-8 h-px bg-border" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function CustomPrayerSuccessPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-brand-gold/15 text-brand-gold inline-flex items-center justify-center mb-6">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="headline text-3xl md:text-4xl mb-3" data-testid="text-cp-success">Your request has been received</h1>
        <p className="text-muted-foreground mb-6">
          Thank you. We’ll prayerfully craft your prayer and deliver it within 24–48 hours.
        </p>
        <div className="my-8">
          <Scripture reference="Jeremiah 33:3" align="center">
            Call to Me, and I will answer you, and show you great and mighty things, which you do not know.
          </Scripture>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard"><Button variant="outline" data-testid="button-cp-dashboard">Track in dashboard</Button></Link>
          <Link href="/library"><Button className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-cp-library">Browse library</Button></Link>
        </div>
      </div>
    </PageShell>
  );
}
