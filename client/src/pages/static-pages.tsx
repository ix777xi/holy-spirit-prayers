import { useState } from "react";
import { Link, useRoute } from "wouter";
import { Mail } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { Scripture } from "@/components/brand/Scripture";
import { SectionDivider } from "@/components/brand/SectionDivider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { openCookiePreferences } from "@/lib/cookie-consent";

const LEGAL_CONTACT_EMAIL = "support@holyspiritprayers.com";
const EFFECTIVE_DATE = "May 7, 2026";

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

/* =========================================================================
 * Legal hub + sub-pages
 * ========================================================================= */

type LegalSlug =
  | "privacy"
  | "terms"
  | "cookies"
  | "california"
  | "gdpr"
  | "disclaimer"
  | "refunds";

type LegalDoc = {
  slug: LegalSlug;
  title: string;
  blurb: string;
};

const LEGAL_DOCS: LegalDoc[] = [
  { slug: "privacy", title: "Privacy Policy", blurb: "What we collect, why, and how we protect it." },
  { slug: "terms", title: "Terms of Service", blurb: "The agreement between you and Holy Spirit Prayers." },
  { slug: "cookies", title: "Cookie Policy", blurb: "How we use cookies and your consent options." },
  { slug: "california", title: "California Privacy Notice", blurb: "Your CCPA/CPRA rights and our Do Not Sell or Share commitment." },
  { slug: "gdpr", title: "GDPR & Data Rights", blurb: "Rights for users in the EU/UK and how to exercise them." },
  { slug: "disclaimer", title: "Faith & Legal Disclaimer", blurb: "Prayers are spiritual resources, not professional advice." },
  { slug: "refunds", title: "Refund Policy", blurb: "When and how refunds are issued." },
];

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        <div>
          <Link
            href="/legal"
            className="text-xs uppercase tracking-[0.18em] text-brand-gold hover:text-brand-goldsoft"
            data-testid="link-legal-back"
          >
            ← Legal
          </Link>
          <h1 className="headline text-4xl mt-2">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective {EFFECTIVE_DATE}. Questions?{" "}
            <a className="underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
        <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed space-y-5">
          {children}
        </div>
        <div className="rounded-xl border border-brand-gold/30 bg-brand-cream/60 dark:bg-brand-gold/10 p-5 text-sm">
          Manage your privacy choices anytime on the{" "}
          <Link href="/privacy-choices" className="font-semibold underline" data-testid="link-privacy-choices-inline">
            Privacy Choices
          </Link>{" "}
          page.
        </div>
      </div>
    </PageShell>
  );
}

function LegalIndex() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-brand-gold mb-3">Legal</div>
          <h1 className="headline text-4xl">Terms, privacy, and disclaimers</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Effective {EFFECTIVE_DATE}. For questions about anything below, email{" "}
            <a className="underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <section className="rounded-xl border border-brand-gold/40 bg-brand-cream/70 dark:bg-brand-gold/10 p-6">
          <h2 className="font-serif text-xl font-semibold mb-2">Faith disclaimer</h2>
          <p className="text-sm leading-relaxed">
            Holy Spirit Prayers offers faith-based spiritual resources. Nothing on this site is a substitute for
            medical, legal, financial, mental-health, or other professional advice. If you are in crisis, please
            contact qualified professionals or your local emergency services.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {LEGAL_DOCS.map((doc) => (
            <Link
              key={doc.slug}
              href={`/legal/${doc.slug}`}
              className="rounded-xl border border-card-border bg-card p-5 hover:border-brand-gold transition-colors block"
              data-testid={`link-legal-${doc.slug}`}
            >
              <h3 className="font-serif text-lg font-semibold">{doc.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{doc.blurb}</p>
            </Link>
          ))}
          <Link
            href="/privacy-choices"
            className="rounded-xl border border-brand-gold bg-brand-gold/10 p-5 hover:bg-brand-gold/15 transition-colors block"
            data-testid="link-legal-privacy-choices"
          >
            <h3 className="font-serif text-lg font-semibold">Your Privacy Choices</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Access, correct, delete, or opt out of sale/sharing. Manage cookies.
            </p>
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          California residents may also use the{" "}
          <Link href="/legal/california" className="underline">
            California Privacy Notice
          </Link>{" "}
          and the{" "}
          <Link href="/privacy-choices" className="underline">
            Do Not Sell or Share My Personal Information
          </Link>{" "}
          link.
        </div>
      </div>
    </PageShell>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-2xl font-semibold mt-8 mb-2">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-serif text-lg font-semibold mt-5 mb-1">{children}</h3>;
}

function PrivacyDoc() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        This Privacy Policy explains how Holy Spirit Prayers (“we,” “us”) collects, uses, and shares
        information about you when you use www.holyspiritprayers.com and related services (the “Service”).
      </p>

      <H2>Information we collect</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Account information:</strong> email, display name, salted+hashed password.</li>
        <li><strong>Order &amp; subscription information:</strong> products purchased, subscription status, and Stripe customer/subscription IDs. Card details are handled by Stripe, not by us.</li>
        <li><strong>Custom prayer submissions:</strong> the name, email, occasion, theme, and notes you submit.</li>
        <li><strong>Contact &amp; newsletter submissions:</strong> the email and message you send us.</li>
        <li><strong>Technical data:</strong> IP address, user-agent, request timing, and basic logs needed to operate the Service.</li>
        <li><strong>Cookies:</strong> a small first-party consent cookie remembers your cookie preferences. See our{" "}
          <Link href="/legal/cookies" className="underline">Cookie Policy</Link>.
        </li>
      </ul>

      <H2>How we use information</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>To provide the Service: deliver prayers, process orders, fulfill custom requests.</li>
        <li>To send transactional messages (receipts, password resets, order updates).</li>
        <li>To respond to your contact messages and prayer requests.</li>
        <li>To secure the Service, prevent fraud, and comply with law.</li>
      </ul>

      <H2>How we share information</H2>
      <p>
        We share information only with service providers we need to operate the Service (for example, Stripe for
        payment processing and our hosting provider Railway). We do <strong>not</strong> sell your personal
        information, and we do not “share” it for cross-context behavioral advertising as those terms are
        defined under California law.
      </p>

      <H2>Retention</H2>
      <p>
        We keep account data for as long as your account is active and as needed to comply with our legal
        obligations. You can request deletion at any time on the{" "}
        <Link href="/privacy-choices" className="underline">Privacy Choices</Link> page.
      </p>

      <H2>Your rights</H2>
      <p>
        Depending on where you live (for example, the EU/UK or California), you may have rights to access,
        correct, delete, or restrict processing of your personal information, and to opt out of sale/sharing.
        See the{" "}
        <Link href="/legal/gdpr" className="underline">GDPR &amp; Data Rights</Link> and{" "}
        <Link href="/legal/california" className="underline">California Privacy Notice</Link> pages, and use{" "}
        <Link href="/privacy-choices" className="underline">Privacy Choices</Link> to submit a request.
      </p>

      <H2>Children</H2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly collect personal information
        from children under 13. If you believe we have done so, please contact us so we can delete it.
      </p>

      <H2>International transfers</H2>
      <p>
        We operate from the United States. If you use the Service from outside the United States, you
        understand that your information may be processed in the United States.
      </p>

      <H2>Security</H2>
      <p>
        We use industry-standard safeguards including TLS in transit and salted+hashed password storage. No
        method of transmission or storage is 100% secure.
      </p>

      <H2>Changes</H2>
      <p>
        We may update this Policy from time to time. Material changes will be posted on this page with a new
        effective date.
      </p>

      <H2>Contact</H2>
      <p>
        Email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}

function TermsDoc() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        These Terms govern your use of www.holyspiritprayers.com and related services (the “Service”). By using
        the Service you agree to these Terms.
      </p>

      <H2>Accounts</H2>
      <p>
        You are responsible for keeping your account credentials confidential and for activity that occurs under
        your account. You must be at least 13 years old to create an account.
      </p>

      <H2>Spiritual content</H2>
      <p>
        The prayers, audio recordings, and written materials are faith-based resources. They are not a
        substitute for medical, legal, financial, or professional advice. See the{" "}
        <Link href="/legal/disclaimer" className="underline">Faith &amp; Legal Disclaimer</Link>.
      </p>

      <H2>License &amp; acceptable use</H2>
      <p>
        We grant you a personal, non-exclusive, non-transferable license to stream and download prayers for
        personal, non-commercial use. You may not redistribute, broadcast, resell, or use any prayer content to
        train machine-learning models without our written consent.
      </p>

      <H2>Subscriptions and one-time purchases</H2>
      <p>
        Subscriptions renew automatically until you cancel through your{" "}
        <Link href="/account" className="underline">account portal</Link> or Stripe’s billing portal. One-time
        prayer purchases grant lifetime access to that prayer for the buyer.
      </p>

      <H2>Refunds</H2>
      <p>
        See the <Link href="/legal/refunds" className="underline">Refund Policy</Link>.
      </p>

      <H2>Termination</H2>
      <p>
        We may suspend or terminate your access for breach of these Terms or to comply with law. You may stop
        using the Service at any time and request account deletion on the{" "}
        <Link href="/privacy-choices" className="underline">Privacy Choices</Link> page.
      </p>

      <H2>Disclaimer of warranties</H2>
      <p>
        The Service is provided “as is” without warranties of any kind, either express or implied, to the
        fullest extent permitted by law.
      </p>

      <H2>Limitation of liability</H2>
      <p>
        To the maximum extent permitted by law, Holy Spirit Prayers shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or for lost profits or revenues, arising from
        your use of the Service.
      </p>

      <H2>Governing law</H2>
      <p>
        These Terms are governed by the laws of the United States and the State of California, without regard
        to conflict-of-laws principles.
      </p>

      <H2>Contact</H2>
      <p>
        Email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}

function CookiesDoc() {
  return (
    <LegalShell title="Cookie Policy">
      <p>
        This Cookie Policy explains how Holy Spirit Prayers uses cookies and similar technologies on
        www.holyspiritprayers.com.
      </p>

      <H2>What are cookies?</H2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They are widely used to
        make websites work, or work more efficiently, and to provide reporting information.
      </p>

      <H2>Categories we use</H2>
      <H3>Essential</H3>
      <p>
        Required for the Service to function. Examples: login session, cart/checkout state, your saved cookie
        preferences. These cannot be turned off.
      </p>
      <H3>Analytics</H3>
      <p>
        Optional. If enabled, we may use aggregate analytics to understand site usage and improve the Service.
        We currently do <strong>not</strong> load any analytics scripts; this category is reserved for future
        use and will only run after you opt in.
      </p>
      <H3>Marketing</H3>
      <p>
        Optional. If enabled, we may use marketing cookies to measure campaigns. We currently do{" "}
        <strong>not</strong> load any marketing scripts; this category is reserved for future use and will only
        run after you opt in.
      </p>

      <H2>Managing your preferences</H2>
      <p>
        Use the consent banner on first visit, or open{" "}
        <button
          type="button"
          className="underline"
          onClick={openCookiePreferences}
          data-testid="button-open-cookie-preferences-inline"
        >
          Cookie Preferences
        </button>{" "}
        anytime. You can also manage cookies in your browser settings.
      </p>

      <H2>Do Not Track and Global Privacy Control</H2>
      <p>
        Where required by law (for example California), we treat a Global Privacy Control (GPC) signal sent by
        your browser as a valid request to opt out of the sale/sharing of your personal information.
      </p>

      <H2>Contact</H2>
      <p>
        Email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}

function CaliforniaDoc() {
  return (
    <LegalShell title="California Privacy Notice">
      <p>
        This notice supplements our <Link href="/legal/privacy" className="underline">Privacy Policy</Link> and
        applies to California residents under the California Consumer Privacy Act, as amended by the CPRA
        (collectively “CCPA”).
      </p>

      <H2>Categories of personal information we collect</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Identifiers (name, email, account ID).</li>
        <li>Commercial information (order history, subscription status).</li>
        <li>Internet or other electronic activity (IP address, basic request logs).</li>
        <li>Inferences drawn from the above to provide the Service.</li>
      </ul>
      <p>
        We do <strong>not</strong> knowingly collect sensitive personal information beyond your account email
        and password (which is stored as a salted hash).
      </p>

      <H2>Do Not Sell or Share My Personal Information</H2>
      <p>
        We do not sell your personal information for money, and we do not share it for cross-context behavioral
        advertising. You can confirm this preference and opt out at any time on the{" "}
        <Link href="/privacy-choices" className="underline">Your Privacy Choices</Link> page or by sending a
        Global Privacy Control signal from your browser.
      </p>

      <H2>Limit Use of Sensitive Personal Information</H2>
      <p>
        We do not use sensitive personal information to infer characteristics about you. You can submit a “Limit
        Use” request on the <Link href="/privacy-choices" className="underline">Privacy Choices</Link> page.
      </p>

      <H2>Your CCPA rights</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Right to know what personal information we collect, use, and disclose.</li>
        <li>Right to delete personal information we have collected.</li>
        <li>Right to correct inaccurate personal information.</li>
        <li>Right to opt out of the sale/sharing of personal information.</li>
        <li>Right to limit the use and disclosure of sensitive personal information.</li>
        <li>Right to non-discrimination for exercising your rights.</li>
      </ul>

      <H2>How to exercise your rights</H2>
      <p>
        Use the <Link href="/privacy-choices" className="underline">Privacy Choices</Link> page or email{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">{LEGAL_CONTACT_EMAIL}</a>. We will
        verify your request by reference to your account email. Authorized agents may submit requests with
        signed permission.
      </p>

      <H2>Retention</H2>
      <p>
        We retain personal information for as long as your account is active or as needed to comply with our
        legal obligations.
      </p>
    </LegalShell>
  );
}

function GdprDoc() {
  return (
    <LegalShell title="GDPR & Data Rights">
      <p>
        If you are located in the European Economic Area (EEA), the United Kingdom, or Switzerland, the
        following supplements our <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
      </p>

      <H2>Controller</H2>
      <p>
        Holy Spirit Prayers is the controller of personal data processed through the Service. Email{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">{LEGAL_CONTACT_EMAIL}</a>.
      </p>

      <H2>Legal bases</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Contract:</strong> to provide the Service you requested (Article 6(1)(b)).</li>
        <li><strong>Legitimate interests:</strong> to keep the Service secure and improve it (Article 6(1)(f)).</li>
        <li><strong>Consent:</strong> for non-essential cookies and marketing (Article 6(1)(a)).</li>
        <li><strong>Legal obligation:</strong> to comply with tax, accounting, and other laws (Article 6(1)(c)).</li>
      </ul>

      <H2>Your rights</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Right of access, rectification, and erasure.</li>
        <li>Right to restrict or object to processing.</li>
        <li>Right to data portability.</li>
        <li>Right to withdraw consent at any time without affecting prior processing.</li>
        <li>Right to lodge a complaint with your supervisory authority.</li>
      </ul>

      <H2>How to exercise your rights</H2>
      <p>
        Use the <Link href="/privacy-choices" className="underline">Privacy Choices</Link> page or email{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">{LEGAL_CONTACT_EMAIL}</a>. We respond
        within one month, extendable by up to two further months for complex requests.
      </p>

      <H2>International transfers</H2>
      <p>
        We process personal data in the United States. Where required, we rely on the European Commission’s
        Standard Contractual Clauses or equivalent safeguards with our service providers.
      </p>

      <H2>Retention</H2>
      <p>
        We keep account information for as long as your account is active and for a reasonable period
        thereafter to comply with legal obligations.
      </p>
    </LegalShell>
  );
}

function DisclaimerDoc() {
  return (
    <LegalShell title="Faith & Legal Disclaimer">
      <p>
        Holy Spirit Prayers offers Bible-centered prayer audio, written prayers, and custom prayer requests as
        spiritual resources. The Service is intended to encourage prayer and faith.
      </p>
      <H2>Not professional advice</H2>
      <p>
        Nothing on the Service constitutes medical, mental-health, legal, financial, or other professional
        advice. Always consult a qualified professional for advice specific to your situation. If you are in
        crisis, contact your local emergency services.
      </p>
      <H2>Spiritual results</H2>
      <p>
        We make no guarantees as to specific spiritual, emotional, or material outcomes from the use of any
        prayer content.
      </p>
      <H2>Third-party links</H2>
      <p>
        The Service may contain links to third-party sites. We are not responsible for the content or practices
        of those sites.
      </p>
    </LegalShell>
  );
}

function RefundsDoc() {
  return (
    <LegalShell title="Refund Policy">
      <p>
        Digital prayer downloads are non-refundable except where the file is defective. Subscriptions can be
        cancelled at any time and will not renew at the next billing cycle; we do not refund partial periods.
        Custom prayer requests are refundable if not delivered within 72 hours of payment.
      </p>
      <p>
        To request a refund, email{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">{LEGAL_CONTACT_EMAIL}</a> with your
        order ID.
      </p>
    </LegalShell>
  );
}

const LEGAL_DOC_RENDERERS: Record<LegalSlug, () => JSX.Element> = {
  privacy: PrivacyDoc,
  terms: TermsDoc,
  cookies: CookiesDoc,
  california: CaliforniaDoc,
  gdpr: GdprDoc,
  disclaimer: DisclaimerDoc,
  refunds: RefundsDoc,
};

export function LegalPage() {
  const [, params] = useRoute<{ section?: string }>("/legal/:section");
  const section = params?.section?.toLowerCase();
  if (section && (LEGAL_DOC_RENDERERS as Record<string, () => JSX.Element>)[section]) {
    const Renderer = LEGAL_DOC_RENDERERS[section as LegalSlug];
    return <Renderer />;
  }
  return <LegalIndex />;
}

/* =========================================================================
 * Top-level shortcut routes (e.g. /privacy → renders PrivacyDoc)
 * ========================================================================= */

export const PrivacyPage = PrivacyDoc;
export const TermsPage = TermsDoc;
export const CookiesPage = CookiesDoc;
export const CaliforniaPrivacyPage = CaliforniaDoc;
export const GdprPage = GdprDoc;
export const DisclaimerPage = DisclaimerDoc;
export const RefundsPage = RefundsDoc;

/* =========================================================================
 * Privacy Choices (DSAR/CCPA request center + cookie preferences entry)
 * ========================================================================= */

const REQUEST_TYPES = [
  { id: "access", label: "Access my data", help: "Receive a copy of personal information we have about you." },
  { id: "delete", label: "Delete my data", help: "Request deletion of your account and associated data." },
  { id: "correct", label: "Correct my data", help: "Update inaccurate personal information." },
  { id: "opt-out-sale", label: "Opt out of sale/sharing", help: "Confirm you do not want your data sold or shared. We do not sell or share today, but you may still record this preference." },
  { id: "limit-sensitive", label: "Limit use of sensitive PI", help: "Request that we limit use of sensitive personal information." },
  { id: "withdraw-consent", label: "Withdraw consent", help: "Withdraw consent previously given for non-essential processing." },
] as const;

type RequestId = (typeof REQUEST_TYPES)[number]["id"];

export function PrivacyChoicesPage() {
  const { toast } = useToast();
  const [type, setType] = useState<RequestId>("access");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const subjectPrefix: Record<RequestId, string> = {
    access: "Data access request",
    delete: "Data deletion request",
    correct: "Data correction request",
    "opt-out-sale": "Opt out of sale/share",
    "limit-sensitive": "Limit use of sensitive PI",
    "withdraw-consent": "Withdraw consent",
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        <div>
          <Link
            href="/legal"
            className="text-xs uppercase tracking-[0.18em] text-brand-gold hover:text-brand-goldsoft"
            data-testid="link-back-to-legal"
          >
            ← Legal
          </Link>
          <h1 className="headline text-4xl mt-2">Your Privacy Choices</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective {EFFECTIVE_DATE}. Manage your data rights and cookie preferences in one place. Questions?{" "}
            <a className="underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <section className="rounded-xl border border-brand-gold/40 bg-brand-cream/70 dark:bg-brand-gold/10 p-6 space-y-2">
          <h2 className="font-serif text-xl font-semibold">We do not sell or share your personal information</h2>
          <p className="text-sm leading-relaxed">
            Holy Spirit Prayers does not sell personal information for money and does not share it for
            cross-context behavioral advertising. The form below lets you exercise additional data rights.
          </p>
        </section>

        <section className="rounded-xl border border-card-border bg-card p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold">Cookie preferences</h2>
          <p className="text-sm text-muted-foreground">
            We only set essential cookies by default. Open the preferences panel to enable or disable Analytics
            and Marketing categories.
          </p>
          <Button
            type="button"
            onClick={openCookiePreferences}
            className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
            data-testid="button-open-cookie-preferences"
          >
            Manage cookie preferences
          </Button>
        </section>

        <section className="rounded-xl border border-card-border bg-card p-6 space-y-5">
          <h2 className="font-serif text-xl font-semibold">Submit a privacy request</h2>
          {done ? (
            <div className="rounded-lg border border-brand-gold/40 bg-brand-cream/70 dark:bg-brand-gold/10 p-5 text-sm" data-testid="privacy-request-confirmation">
              <p className="font-semibold mb-1">Request received</p>
              <p>
                We’ll verify your identity using your account email and respond within 30 days (or sooner where
                required by law).
              </p>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                const requestType = String(fd.get("type") || type);
                const email = String(fd.get("email") || "");
                const details = String(fd.get("details") || "");
                setSubmitting(true);
                try {
                  await apiRequest("POST", "/api/contact", {
                    name: String(fd.get("name") || "Privacy request"),
                    email,
                    subject: subjectPrefix[requestType as RequestId] || "Privacy request",
                    message: `Request type: ${requestType}\n\n${details}`,
                  });
                  setDone(true);
                } catch {
                  toast({
                    title: "Couldn’t submit",
                    description: `Please email ${LEGAL_CONTACT_EMAIL} directly.`,
                    variant: "destructive",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
              data-testid="form-privacy-request"
            >
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="type">Request type</label>
                <select
                  id="type"
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as RequestId)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  data-testid="select-privacy-request-type"
                >
                  {REQUEST_TYPES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {REQUEST_TYPES.find((r) => r.id === type)?.help}
                </p>
              </div>
              <PInput name="name" label="Your name" />
              <PInput name="email" label="Account email" type="email" />
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="details">Details (optional)</label>
                <textarea
                  id="details"
                  name="details"
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  data-testid="textarea-privacy-details"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
                data-testid="button-submit-privacy-request"
              >
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Prefer email? Send your request to{" "}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">
                  {LEGAL_CONTACT_EMAIL}
                </a>
                .
              </p>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-card-border bg-card p-6 space-y-2">
          <h2 className="font-serif text-xl font-semibold">Authorized agents</h2>
          <p className="text-sm text-muted-foreground">
            An authorized agent may submit a request on your behalf with written, signed permission. Email{" "}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}

function PInput({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" htmlFor={`pr-${name}`}>{label}</label>
      <input
        id={`pr-${name}`}
        name={name}
        type={type}
        required
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        data-testid={`input-privacy-${name}`}
      />
    </div>
  );
}
