"use client";

import { useState, type ReactNode } from "react";
import { confirmCodeAction, resendCodeAction, signInAction, signUpAction } from "@/lib/auth-actions";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  minLength,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pass-wrap">
        <input id={id} name={name} type={show ? "text" : "password"} placeholder={placeholder} autoComplete={autoComplete} minLength={minLength} required />
        <button type="button" className="eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>
          <EyeIcon />
        </button>
      </div>
    </div>
  );
}

export function AuthScreen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="auth-screen">
      <a className="auth-back" href="/">Back to My Driver Aberdeen</a>
      <section className="auth-card">
        <h1>{title}</h1>
        <p className="auth-sub">{subtitle}</p>
        {children}
      </section>
      <p className="auth-talk">Prefer to talk? Call or text <a href="tel:+447822011848">07822 011848</a>.</p>
    </main>
  );
}

export function SignInForm({ nextPath, email }: { nextPath: string; email: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError("");
        const result = await signInAction(formData);
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="next" value={nextPath} />
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" placeholder="Enter your email address" autoComplete="email" defaultValue={email} required />
      </div>
      <PasswordField id="password" name="password" label="Password" placeholder="Enter your password" autoComplete="current-password" />
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Signing in" : "Sign in"} <span aria-hidden="true">›</span></button>
      <p className="auth-switch">New here? <a href="/sign-up/">Create an account</a></p>
    </form>
  );
}

export function SignUpForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError("");
        const result = await signUpAction(formData);
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="Your name" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" placeholder="Enter your email address" autoComplete="email" required />
      </div>
      <PasswordField id="password" name="password" label="Password" placeholder="Create a password" autoComplete="new-password" minLength={8} />
      <PasswordField id="confirm" name="confirm" label="Confirm password" placeholder="Repeat your password" autoComplete="new-password" minLength={8} />
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Sending code" : "Continue"} <span aria-hidden="true">›</span></button>
      <p className="auth-switch">Already have an account? <a href="/sign-in/">Sign in</a></p>
    </form>
  );
}

export function CodeForm({ email }: { email: string }) {
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError("");
        const result = await confirmCodeAction(formData);
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="code">Verification code</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" maxLength={6} required />
      </div>
      <p className="auth-sub" style={{ margin: 0 }}>Sent to {email}. It expires in 10 minutes.</p>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      {note ? <p className="auth-ok" role="status">{note}</p> : null}
      <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Checking" : "Continue"} <span aria-hidden="true">›</span></button>
      <button
        className="auth-text-btn"
        type="button"
        onClick={async () => {
          setError("");
          setNote("");
          const result = await resendCodeAction();
          if (result && "error" in result && result.error) setError(result.error);
          else setNote("A new code is on its way.");
        }}
      >
        Send a new code
      </button>
    </form>
  );
}
