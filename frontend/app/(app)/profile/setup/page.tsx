"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../../../lib/api";

type ExistingProfile = { display_name?: string; gender?: string; city?: string; bio?: string; photo_url?: string | null };

export default function ProfileSetupPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<ExistingProfile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    apiRequest<ExistingProfile>("/profile/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => { setExisting(data); setPreview(data.photo_url ?? null); })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof ApiError && requestError.status === 404)) setError("We couldn’t load your profile. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await apiRequest<ExistingProfile>("/profile/me/", { method: existing ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      window.dispatchEvent(new Event("profile-updated"));
      setMessage(existing ? "Your profile changes have been saved." : "Your profile has been created. Next, set your connection preferences.");
      window.setTimeout(() => router.push(existing ? "/profile" : "/profile/preferences"), 700);
    } catch {
      setError("We couldn’t save your profile. Please check your details and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="max-w-2xl">
    <p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Your space</p>
    <h1 className="mt-2 text-4xl font-bold text-rose-950">{existing ? "Edit your profile" : "Create your profile"}</h1>
    <p className="mt-3 text-stone-600">Only your display name, city, bio, and preferences are shown to others.</p>
    {loading ? <div aria-label="Loading profile" className="form-card mt-8 h-80 animate-pulse bg-stone-100"/> : error && !existing ? <section role="alert" className="form-card mt-8"><p>{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 font-semibold text-rose-700 underline">Try again</button></section> : <section className="form-card mt-8">
      {message && <p role="status" className="notice-success mb-5">{message}</p>}
      <form className="space-y-5" onSubmit={submit}>
        <label><span className="label">Display name</span><input aria-label="Display name" className="field" name="display_name" defaultValue={existing?.display_name} placeholder="How people will know you" maxLength={50} required/></label>
        <label><span className="label">Profile photo <span className="font-normal text-stone-400">(JPG/PNG, ≤5 MB)</span></span><div className="flex items-center gap-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">{preview ? <img src={preview} alt="Profile photo preview" className="h-full w-full object-cover"/> : <div className="flex h-full w-full items-center justify-center text-xl font-bold text-rose-700">{existing?.display_name?.[0] ?? "?"}</div>}</div><input aria-label="Photo" className="field min-w-0" type="file" name="photo" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (!file) { setPreview(existing?.photo_url ?? null); return; } setPreview(URL.createObjectURL(file)); }}/></div></label>
        <label><span className="label">Gender</span><select aria-label="Gender" className="field" name="gender" defaultValue={existing?.gender ?? ""} required><option disabled value="">Select gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="non_binary">Non-binary</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
        <label><span className="label">City</span><input aria-label="City" className="field" name="city" defaultValue={existing?.city} placeholder="Your city" maxLength={100} required/></label>
        <label><span className="label">A little about you <span className="font-normal text-stone-400">(optional)</span></span><textarea aria-label="Bio" className="field" name="bio" defaultValue={existing?.bio} placeholder="A short bio that feels like you" maxLength={500} rows={4}/></label>
        {error && <p role="alert" className="notice-error">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={saving}>{saving ? "Saving…" : existing ? "Save changes" : "Create profile"}</button>
      </form>
    </section>}
    <p className="mt-6 text-sm text-stone-600"><Link className="font-semibold text-rose-700 underline" href="/profile/preferences">Set connection preferences</Link> · <Link className="underline" href="/login">Log in</Link></p>
  </main>;
}
