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

  return <main className="mx-auto max-w-md px-6 py-16">
    <h1 className="text-3xl font-semibold">Welcome back</h1>
    {complete ? <p className="mt-6 rounded bg-emerald-50 p-4 text-emerald-800">You are signed in. <Link className="underline" href="/profile/setup">Create your profile</Link>.</p> :
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <input aria-label="Email" className="w-full rounded border p-3" name="email" type="email" placeholder="Email" required />
        <input aria-label="Password" className="w-full rounded border p-3" name="password" type="password" placeholder="Password" required />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="w-full rounded bg-stone-900 p-3 text-white" type="submit">Log in</button>
      </form>}
    <p className="mt-6 text-sm text-stone-600">New here? <Link className="underline" href="/signup">Create an account</Link>.</p>
  </main>;
}
