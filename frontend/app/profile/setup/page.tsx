"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { apiRequest } from "../../../lib/api";

export default function ProfileSetupPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    apiRequest<Record<string, string>>("/profile/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then(setExisting)
      .catch((requestError) => { if (requestError instanceof Error && "status" in requestError && requestError.status !== 404) setError("We couldn’t load your profile. Please refresh and try again."); })
      .finally(() => setLoading(false));
  }, []);

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
        method: existing ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          display_name: form.get("display_name"),
          gender: form.get("gender"),
          city: form.get("city"),
          bio: form.get("bio"),
        }),
      });
      setMessage(existing ? "Your profile changes have been saved." : "Your profile has been created. Next, set your connection preferences.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save profile.");
    }
  }

  return <main className="app-page max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Your space</p><h1 className="mt-2 text-4xl font-bold text-rose-950">{existing ? "Edit your profile" : "Create your profile"}</h1><p className="mt-3 text-stone-600">Only your display name, city, bio, and preferences are shown to others.</p>
    {loading ? <div className="form-card mt-8 h-80 animate-pulse bg-stone-100" /> : <section className="form-card mt-8">{message && <p className="notice-success mb-5">{message}</p>}<form className="space-y-5" onSubmit={submit}>
      <label><span className="label">Display name</span><input aria-label="Display name" className="field" name="display_name" defaultValue={existing?.display_name} placeholder="How people will know you" maxLength={50} required /></label>
      <label><span className="label">Gender</span><select aria-label="Gender" className="field" name="gender" defaultValue={existing?.gender ?? ""} required><option disabled value="">Select gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="non_binary">Non-binary</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
      <label><span className="label">City</span><input aria-label="City" className="field" name="city" defaultValue={existing?.city} placeholder="Your city" maxLength={100} required /></label>
      <label><span className="label">A little about you <span className="font-normal text-stone-400">(optional)</span></span><textarea aria-label="Bio" className="field" name="bio" defaultValue={existing?.bio} placeholder="A short bio that feels like you" maxLength={500} rows={4} /></label>
      {error && <p className="notice-error">{error}</p>}<button className="btn-primary w-full" type="submit">{existing ? "Save changes" : "Create profile"}</button>
    </form></section>}
    <p className="mt-6 text-sm text-stone-600"><Link className="font-semibold text-rose-700 underline" href="/preferences">Set connection preferences</Link> · <Link className="underline" href="/login">Log in</Link></p>
  </main>;
}
