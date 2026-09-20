"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiRequest } from "../../../lib/api";

export default function ProfileSetupPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Record<string, any> | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    apiRequest<Record<string, any>>("/profile/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        setExisting(data);
        setPreview(data.photo_url ?? null);
      })
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
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1"}/profile/me/`, {
        method: existing ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).message || "Upload failed");
      });
      setMessage(existing ? "Your profile changes have been saved." : "Your profile has been created. Next, set your connection preferences.");
      window.setTimeout(() => router.push(existing ? "/profile" : "/preferences"), 700);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save profile.");
    }
  }

  return <main className="app-page max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Your space</p><h1 className="mt-2 text-4xl font-bold text-rose-950">{existing ? "Edit your profile" : "Create your profile"}</h1><p className="mt-3 text-stone-600">Only your display name, city, bio, and preferences are shown to others.</p>
    {loading ? <div className="form-card mt-8 h-80 animate-pulse bg-stone-100" /> : <section className="form-card mt-8">{message && <p className="notice-success mb-5">{message}</p>}<form className="space-y-5" onSubmit={submit}>
      <label><span className="label">Display name</span><input aria-label="Display name" className="field" name="display_name" defaultValue={existing?.display_name} placeholder="How people will know you" maxLength={50} required /></label>
      <label>
        <span className="label">Profile photo <span className="font-normal text-stone-400">(JPG/PNG, ≤5 MB)</span></span>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-stone-100">
            {preview ? <img src={preview} alt="preview" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-bold text-rose-700">{existing?.display_name?.[0] ?? "?"}</div>}
          </div>
          <input aria-label="Photo" className="field" type="file" name="photo" accept="image/png,image/jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (!f) { setPreview(existing?.photo_url ?? null); return; } setPreview(URL.createObjectURL(f)); }} />
        </div>
      </label>
      <label><span className="label">Gender</span><select aria-label="Gender" className="field" name="gender" defaultValue={existing?.gender ?? ""} required><option disabled value="">Select gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="non_binary">Non-binary</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
      <label><span className="label">City</span><input aria-label="City" className="field" name="city" defaultValue={existing?.city} placeholder="Your city" maxLength={100} required /></label>
      <label><span className="label">A little about you <span className="font-normal text-stone-400">(optional)</span></span><textarea aria-label="Bio" className="field" name="bio" defaultValue={existing?.bio} placeholder="A short bio that feels like you" maxLength={500} rows={4} /></label>
      {error && <p className="notice-error">{error}</p>}<button className="btn-primary w-full" type="submit">{existing ? "Save changes" : "Create profile"}</button>
    </form></section>}
    <p className="mt-6 text-sm text-stone-600"><Link className="font-semibold text-rose-700 underline" href="/preferences">Set connection preferences</Link> · <Link className="underline" href="/login">Log in</Link></p>
  </main>;
}
