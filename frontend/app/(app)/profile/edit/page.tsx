"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "../../../../lib/api";

type Profile = { public_id: string; display_name: string; gender: string; city: string; bio: string; photo_url: string | null };
type Fields = Pick<Profile, "display_name" | "gender" | "city" | "bio">;
type FieldName = keyof Fields | "photo";
const emptyFields: Fields = { display_name: "", gender: "", city: "", bio: "" };
const genderOptions = [["woman", "Woman"], ["man", "Man"], ["non_binary", "Non-binary"], ["other", "Other"], ["prefer_not_to_say", "Prefer not to say"]];
const imageTypes = ["image/jpeg", "image/jpg", "image/png"];

function fieldErrors(errors: unknown): Partial<Record<FieldName, string>> {
  if (!errors || typeof errors !== "object") return {};
  const result: Partial<Record<FieldName, string>> = {};
  for (const key of ["display_name", "gender", "city", "bio", "photo"] as const) {
    const value = (errors as Record<string, unknown>)[key];
    const message = Array.isArray(value) ? value.find((item) => typeof item === "string") : typeof value === "string" ? value : undefined;
    if (message) result[key] = message;
  }
  return result;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true); setPageError("");
    try {
      const data = await apiRequest<Profile>("/profile/me/", { headers: { Authorization: `Bearer ${token}` } });
      setProfile(data);
      setFields({ display_name: data.display_name ?? "", gender: data.gender ?? "", city: data.city ?? "", bio: data.bio ?? "" });
      setPreview(data.photo_url ?? null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      setPageError(error instanceof ApiError && error.status === 404 ? "Create your profile before editing it." : "We couldn’t load your profile. Please try again.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);
  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  function changeField(name: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSaveError(""); setSuccess(false);
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setErrors((current) => ({ ...current, photo: undefined })); setSaveError(""); setSuccess(false);
    if (!file) return;
    if (!imageTypes.includes(file.type)) { setPhoto(null); setPreview(profile?.photo_url ?? null); setErrors((current) => ({ ...current, photo: "Choose a JPG or PNG image." })); event.target.value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { setPhoto(null); setPreview(profile?.photo_url ?? null); setErrors((current) => ({ ...current, photo: "Choose an image that is 5 MB or smaller." })); event.target.value = ""; return; }
    setPhoto(file); setPreview(URL.createObjectURL(file));
  }

  function validate() {
    const next: Partial<Record<FieldName, string>> = {};
    if (!fields.display_name.trim()) next.display_name = "Enter a display name.";
    else if (fields.display_name.length > 50) next.display_name = "Display name must be 50 characters or fewer.";
    if (!fields.gender) next.gender = "Choose a gender.";
    if (!fields.city.trim()) next.city = "Enter your city.";
    else if (fields.city.length > 100) next.city = "City must be 100 characters or fewer.";
    if (fields.bio.length > 500) next.bio = "Bio must be 500 characters or fewer.";
    setErrors(next); return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving || !validate()) return;
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setSaving(true); setSaveError(""); setSuccess(false);
    const body = new FormData();
    body.append("display_name", fields.display_name.trim()); body.append("gender", fields.gender);
    body.append("city", fields.city.trim()); body.append("bio", fields.bio);
    if (photo) body.append("photo", photo);
    try {
      const updated = await apiRequest<Profile>("/profile/me/", { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body });
      setProfile(updated); setPhoto(null); setPreview(updated.photo_url ?? null);
      window.dispatchEvent(new Event("profile-updated"));
      setSuccess(true);
      window.setTimeout(() => router.push("/profile"), 850);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      if (error instanceof ApiError) {
        const mapped = fieldErrors(error.errors); setErrors(mapped);
        setSaveError(Object.keys(mapped).length ? "Please review the highlighted fields." : "We couldn’t save your changes. Please check your details and try again.");
      } else setSaveError("We couldn’t save your changes. Please try again.");
    } finally { setSaving(false); }
  }

  const inputClass = (name: FieldName) => `min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-[#2f211c] placeholder:text-[#a29189] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#a9513d] ${errors[name] ? "border-red-400" : "border-[#e6ddda]"}`;

  return <section className="mx-auto max-w-[820px]">
    <header className="mb-8">
      <Link href="/profile" className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#795e54] hover:text-[#a9513d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]" aria-label="Back to profile"><span aria-hidden="true">←</span> Back to profile</Link>
      <p className="mb-2 mt-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#536b57]">Your space</p>
      <h1 className="font-serif text-[38px] leading-tight tracking-[-0.035em] text-[#15100e] sm:text-[46px]">Edit your profile</h1>
      <p className="mt-3 max-w-xl text-[16px] leading-7 text-[#6e5c56]">A few details to help people get to know you.</p>
    </header>

    {loading ? <div aria-label="Loading profile" className="h-[560px] animate-pulse rounded-2xl border border-[#eee7e5] bg-white" /> : pageError ? <div role="alert" className="rounded-2xl border border-[#eee7e5] bg-white p-6 shadow-sm sm:p-8"><p className="text-sm leading-6 text-[#6e5c56]">{pageError}</p><button type="button" onClick={() => void loadProfile()} className="mt-5 min-h-11 rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Try again</button><Link href="/profile" className="ml-4 text-sm font-medium text-[#963f2e] underline underline-offset-2">Back to profile</Link></div> : profile && <form noValidate onSubmit={submit} className="overflow-hidden rounded-2xl border border-[#eee7e5] bg-white shadow-[0_2px_8px_rgba(49,31,24,0.045)]">
      <div className="space-y-8 p-5 sm:p-8 md:p-10">
        <section aria-labelledby="photo-heading">
          <h2 id="photo-heading" className="font-serif text-xl text-[#241713]">Profile photo</h2>
          <p className="mt-1 text-sm leading-6 text-[#806d67]">Choose a clear photo that feels like you. JPG or PNG, up to 5 MB.</p>
          <div className="mt-5 flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-center">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[#eee7e5] bg-[#f2edeb]">
              {preview ? <img src={preview} alt="Profile photo preview" className="h-full w-full object-cover" /> : <div role="img" aria-label="No profile photo selected" className="flex h-full w-full items-center justify-center font-serif text-3xl text-[#9c6c5d]">{fields.display_name.trim().charAt(0).toUpperCase() || "?"}</div>}
            </div>
            <div className="min-w-0">
              <input ref={fileInput} id="photo" type="file" accept="image/jpeg,image/png" onChange={choosePhoto} className="sr-only" aria-describedby={errors.photo ? "photo-error" : "photo-help"} />
              <label htmlFor="photo" className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[#e6ddda] bg-white px-4 text-sm font-semibold text-[#49352e] hover:bg-[#faf6f4] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#a9513d]">{photo ? "Choose a different photo" : profile.photo_url ? "Replace photo" : "Choose photo"}</label>
              <p id="photo-help" className="mt-2 text-xs leading-5 text-[#806d67]">Your photo is uploaded when you save changes.</p>
              {errors.photo && <p id="photo-error" className="mt-2 text-sm text-red-700">{errors.photo}</p>}
            </div>
          </div>
        </section>
        <div className="h-px bg-[#f0e9e6]" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div><label htmlFor="display_name" className="mb-2 block text-sm font-semibold text-[#49352e]">Display name</label><input id="display_name" className={inputClass("display_name")} value={fields.display_name} onChange={(event) => changeField("display_name", event.target.value)} maxLength={50} autoComplete="nickname" aria-invalid={!!errors.display_name} aria-describedby={errors.display_name ? "display_name-error" : undefined} />{errors.display_name && <p id="display_name-error" className="mt-1.5 text-sm text-red-700">{errors.display_name}</p>}</div>
          <div><label htmlFor="gender" className="mb-2 block text-sm font-semibold text-[#49352e]">Gender</label><select id="gender" className={inputClass("gender")} value={fields.gender} onChange={(event) => changeField("gender", event.target.value)} aria-invalid={!!errors.gender} aria-describedby={errors.gender ? "gender-error" : undefined}><option value="" disabled>Select gender</option>{genderOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{errors.gender && <p id="gender-error" className="mt-1.5 text-sm text-red-700">{errors.gender}</p>}</div>
          <div className="sm:col-span-2"><label htmlFor="city" className="mb-2 block text-sm font-semibold text-[#49352e]">City</label><input id="city" className={inputClass("city")} value={fields.city} onChange={(event) => changeField("city", event.target.value)} maxLength={100} autoComplete="address-level2" aria-invalid={!!errors.city} aria-describedby={errors.city ? "city-error" : undefined} />{errors.city && <p id="city-error" className="mt-1.5 text-sm text-red-700">{errors.city}</p>}</div>
          <div className="sm:col-span-2"><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="bio" className="text-sm font-semibold text-[#49352e]">A little about you <span className="font-normal text-[#806d67]">(optional)</span></label><span className="text-xs text-[#806d67]">{fields.bio.length}/500</span></div><textarea id="bio" className={`${inputClass("bio")} min-h-[140px] resize-y leading-6`} value={fields.bio} onChange={(event) => changeField("bio", event.target.value)} maxLength={500} placeholder="Write a short introduction that feels like you" aria-invalid={!!errors.bio} aria-describedby={errors.bio ? "bio-error" : undefined} />{errors.bio && <p id="bio-error" className="mt-1.5 text-sm text-red-700">{errors.bio}</p>}</div>
        </div>
        {saveError && <p role="alert" className="rounded-xl border border-[#ecd0c9] bg-[#fff5f2] px-4 py-3 text-sm text-[#873e30]">{saveError}</p>}
        {success && <p role="status" className="rounded-xl border border-[#d5e5d8] bg-[#f3f8f3] px-4 py-3 text-sm text-[#456149]">Your changes are saved. Returning to your profile…</p>}
      </div>
      <footer className="flex flex-col-reverse gap-3 border-t border-[#f0e9e6] bg-[#fdfbf9] p-5 sm:flex-row sm:justify-end sm:px-8 sm:py-5 md:px-10">
        <Link href="/profile" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e6ddda] bg-white px-5 text-sm font-semibold text-[#49352e] hover:bg-[#faf6f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Cancel</Link>
        <button type="submit" disabled={saving || success} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#a9513d] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving…" : success ? "Saved" : "Save changes"}</button>
      </footer>
    </form>}
  </section>;
}
