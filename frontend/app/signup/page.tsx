"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiRequest } from "../../lib/api";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create your account.");
    }
  }

  return <main className="mx-auto max-w-md px-6 py-16">
    <h1 className="text-3xl font-semibold">Create an account</h1>
    <p className="mt-2 text-stone-600">You must be 18 or older to join.</p>
    {complete ? <p className="mt-6 rounded bg-emerald-50 p-4 text-emerald-800">Account created. <Link className="underline" href="/login">Log in</Link> to continue.</p> :
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <input aria-label="Email" className="w-full rounded border p-3" name="email" type="email" placeholder="Email" required />
        <input aria-label="Date of birth" className="w-full rounded border p-3" name="date_of_birth" type="date" required />
        <input aria-label="Password" className="w-full rounded border p-3" name="password" type="password" placeholder="Password" minLength={8} required />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="w-full rounded bg-stone-900 p-3 text-white" type="submit">Create account</button>
      </form>}
    <p className="mt-6 text-sm text-stone-600">Already have an account? <Link className="underline" href="/login">Log in</Link>.</p>
  </main>;
}
