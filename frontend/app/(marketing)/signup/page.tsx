"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiError, apiRequest } from "../../../lib/api";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          date_of_birth: form.get("date_of_birth"),
        }),
      });
      setComplete(true);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "We couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="auth-page"><section className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Adults only · 18+</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-rose-950 sm:text-6xl">Start with clarity.</h1><p className="mt-5 text-lg leading-8 text-stone-600">Tell people what you’re looking for before you start matching.</p></section><section className="form-card"><h2 className="text-2xl font-bold">Create your account</h2><p className="mt-2 text-sm text-stone-500">It takes less than a minute.</p>{complete ? <p className="notice-success mt-6">Account created. <Link className="font-semibold underline" href="/login">Log in to continue</Link>.</p> :
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label><span className="label">Email address</span><input aria-label="Email" className="field" name="email" type="email" placeholder="you@example.com" required /></label>
        <label><span className="label">Date of birth</span><input aria-label="Date of birth" className="field" name="date_of_birth" type="date" required /></label>
        <label><span className="label">Password</span><div className="relative"><input aria-label="Password" className="field pr-20" name="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" minLength={8} autoComplete="new-password" required /><button className="absolute inset-y-0 right-3 text-sm font-semibold text-rose-700" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div><span className="mt-1 block text-xs text-stone-500">Use at least 8 characters. Avoid common passwords and passwords based on your email.</span></label>
        {error && <p role="alert" className="notice-error">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
      </form>}
    <p className="mt-6 text-sm text-stone-600">Already have an account? <Link className="underline" href="/login">Log in</Link>.</p>
  </section></main>;
}
