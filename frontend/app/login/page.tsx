"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiRequest } from "../../lib/api";

type LoginResponse = { success: true; data: { access: string; refresh: string } };

export default function LoginPage() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await apiRequest<LoginResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      sessionStorage.setItem("access_token", response.data.access);
      setComplete(true);
    } catch {
      setError("Email or password is incorrect.");
    }
  }

  return <main className="auth-page"><section className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Welcome back</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-rose-950 sm:text-6xl">Pick up where you left off.</h1><p className="mt-5 text-lg leading-8 text-stone-600">Your matches, preferences, and profile are waiting.</p></section><section className="form-card"><h2 className="text-2xl font-bold">Log in</h2>{complete ? <p className="notice-success mt-6">You are signed in. <Link className="font-semibold underline" href="/profile/setup">Create your profile</Link>.</p> :
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label><span className="label">Email address</span><input aria-label="Email" className="field" name="email" type="email" placeholder="you@example.com" required /></label>
        <label><span className="label">Password</span><input aria-label="Password" className="field" name="password" type="password" placeholder="Your password" required /></label>
        {error && <p className="notice-error">{error}</p>}
        <button className="btn-primary w-full" type="submit">Log in</button>
      </form>}
    <p className="mt-6 text-sm text-stone-600">New here? <Link className="underline" href="/signup">Create an account</Link>.</p>
  </section></main>;
}
