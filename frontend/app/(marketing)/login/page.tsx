"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError, apiRequest } from "../../../lib/api";

type LoginResponse = { success: true; data: { access: string; refresh: string } };
type CurrentUser = { id: number; email: string; date_of_birth: string; date_joined: string };

const inputClass = "field focus:border-[#a9513d] focus:ring-[#f1e2dc]";
const primaryButtonClass = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#a9513d] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#913f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30] disabled:cursor-not-allowed disabled:opacity-60";

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

  return (
    <main className="auth-page">
      <section className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.19em] text-[#9a503f] sm:text-sm">
          WELCOME BACK
        </p>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,5vw,4rem)] leading-[1.05] tracking-[-0.04em] text-[#3b2025]">
          Pick up where you left off.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#685b56] sm:text-lg sm:leading-8">
          Your matches, preferences, and profile are waiting.
        </p>
      </section>

      <section className="rounded-3xl border border-[#eadfd9] bg-white p-6 shadow-[0_10px_30px_rgba(65,40,31,0.06)] sm:p-9">
        <h2 className="text-2xl font-bold text-[#302521]">Log in</h2>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label>
            <span className="label">Email address</span>
            <input aria-label="Email" className={inputClass} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span className="label">Password</span>
            <span className="relative block">
              <input
                aria-label="Password"
                className={`${inputClass} pr-20`}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
              <button
                className="absolute inset-y-0 right-3 rounded-md px-1 text-sm font-semibold text-[#913f30] transition hover:text-[#713126] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="notice-error">{error}</p>}
          <button className={`${primaryButtonClass} w-full`} type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-stone-600">
          New here? <Link className="font-medium text-[#913f30] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]" href="/signup">Create an account</Link>.
        </p>
      </section>
    </main>
  );
}
