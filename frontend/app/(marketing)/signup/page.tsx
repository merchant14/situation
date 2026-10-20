"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiError, apiRequest } from "../../../lib/api";

const inputClass = "field focus:border-[#a9513d] focus:ring-[#f1e2dc]";
const primaryButtonClass = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#a9513d] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#913f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30] disabled:cursor-not-allowed disabled:opacity-60";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!acceptedPolicies) {
      setError("Please accept the Terms & Conditions and Privacy Policy to create an account.");
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          date_of_birth: form.get("date_of_birth"),
          accept_terms: acceptedPolicies,
          accept_privacy: acceptedPolicies,
        }),
      });
      setComplete(true);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "We couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.19em] text-[#9a503f] sm:text-sm">
          Adults only · 18+
        </p>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,5vw,4rem)] leading-[1.05] tracking-[-0.04em] text-[#3b2025]">
          Start with clarity.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#685b56] sm:text-lg sm:leading-8">
          Tell people what you’re looking for before you start matching.
        </p>
      </section>

      <section className="rounded-3xl border border-[#eadfd9] bg-white p-6 shadow-[0_10px_30px_rgba(65,40,31,0.06)] sm:p-9">
        <h2 className="text-2xl font-bold text-[#302521]">Create your account</h2>
        <p className="mt-2 text-sm text-stone-500">It takes less than a minute.</p>
        {complete ? (
          <p className="notice-success mt-6">
            Account created. <Link className="font-semibold underline" href="/login">Log in to continue</Link>.
          </p>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <label>
              <span className="label">Email address</span>
              <input aria-label="Email" className={inputClass} name="email" type="email" placeholder="you@example.com" required />
            </label>
            <label>
              <span className="label">Date of birth</span>
              <input aria-label="Date of birth" className={inputClass} name="date_of_birth" type="date" required />
              <span className="mt-1 block text-xs leading-5 text-stone-500">You must be 18 or older to join.</span>
            </label>
            <label>
              <span className="label">Password</span>
              <span className="relative block">
                <input
                  aria-label="Password"
                  className={`${inputClass} pr-20`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  minLength={8}
                  autoComplete="new-password"
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
              <span className="mt-1 block text-xs leading-5 text-stone-500">
                Use at least 8 characters. Avoid common passwords and passwords based on your email.
              </span>
            </label>
            <div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-[#514540]">
                <input
                  className="mt-1 h-4 w-4 shrink-0 accent-[#a9513d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]"
                  type="checkbox"
                  name="accept_policies"
                  checked={acceptedPolicies}
                  onChange={(event) => {
                    setAcceptedPolicies(event.target.checked);
                    if (event.target.checked) setError("");
                  }}
                  aria-describedby={error && !acceptedPolicies ? "policy-acceptance-error" : undefined}
                  aria-invalid={Boolean(error && !acceptedPolicies)}
                />
                <span>
                  I agree to the <Link className="font-semibold text-[#913f30] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]" href="/terms">Terms &amp; Conditions</Link> and <Link className="font-semibold text-[#913f30] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]" href="/privacy">Privacy Policy</Link> of Situationship.
                </span>
              </label>
              {error && !acceptedPolicies && (
                <p id="policy-acceptance-error" role="alert" className="mt-1 text-sm text-red-800">
                  {error}
                </p>
              )}
            </div>
            {error && acceptedPolicies && <p role="alert" className="notice-error">{error}</p>}
            <button className={`${primaryButtonClass} w-full`} type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}
        <p className="mt-6 text-sm text-stone-600">
          Already have an account? <Link className="font-medium text-[#913f30] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]" href="/login">Log in</Link>.
        </p>
      </section>
    </main>
  );
}
