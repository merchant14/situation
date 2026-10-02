"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError, apiRequest } from "../../../lib/api";

type LoginResponse = { success: true; data: { access: string; refresh: string } };
type CurrentUser = { id: number; email: string; date_of_birth: string; date_joined: string };

export default function LoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await apiRequest<LoginResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const currentUser = await apiRequest<CurrentUser>("/auth/me/", {
        headers: { Authorization: `Bearer ${response.data.access}` },
      });
      sessionStorage.setItem("access_token", response.data.access);
      sessionStorage.setItem("refresh_token", response.data.refresh);
      sessionStorage.setItem("user_id", String(currentUser.id));
      router.replace("/discover");
    } catch (error) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user_id");
      setError(error instanceof ApiError ? error.message : "Unable to log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="auth-page">
    <section className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Welcome back</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-rose-950 sm:text-6xl">Pick up where you left off.</h1><p className="mt-5 text-lg leading-8 text-stone-600">Your matches, preferences, and profile are waiting.</p></section>
    <section className="form-card"><h2 className="text-2xl font-bold">Log in</h2>
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label><span className="label">Email address</span><input aria-label="Email" className="field" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label><span className="label">Password</span><div className="relative"><input aria-label="Password" className="field pr-20" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Your password" required /><button className="absolute inset-y-0 right-3 text-sm font-semibold text-rose-700" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div></label>
        {error && <p role="alert" className="notice-error">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={submitting}>{submitting ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-6 text-sm text-stone-600">New here? <Link className="underline" href="/signup">Create an account</Link>.</p>
    </section>
  </main>;
}
