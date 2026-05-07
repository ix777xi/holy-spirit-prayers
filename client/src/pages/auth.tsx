import { useState } from "react";
import { Link, useLocation } from "wouter";
import { PageShell } from "@/components/brand/PageShell";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/app-context";
import { useToast } from "@/hooks/use-toast";
import { useDocumentMeta } from "@/hooks/use-document-meta";

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <PageShell footer={false}>
      <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
        <section className="relative hidden lg:flex items-center justify-center surface-cathedral border-r border-border">
          <div className="max-w-md text-center space-y-6 px-10">
            <LogoMark size={64} />
            <h2 className="headline text-3xl">Spirit-led prayers, rooted in Scripture.</h2>
            <p className="text-muted-foreground">A digital sanctuary where words are given when you have none of your own.</p>
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <Link href="/" className="lg:hidden mb-6 inline-flex items-center gap-2"><LogoMark size={32} /></Link>
            <h1 className="headline text-3xl mb-2">{title}</h1>
            <p className="text-muted-foreground text-sm mb-8">{subtitle}</p>
            {children}
            <div className="text-center text-sm text-muted-foreground mt-6">{footer}</div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p
      className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2"
      data-testid="text-auth-error"
      role="alert"
    >
      {message}
    </p>
  );
}

export function LoginPage() {
  useDocumentMeta({
    title: "Sign in — Holy Spirit Prayers",
    description: "Sign in to your account.",
    canonicalPath: "/login",
    noindex: true,
  });
  const { signIn } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      toast({ title: "Signed in", description: "Welcome back." });
      navigate(email.toLowerCase().startsWith("admin") ? "/admin" : "/account");
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your library and saved prayers."
      footer={<>Don’t have an account? <Link href="/register" className="text-brand-gold font-medium hover:underline">Sign up</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" data-testid="form-login">
        {error ? <FieldError message={error} /> : null}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            data-testid="input-login-email"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-gold hover:underline">Forgot?</Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            data-testid="input-login-password"
          />
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
          data-testid="button-login-submit"
        >
          {submitting ? "Signing in…" : "Log in"}
        </Button>
        <p className="text-[11px] text-muted-foreground italic">
          Tip: an email starting with “admin” gets the admin dashboard after signing in.
        </p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  useDocumentMeta({
    title: "Create account — Holy Spirit Prayers",
    description: "Create your Holy Spirit Prayers account.",
    canonicalPath: "/register",
    noindex: true,
  });
  const { signUp } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.includes("@") || password.length < 6) {
      setError("Please complete the form. Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) { setError("Passwords don’t match."); return; }
    if (!agree) { setError("Please accept the terms of service."); return; }
    setSubmitting(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      toast({ title: "Welcome", description: "Your account is ready." });
      navigate("/account");
    } catch (err: any) {
      setError(err?.message || "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with a free prayer, build your library at your pace."
      footer={<>Already have an account? <Link href="/login" className="text-brand-gold font-medium hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" data-testid="form-register">
        {error ? <FieldError message={error} /> : null}
        <Input label="Name" value={name} onChange={setName} testId="input-register-name" autoComplete="name" />
        <Input label="Email" type="email" value={email} onChange={setEmail} testId="input-register-email" autoComplete="email" />
        <Input label="Password" type="password" value={password} onChange={setPassword} testId="input-register-password" autoComplete="new-password" />
        <Input label="Confirm password" type="password" value={confirm} onChange={setConfirm} testId="input-register-confirm" autoComplete="new-password" />
        <label className="inline-flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-gold"
            data-testid="checkbox-register-tos"
          />
          <span className="text-muted-foreground">I agree to the <Link href="/legal" className="text-brand-gold hover:underline">Terms of Service</Link> and Privacy Policy.</span>
        </label>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
          data-testid="button-register-submit"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </Button>
      </form>
    </AuthShell>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  testId,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
  testId?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
        data-testid={testId}
      />
    </div>
  );
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send a reset link."
      footer={<><Link href="/login" className="text-brand-gold font-medium hover:underline">Back to log in</Link></>}
    >
      {sent ? (
        <div
          className="rounded-md border border-brand-gold/30 bg-brand-gold/10 p-4 text-sm"
          data-testid="text-forgot-sent"
        >
          If an account exists, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4" data-testid="form-forgot">
          <Input label="Email" type="email" value={email} onChange={setEmail} testId="input-forgot-email" autoComplete="email" />
          <Button
            type="submit"
            className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
            data-testid="button-forgot-submit"
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6 || pw !== confirm) return;
    toast({ title: "Password reset", description: "You can now log in with your new password." });
    navigate("/login");
  }
  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your account."
      footer={<><Link href="/login" className="text-brand-gold font-medium hover:underline">Back to log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" data-testid="form-reset">
        <Input label="New password" type="password" value={pw} onChange={setPw} testId="input-reset-password" autoComplete="new-password" />
        <Input label="Confirm password" type="password" value={confirm} onChange={setConfirm} testId="input-reset-confirm" autoComplete="new-password" />
        <Button
          type="submit"
          className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold"
          data-testid="button-reset-submit"
        >
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
