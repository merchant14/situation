"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "../../../../lib/api";

type ExistingProfile = { display_name?: string; gender?: string; city?: string; bio?: string; photo_url?: string | null };

const imageTypes = ["image/jpeg", "image/jpg", "image/png"];
const maxPhotoSize = 5 * 1024 * 1024;
const inputClass = "min-h-12 w-full rounded-xl border border-[#e6ddda] bg-white px-4 py-3 text-[15px] text-[#2f211c] placeholder:text-[#a29189] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#a9513d]";

export default function ProfileSetupPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [existing, setExisting] = useState<ExistingProfile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const previewObjectUrl = useRef<string | null>(null);
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

    return () => {
      if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    };
  }, [router]);

  function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoError("");
      if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
      setPreview(existing?.photo_url ?? null);
      return;
    }

    if (!imageTypes.includes(file.type)) {
      event.target.value = "";
      if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
      setPreview(existing?.photo_url ?? null);
      setPhotoError("Choose a JPG or PNG image.");
      return;
    }
    if (file.size > maxPhotoSize) {
      event.target.value = "";
      if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
      setPreview(existing?.photo_url ?? null);
      setPhotoError("Choose an image that is 5 MB or smaller.");
      return;
    }

    setPhotoError("");
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = URL.createObjectURL(file);
    setPreview(previewObjectUrl.current);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (photoError) return;
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

  return (
    <section className="mx-auto w-full max-w-[820px] pt-8 md:pt-10">
      <header className="mb-8">
        <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#9a503f]">YOUR SPACE</p>
        <h1 className="font-serif text-[38px] leading-tight tracking-[-0.035em] text-[#3b2025] sm:text-[46px]">
          {existing ? "Edit your profile" : "Create your profile"}
        </h1>
        <p className="mt-3 max-w-xl text-[16px] leading-7 text-[#6e5c56]">
          Only your display name, city, bio, and preferences are shown to others.
        </p>
      </header>

      {loading ? (
        <div aria-label="Loading profile" className="h-[560px] animate-pulse rounded-2xl border border-[#eadfd9] bg-white" />
      ) : error && !existing ? (
        <section role="alert" className="rounded-2xl border border-[#eadfd9] bg-white p-6 shadow-[0_2px_8px_rgba(49,31,24,0.045)] sm:p-8">
          <p className="text-sm leading-6 text-[#6e5c56]">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-11 rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]">Try again</button>
        </section>
      ) : (
        <section className="rounded-2xl border border-[#eadfd9] bg-white p-5 shadow-[0_2px_8px_rgba(49,31,24,0.045)] sm:p-8 md:p-10">
          {message && <p role="status" className="notice-success mb-5">{message}</p>}
          <form className="space-y-6" onSubmit={submit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#514540]">Display name</span>
              <input aria-label="Display name" className={inputClass} name="display_name" defaultValue={existing?.display_name} placeholder="How people will know you" maxLength={50} required />
            </label>

            <div>
              <span className="mb-2 block text-sm font-semibold text-[#514540]">Profile photo <span className="font-normal text-[#8b7b74]">(JPG/PNG, maximum 5 MB)</span></span>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#eee7e5] bg-[#f5f1ef]">
                  {preview ? (
                    <img src={preview} alt="Profile photo preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-[#9a503f]">{existing?.display_name?.[0] ?? "?"}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <input
                    id="profile-photo"
                    aria-label="Choose a profile photo"
                    aria-describedby={photoError ? "profile-photo-help profile-photo-error" : "profile-photo-help"}
                    aria-invalid={Boolean(photoError)}
                    className="peer sr-only"
                    type="file"
                    name="photo"
                    accept="image/png,image/jpeg"
                    onChange={selectPhoto}
                  />
                  <label htmlFor="profile-photo" className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[#d8c5bd] bg-[#fffaf7] px-4 text-sm font-semibold text-[#913f30] transition hover:bg-[#f7ede8] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#873e30]">
                    Choose photo
                  </label>
                  <p id="profile-photo-help" className="mt-2 text-xs leading-5 text-[#806d67]">JPG or PNG, up to 5 MB. Your photo uploads when you save.</p>
                  {photoError && <p id="profile-photo-error" role="alert" className="mt-1 text-sm text-red-800">{photoError}</p>}
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#514540]">Gender</span>
              <select aria-label="Gender" className={inputClass} name="gender" defaultValue={existing?.gender ?? ""} required>
                <option disabled value="">Select gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="non_binary">Non-binary</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#514540]">City</span>
              <input aria-label="City" className={inputClass} name="city" defaultValue={existing?.city} placeholder="Your city" maxLength={100} required />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#514540]">A little about you <span className="font-normal text-[#8b7b74]">(optional)</span></span>
              <textarea aria-label="Bio" className={inputClass} name="bio" defaultValue={existing?.bio} placeholder="A short bio that feels like you" maxLength={500} rows={4} />
            </label>

            {error && <p role="alert" className="notice-error">{error}</p>}
            <button className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#a9513d] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#913f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={saving || Boolean(photoError)}>
              {saving ? "Saving…" : existing ? "Save changes" : "Create profile"}
            </button>
          </form>
        </section>
      )}

      <p className="mt-6 text-sm text-[#6e5c56]">
        <Link className="font-semibold text-[#913f30] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]" href="/profile/preferences">Set connection preferences</Link> <span aria-hidden="true">·</span> <Link className="font-semibold text-[#913f30] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]" href="/login">Log in</Link>
      </p>
    </section>
  );
}
