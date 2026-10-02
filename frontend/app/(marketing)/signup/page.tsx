"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiRequest } from "../../../lib/api";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      setError("We couldn’t create your account. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="auth-page"><section className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Adults only · 18+</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-rose-950 sm:text-6xl">Start with clarity.</h1><p className="mt-5 text-lg leading-8 text-stone-600">Tell people what you’re looking for before you start matching.</p></section><section className="form-card"><h2 className="text-2xl font-bold">Create your account</h2><p className="mt-2 text-sm text-stone-500">It takes less than a minute.</p>{complete ? <p className="notice-success mt-6">Account created. <Link className="font-semibold underline" href="/login">Log in to continue</Link>.</p> :
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label><span className="label">Email address</span><input aria-label="Email" className="field" name="email" type="email" placeholder="you@example.com" required /></label>
        <label><span className="label">Date of birth</span><input aria-label="Date of birth" className="field" name="date_of_birth" type="date" required /></label>
        <label><span className="label">Password</span><input aria-label="Password" className="field" name="password" type="password" placeholder="At least 8 characters" minLength={8} required /></label>
        {error && <p role="alert" className="notice-error">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
      </form>}
    <p className="mt-6 text-sm text-stone-600">Already have an account? <Link className="underline" href="/login">Log in</Link>.</p>
  </section></main>;
}
