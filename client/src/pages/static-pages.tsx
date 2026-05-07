import { useState } from "react";
import { Link } from "wouter";
import { Mail } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Scripture } from "@/components/brand/Scripture";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function AboutPage() {
  return (
    <PageShell>
      <section className="surface-cathedral border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center space-y-5">
          <div className="text-xs uppercase tracking-[0.18em] text-brand-gold">Our story</div>
          <h1 className="headline text-4xl md:text-5xl">A sanctuary for the praying heart</h1>
          <p className="text-muted-foreground text-lg">
            Holy Spirit Prayers exists for the moments when words fail. We craft prayers grounded in Scripture and led by the Spirit — for you to listen, download, and pray as your own.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        <Scripture reference="Romans 8:26" align="left" size="lg">
          Likewise the Spirit also helps in our weaknesses. For we do not know what we should pray for as we ought,
          but the Spirit Himself makes intercession for us with groanings which cannot be uttered.
        </Scripture>
        <SectionDivider icon="dove" />
        <div className="space-y-5 text-foreground/90 leading-relaxed">
          <h2 className="headline text-2xl">Why we built this</h2>
          <p>
            We started Holy Spirit Prayers after a season where words ran out. A friend was walking through grief,
            and we found ourselves whispering Scripture into voice memos because anything else felt thin. We share
            what we made — and what we’re still making — with you.
          </p>
          <h2 className="headline text-2xl">What you’ll find here</h2>
          <p>
            Prayers organized by category: protection, healing, deliverance, identity, marriage, calling, and more.
            Each one is rooted in Scripture. Each one is delivered as a calm, recorded audio file you can keep.
            For your unique need, we craft a custom prayer — one prayer at a time, not from a template.
          </p>
          <h2 className="headline text-2xl">Non-denominational, Christ-centered</h2>
          <p>
            We hold the historic Christian faith and welcome believers from every stream. Our prayers point to Jesus,
            the Word of God, and the leading of the Holy Spirit.
          </p>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-7 text-center">
          <h3 className="font-serif text-2xl font-semibold mb-2">Find a prayer for today</h3>
          <p className="text-muted-foreground mb-5">Start with a free sample, then explore the library.</p>
          <div className="flex justify-center gap-3">
            <Link href="/free-prayer"><Button className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold">Free prayer</Button></Link>
            <Link href="/library"><Button variant="outline">Browse library</Button></Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function ContactPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">Contact</div>
        <h1 className="headline text-4xl mb-3">We’d love to hear from you</h1>
        <p className="text-muted-foreground mb-8">
          For prayer requests, partnerships, or feedback. We respond within 24–48 hours.
        </p>

        <div className="rounded-md bg-brand-cream/70 dark:bg-brand-gold/10 border border-brand-gold/30 p-3 text-sm flex items-center gap-2 mb-6">
          <Mail className="h-4 w-4 text-brand-gold" />
          <span>hello@holyspiritprayers.com</span>
        </div>

        {done ? (
          <div className="rounded-xl border border-brand-gold/40 bg-brand-cream/70 dark:bg-brand-gold/10 p-6 text-center">
            <h2 className="font-serif text-xl font-semibold mb-1">Message received</h2>
            <p className="text-sm text-muted-foreground">Thank you. We’ll be in touch within 24–48 hours.</p>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target as HTMLFormElement);
              setSubmitting(true);
              try {
                await apiRequest("POST", "/api/contact", {
                  name: fd.get("name"),
                  email: fd.get("email"),
                  message: fd.get("message"),
                });
                setDone(true);
              } catch {
                toast({ title: "Couldn’t send", description: "Try again in a moment.", variant: "destructive" });
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
            data-testid="form-contact"
          >
            <Input name="name" label="Your name" />
            <Input name="email" type="email" label="Email" />
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="message">Message</label>
              <textarea id="message" name="message" required rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" data-testid="textarea-contact-message" />
            </div>
            <Button type="submit" disabled={submitting} className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-contact-submit">
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </div>
    </PageShell>
  );
}

function Input({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        data-testid={`input-contact-${name}`}
      />
    </div>
  );
}

export function LegalPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">Legal</div>
          <h1 className="headline text-4xl">Terms, privacy, and disclaimers</h1>
        </div>

        <section className="rounded-xl border border-brand-gold/40 bg-brand-cream/70 dark:bg-brand-gold/10 p-6">
          <h2 className="font-serif text-xl font-semibold mb-2">Faith disclaimer</h2>
          <p className="text-sm leading-relaxed">
            These prayers are faith-based spiritual resources and are not a substitute for medical, legal, financial, or professional counseling.
            If you are in crisis, please contact qualified professionals or your local emergency services.
          </p>
        </section>

        <Section title="Terms of Service">
          <p>By using Holy Spirit Prayers you agree to these terms. Audio files and transcripts are licensed for personal, non-commercial use. Redistribution, broadcast, or resale is not permitted without written consent.</p>
        </Section>

        <Section title="Privacy Policy">
          <p>We collect the minimum required to operate: account email, password (stored only as a salted hash), purchase history, and prayer interactions. We use Stripe for payment processing; we do not sell your personal data. You may request export or deletion at any time.</p>
        </Section>

        <Section title="Refund Policy">
          <p>Digital prayer downloads are non-refundable except where the file is defective. Custom prayer requests are refundable if not delivered within 72 hours of payment.</p>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold mb-3">{title}</h2>
      <div className="text-foreground/85 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
