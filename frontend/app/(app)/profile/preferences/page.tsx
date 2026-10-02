"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../../../lib/api";
import { preferenceOptions, preferenceSections, type PreferenceField, type Preferences } from "../../../../lib/preferences";

function fieldErrors(errors: unknown): Partial<Record<PreferenceField, string>> {
  if (!errors || typeof errors !== "object") return {};
  const result: Partial<Record<PreferenceField, string>> = {};
  for (const key of Object.keys(preferenceOptions) as PreferenceField[]) {
    const value = (errors as Record<string, unknown>)[key];
    const message = Array.isArray(value) ? value.find((entry) => typeof entry === "string") : typeof value === "string" ? value : undefined;
    if (message) result[key] = message;
  }
  return result;
}

export default function ProfilePreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [values, setValues] = useState<Preferences>({ connection_goal: "", connection_style: "", exclusivity: "", meeting_frequency: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<PreferenceField, string>>>({});
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true); setLoadError("");
    try {
      const data = await apiRequest<Preferences>("/preferences/me/", { headers: { Authorization: `Bearer ${token}` } });
      setPreferences(data); setValues(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      if (error instanceof ApiError && error.status === 404) {
        setPreferences(null); setValues({ connection_goal: "", connection_style: "", exclusivity: "", meeting_frequency: "" });
      } else setLoadError("We couldn’t load your preferences. Please try again.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  function select(field: PreferenceField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError(""); setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const missing = {} as Partial<Record<PreferenceField, string>>;
    for (const section of preferenceSections) if (!values[section.key]) missing[section.key] = "Choose an option to continue.";
    if (Object.keys(missing).length) { setErrors(missing); setSaveError("Choose an option in each section before saving."); return; }
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setSaving(true); setSaveError(""); setSaved(false);
    try {
      const updated = await apiRequest<Preferences>("/preferences/me/", {
        method: preferences ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      setPreferences(updated); setValues(updated); setSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { router.replace("/login"); return; }
      if (error instanceof ApiError) {
        const mapped = fieldErrors(error.errors); setErrors(mapped);
        setSaveError(Object.keys(mapped).length ? "Please review the highlighted choices." : "We couldn’t save your preferences. Please try again.");
      } else setSaveError("We couldn’t save your preferences. Please try again.");
    } finally { setSaving(false); }
  }

  return <section className="mx-auto max-w-[900px]">
    <header className="mb-8">
      <Link href="/profile" className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#795e54] hover:text-[#a9513d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]"><span aria-hidden="true">←</span> Back to profile</Link>
      <p className="mb-2 mt-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#536b57]">What feels right to you</p>
      <h1 className="font-serif text-[38px] leading-tight tracking-[-0.035em] text-[#15100e] sm:text-[46px]">Preferences</h1>
      <p className="mt-3 max-w-xl text-[16px] leading-7 text-[#6e5c56]">Share what you’re looking for to help shape the people you discover. You can change these anytime.</p>
    </header>

    {loading ? <div aria-label="Loading preferences" className="animate-pulse space-y-5" aria-busy="true">{preferenceSections.map(({ key }) => <div key={key} className="rounded-2xl border border-[#eee7e5] bg-white p-5 sm:p-7"><div className="h-6 w-48 rounded bg-[#f0eae7]"/><div className="mt-3 h-4 w-64 max-w-full rounded bg-[#f5f1ef]"/><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-14 rounded-xl bg-[#f5f1ef]" />)}</div></div>)}</div> : loadError ? <div role="alert" className="rounded-2xl border border-[#eee7e5] bg-white p-6 shadow-sm sm:p-8"><p className="text-sm text-[#6e5c56]">{loadError}</p><button type="button" onClick={() => void load()} className="mt-5 min-h-11 rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Try again</button></div> : <form noValidate onSubmit={submit}>
      <div className="space-y-5">
        {preferenceSections.map(({ key, title, description }, index) => <fieldset key={key} className="min-w-0 rounded-2xl border border-[#eee7e5] bg-white p-5 shadow-[0_2px_8px_rgba(49,31,24,0.035)] sm:p-7">
          <legend className="sr-only">{title}</legend>
          <div className="flex items-start gap-3"><span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5eeeb] font-serif text-sm text-[#a9513d]">{index + 1}</span><div><h2 className="font-serif text-xl text-[#241713]">{title}</h2><p className="mt-1 text-sm leading-6 text-[#806d67]">{description}</p></div></div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {preferenceOptions[key].map(([value, label]) => {
              const checked = values[key] === value;
              return <label key={value} className={`relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${checked ? "border-[#bd7564] bg-[#fff8f5]" : "border-[#eee7e5] bg-white hover:border-[#d5c4be] hover:bg-[#fdfaf8]"}`}>
                <input type="radio" name={key} value={value} checked={checked} onChange={() => select(key, value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} className="h-4 w-4 shrink-0 accent-[#a9513d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]" />
                <span className={`text-sm leading-5 ${checked ? "font-semibold text-[#51352d]" : "font-medium text-[#493d38]"}`}>{label}</span>
                {checked && <span aria-hidden="true" className="ml-auto text-sm font-semibold text-[#a9513d]">Selected</span>}
              </label>;
            })}
          </div>
          {errors[key] && <p id={`${key}-error`} className="mt-2 text-sm text-red-700">{errors[key]}</p>}
        </fieldset>)}
      </div>
      <div className="mt-5 rounded-2xl border border-[#eee7e5] bg-white p-5 shadow-[0_2px_8px_rgba(49,31,24,0.035)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7">
        <div aria-live="polite" className="mb-4 min-h-5 sm:mb-0">
          {saveError && <p role="alert" className="text-sm text-[#873e30]">{saveError}</p>}
          {saved && <p role="status" className="text-sm text-[#456149]">Your preferences have been saved.</p>}
        </div>
        <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#a9513d] px-7 text-sm font-semibold text-white shadow-sm hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{saving ? "Saving…" : "Save preferences"}</button>
      </div>
    </form>}
  </section>;
}
