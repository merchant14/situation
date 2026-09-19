"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiRequest } from "../../../lib/api";

export default function ProfileSetupPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("Please log in before creating a profile.");
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/profile/me/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          display_name: form.get("display_name"),
          gender: form.get("gender"),
          city: form.get("city"),
          bio: form.get("bio"),
        }),
      });
      setMessage("Profile saved. Open the preferences step to continue.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save profile.");
    }
  }

  return <main className="mx-auto max-w-md px-6 py-16">
    <h1 className="text-3xl font-semibold">Create your profile</h1>
    {message ? <p className="mt-6 rounded bg-emerald-50 p-4 text-emerald-800">{message}</p> : <form className="mt-8 space-y-4" onSubmit={submit}>
      <input aria-label="Display name" className="w-full rounded border p-3" name="display_name" placeholder="Display name" maxLength={50} required />
      <select aria-label="Gender" className="w-full rounded border p-3" name="gender" defaultValue="" required><option disabled value="">Select gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="non_binary">Non-binary</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select>
      <input aria-label="City" className="w-full rounded border p-3" name="city" placeholder="City" maxLength={100} required />
      <textarea aria-label="Bio" className="w-full rounded border p-3" name="bio" placeholder="A short bio (optional)" maxLength={500} rows={4} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="w-full rounded bg-stone-900 p-3 text-white" type="submit">Save profile</button>
    </form>}
    <p className="mt-6 text-sm text-stone-600"><Link className="underline" href="/preferences">Set connection preferences</Link> or <Link className="underline" href="/login">log in</Link> first.</p>
  </main>;
}
