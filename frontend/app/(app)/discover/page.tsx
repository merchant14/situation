"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { ReportDialog } from "../../components/report-dialog";

type Profile = {
  public_id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  connection_goal: string;
  connection_style: string;
  exclusivity: string;
  meeting_frequency: string;
  photo_url?: string | null;
  compatibility_score?: number;
};

type DiscoveryResponse = { count: number; results: Profile[] };
type ActionResponse = { success: boolean; data: { decision: "interested" | "pass"; matched: boolean } };

const labels: Record<string, string> = {
  situationship: "Situationship",
  casual_dating: "Casual dating",
  companionship: "Companionship",
  friendship_romantic: "Friendship with romantic potential",
  open_to_relationship: "Open to relationship",
  emotional: "Emotional connection",
  romantic: "Romantic",
  physical: "Physical",
  social: "Social / companionship",
  combination: "Combination",
  yes: "Exclusive",
  no: "Open to defined exclusivity",
  not_sure: "Still deciding",
  weekly: "Once a week",
  monthly: "2–3 times a month",
  occasionally: "Occasionally",
  flexible: "Flexible",
};

function valueLabel(value: string) {
  return labels[value] ?? value.replaceAll("_", " ");
}

function ProfileSkeleton() {
  return (
    <div aria-label="Loading recommendations" className="mx-auto mt-8 max-w-[770px] animate-pulse overflow-hidden rounded-[26px] border border-[#eee7e5] bg-white">
      <div className="aspect-[4/3] bg-[#eee9e7] sm:aspect-[1.35/1]" />
      <div className="space-y-6 p-6 sm:p-9">
        <div className="h-4 w-20 rounded bg-[#eee9e7]" />
        <div className="h-7 w-2/3 rounded bg-[#eee9e7]" />
        <div className="h-24 rounded-xl bg-[#f3f0ef]" />
        <div className="h-14 rounded-xl bg-[#eee9e7]" />
        <div className="grid grid-cols-2 gap-3"><div className="h-12 rounded-xl bg-[#eee9e7]" /><div className="h-12 rounded-xl bg-[#eee9e7]" /></div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState("");
  const [reporting, setReporting] = useState<Profile | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(false);
    setNotice("");
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }
    try {
      const response = await apiRequest<DiscoveryResponse>("/discover/", { headers: { Authorization: `Bearer ${token}` } });
      setProfiles(response.results);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfiles(); }, [loadProfiles]);

  async function act(profile: Profile, decision: "interested" | "pass") {
    const token = sessionStorage.getItem("access_token");
    if (!token || acting) return;
    setActing(true);
    setNotice("");
    try {
      const response = await apiRequest<ActionResponse>("/interests/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_profile_id: profile.public_id, decision }),
      });
      setProfiles((current) => current.filter((candidate) => candidate.public_id !== profile.public_id));
      if (response.data.matched) setNotice(`You and ${profile.display_name} are a mutual match.`);
    } catch {
      setNotice("We couldn’t save your response. Please try again.");
    } finally {
      setActing(false);
    }
  }

  async function block(profile: Profile) {
    const token = sessionStorage.getItem("access_token");
    if (!token || !window.confirm(`Block ${profile.display_name}? You will no longer see each other.`)) return;
    try {
      await apiRequest("/blocks/", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ target_profile_id: profile.public_id }) });
      setProfiles((current) => current.filter((candidate) => candidate.public_id !== profile.public_id));
    } catch {
      setNotice("We couldn’t block this profile. Please try again.");
    }
  }

  const profile = profiles[0];

  return (
    <section>
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#a9513d]"><span className="h-1.5 w-1.5 rounded-full bg-[#a9513d]" />Curated recommendations</p>
          <h1 className="font-serif text-[40px] leading-none tracking-[-0.035em] text-[#15100e] sm:text-[48px]">Discover</h1>
          <p className="mt-3 text-[16px] text-[#6e5c56] sm:text-[18px]">People who match your preferences.</p>
        </div>
        <Link href="/profile/preferences" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#e9dfdc] bg-[#f5f1f1] px-5 text-sm font-medium text-[#36241e] shadow-sm hover:bg-[#eee8e7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">
          <svg className="h-5 w-5 text-[#a9513d]" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h10M18 7h2M4 12h2m4 0h10M4 17h10m4 0h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="16" cy="7" r="2" fill="currentColor"/><circle cx="8" cy="12" r="2" fill="currentColor"/><circle cx="16" cy="17" r="2" fill="currentColor"/></svg>
          Preferences &amp; Intentions
        </Link>
      </header>

      {notice && <p role="status" className="mx-auto mb-4 max-w-[770px] rounded-xl border border-[#eadbd6] bg-white px-4 py-3 text-sm text-[#63483f]">{notice}</p>}
      {loading ? <ProfileSkeleton /> : error ? (
        <div role="alert" className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#eee7e5] bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="font-serif text-2xl text-[#241713]">Something went wrong.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e5c56]">We couldn’t load your recommendations.</p>
          <Link href="/login" className="mt-2 inline-block text-sm text-[#963f2e] underline">Log in to continue</Link>
          <div><button type="button" onClick={() => void loadProfiles()} className="mt-6 rounded-xl bg-[#a9513d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Try Again</button></div>
        </div>
      ) : !profile ? (
        <div className="mx-auto mt-10 max-w-[770px] rounded-2xl border border-[#eee7e5] bg-white px-6 py-14 text-center shadow-sm sm:py-20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2edeb] text-[#a9513d]"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8m0-12.8L5.6 18.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
          <h2 className="mt-5 font-serif text-2xl text-[#241713]">No more profiles right now.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6e5c56]">We’ve reached the end of your current recommendations.</p>
          <Link href="/profile/preferences" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Review Preferences</Link>
        </div>
      ) : (
        <article className="mx-auto mt-8 max-w-[770px] overflow-hidden rounded-[26px] border border-[#eee7e5] bg-white shadow-[0_2px_5px_rgba(49,31,24,0.06)]">
          <div className="relative aspect-[4/3] bg-[#eee9e7] sm:aspect-[1.35/1]">
            {profile.photo_url ? <img src={profile.photo_url} alt={`${profile.display_name}, a recommended profile`} className="absolute inset-0 h-full w-full object-cover" /> : <div role="img" aria-label={`${profile.display_name} profile photo unavailable`} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e9ded8] via-[#eee8e4] to-[#ded8d3] font-serif text-7xl text-[#9c6c5d]">{profile.display_name.charAt(0).toUpperCase()}</div>}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 px-6 pb-6 text-white sm:px-8 sm:pb-7">
              <h2 className="font-serif text-[29px] leading-tight sm:text-[34px]">{profile.display_name}, {profile.age}</h2>
              <span aria-hidden="true" className="text-white/70">·</span>
              <p className="text-sm text-white/95">{profile.city}</p>
            </div>
            {typeof profile.compatibility_score === "number" && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#39251f] shadow-sm sm:left-5 sm:top-5">{profile.compatibility_score}% compatible</span>}
          </div>
          <div className="p-6 sm:p-9">
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#a9513d]">About</h3>
              <p className="mt-2 text-[16px] leading-[1.7] text-[#40312c]">{profile.bio || "This person hasn’t added an introduction yet."}</p>
            </section>

            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 rounded-2xl border border-[#eee5e2] bg-[#f7f5f5] p-5 sm:grid-cols-2 sm:p-6">
              {([["Connection goal", profile.connection_goal, "#a9513d"], ["Connection style", profile.connection_style, "#62765f"], ["Exclusivity", profile.exclusivity, "#9a6727"], ["Meeting frequency", profile.meeting_frequency, "#8c7771"]] as const).map(([label, value, color]) => (
                <div key={label}>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#7e6d67]">{label}</dt>
                  <dd className="mt-1.5 flex items-start gap-2 text-[14px] font-medium leading-5 text-[#342723]"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />{valueLabel(value)}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-[#f0eae8] pt-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={acting} onClick={() => void act(profile, "pass")} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#ded5d2] bg-white px-5 text-sm font-semibold text-[#3d2d27] hover:bg-[#f8f5f4] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>{acting ? "Saving…" : "Pass"}</button>
                <button type="button" disabled={acting} onClick={() => void act(profile, "interested")} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 8.8c0 4.3-8.8 10-8.8 10s-8.8-5.7-8.8-10A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>{acting ? "Saving…" : "Interested"}</button>
              </div>
            </div>
            <details className="mt-4 border-t border-[#f0eae8] pt-3 text-sm text-[#75635d]">
              <summary className="w-fit cursor-pointer rounded px-1 py-2 underline decoration-[#cbbab4] underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]">Safety tools</summary>
              <div className="flex flex-wrap gap-4 pb-1 pt-2">
                <button type="button" onClick={() => setReporting(profile)} className="rounded px-1 py-1 text-[#604d46] underline underline-offset-2 hover:text-[#963f2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]">Report profile</button>
                <button type="button" onClick={() => void block(profile)} className="rounded px-1 py-1 text-[#8e3929] underline underline-offset-2 hover:text-[#6d291d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]">Block profile</button>
              </div>
            </details>
          </div>
        </article>
      )}
      {reporting && <ReportDialog profileId={reporting.public_id} name={reporting.display_name} onClose={() => setReporting(null)} />}
    </section>
  );
}
