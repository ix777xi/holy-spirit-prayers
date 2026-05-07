import { useState } from "react";
import { Link, useLocation } from "wouter";
import { PageShell } from "@/components/brand/PageShell";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/app-context";
import { useToast } from "@/hooks/use-toast";

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

function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm font-medium hover-elevate flex items-center justify-center gap-3"
      data-testid="button-google"
      onClick={() => alert("Google OAuth is stubbed in this preview.")}
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.9 8-11.3 8a12 12 0 1 1 0-24 12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 0 0 24 4a20 20 0 0 0 0 40c10 0 19-7.3 19-20 0-1.4-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 13.9-5.5l-6.4-5.4A12 12 0 0 1 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.4 5.4C41.4 36 44 31 44 25c0-1.6-.2-3-.4-4.5z" />
      </svg>
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
      <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">or</span></div>
    </div>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !password) return;
    signIn(email);
    toast({ title: "Signed in", description: "Welcome back." });
    navigate(email.toLowerCase().startsWith("admin") ? "/admin" : "/dashboard");
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your library and custom prayer requests."
      footer={<>Don’t have an account? <Link href="/register" className="text-brand-gold font-medium hover:underline">Sign up</Link></>}
    >
      <GoogleButton label="Continue with Google" />
      <Divider />
      <form onSubmit={submit} className="space-y-4" data-testid="form-login">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">Email</label>
          <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" data-testid="input-login-email" placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-gold hover:underline">Forgot?</Link>
          </div>
          <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" data-testid="input-login-password" />
        </div>
        <Button type="submit" className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-login-submit">Log in</Button>
        <p className="text-[11px] text-muted-foreground italic">Demo tip: use any email containing “admin” to access the admin dashboard.</p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.includes("@") || password.length < 6) {
      setError("Please complete the form. Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) { setError("Passwords don’t match."); return; }
    if (!agree) { setError("Please accept the terms of service."); return; }
    signUp(name, email);
    toast({ title: "Welcome", description: "Your account is ready." });
    navigate("/dashboard");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with a free prayer, build your library at your pace."
      footer={<>Already have an account? <Link href="/login" className="text-brand-gold font-medium hover:underline">Log in</Link></>}
    >
      <GoogleButton label="Sign up with Google" />
      <Divider />
      <form onSubmit={submit} className="space-y-4" data-testid="form-register">
        {error ? <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">{error}</p> : null}
        <Input label="Name" value={name} onChange={setName} testId="input-register-name" />
        <Input label="Email" type="email" value={email} onChange={setEmail} testId="input-register-email" />
        <Input label="Password" type="password" value={password} onChange={setPassword} testId="input-register-password" />
        <Input label="Confirm password" type="password" value={confirm} onChange={setConfirm} testId="input-register-confirm" />
        <label className="inline-flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-gold" data-testid="checkbox-register-tos" />
          <span className="text-muted-foreground">I agree to the <Link href="/legal" className="text-brand-gold hover:underline">Terms of Service</Link> and Privacy Policy.</span>
        </label>
        <Button type="submit" className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-register-submit">Sign up</Button>
      </form>
    </AuthShell>
  );
}

function Input({ label, value, onChange, type = "text", testId }: { label: string; value: string; onChange: (s: string) => void; type?: string; testId?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
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
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send a reset link."
      footer={<><Link href="/login" className="text-brand-gold font-medium hover:underline">Back to log in</Link></>}
    >
      {sent ? (
        <div className="rounded-md border border-brand-gold/30 bg-brand-gold/10 p-4 text-sm">
          If an account exists, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4" data-testid="form-forgot">
          <Input label="Email" type="email" value="" onChange={() => {}} testId="input-forgot-email" />
          <Button type="submit" className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-forgot-submit">Send reset link</Button>
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
        <Input label="New password" type="password" value={pw} onChange={setPw} testId="input-reset-password" />
        <Input label="Confirm password" type="password" value={confirm} onChange={setConfirm} testId="input-reset-confirm" />
        <Button type="submit" className="w-full bg-brand-gold hover:bg-brand-goldsoft text-brand-navy font-semibold" data-testid="button-reset-submit">Update password</Button>
      </form>
    </AuthShell>
  );
}
