const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

type Failure = { ok: false; error: string };
type Success<T> = { ok: true; value: T };

export function validateNewAccount(input: {
  name: string;
  email: string;
  password: string;
  confirm: string;
}): Failure | Success<{ name: string; email: string; password: string }> {
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = normaliseEmail(input.email);
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (name.length > 80) return { ok: false, error: "Name is too long." };
  if (!emailPattern.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (input.password !== input.confirm) return { ok: false, error: "Passwords do not match." };
  return { ok: true, value: { name, email, password: input.password } };
}

export function validateSignIn(input: {
  email: string;
  password: string;
}): Failure | Success<{ email: string; password: string }> {
  const email = normaliseEmail(input.email);
  if (!emailPattern.test(email) || input.password.length === 0) {
    return { ok: false, error: "Email or password is not correct." };
  }
  return { ok: true, value: { email, password: input.password } };
}

export function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account/";
  return value;
}
