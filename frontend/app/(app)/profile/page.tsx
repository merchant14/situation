"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "../../../lib/api";

type Profile = {
  public_id: string;
  display_name: string;
  gender: string;
  city: string;
  bio?: string;
  photo_url?: string | null;
};

type Preferences = {
  connection_goal: string;
  connection_style: string;
  exclusivity: string;
  meeting_frequency: string;
};

const preferenceLabels: Record<string, string> = {
  situationship: "Situationship",
  casual_dating: "Casual dating",
  companionship: "Companionship",
  friendship_romantic: "Friendship with romantic potential",
  open_to_relationship: "Open to a relationship",
  emotional: "Emotional",
  romantic: "Romantic",
  physical: "Physical",
  social: "Social / companionship",
  combination: "Combination",
  yes: "Yes",
  no: "No",
  not_sure: "Not sure",
  woman: "Woman",
  man: "Man",
  non_binary: "Non-binary",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
  weekly: "Once a week",
  monthly: "2–3 times a month",
  occasionally: "Occasionally",
  flexible: "Flexible",
};

function labelFor(value: string) {
  return preferenceLabels[value] ?? value.replaceAll("_", " ");
}

function ProfileSkeleton() {
  return <div aria-label="Loading profile" className="animate-pulse">
    <div className="h-56 rounded-2xl border border-[#eee7e5] bg-white sm:h-48" />
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.95fr)]">
      <div className="space-y-6"><div className="h-64 rounded-2xl border border-[#eee7e5] bg-white"/><div className="h-44 rounded-2xl border border-[#eee7e5] bg-white"/></div>
      <div className="h-[420px] rounded-2xl border border-[#eee7e5] bg-white"/>
    </div>
  </div>;
}

function EditLink({ children = "Edit Profile" }: { children?: ReactNode }) {
  return <Link href="/profile/edit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">{children}</Link>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(false);
    setProfileMissing(false);
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    const [profileResult, preferencesResult] = await Promise.allSettled([
      apiRequest<Profile>("/profile/me/", { headers }),
      apiRequest<Preferences>("/preferences/me/", { headers }),
    ]);
    if (profileResult.status === "fulfilled") {
      setProfile(profileResult.value);
    } else if (profileResult.reason instanceof ApiError && profileResult.reason.status === 404) {
      setProfileMissing(true);
      setProfile(null);
    } else {
      setError(true);
    }
    setPreferences(preferencesResult.status === "fulfilled" ? preferencesResult.value : null);
    setLoading(false);
  }, [router]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  return (
    <section>
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#536b57]"><span className="h-1.5 w-1.5 rounded-full bg-[#a9513d]"/>Self reflection</p>
          <h1 className="font-serif text-[40px] leading-none tracking-[-0.035em] text-[#15100e] sm:text-[48px]">Profile</h1>
          <p className="mt-3 text-[16px] text-[#6e5c56] sm:text-[18px]">How your profile appears to others.</p>
        </div>
        {!loading && !error && !profileMissing && profile && <EditLink />}
      </header>

      {loading ? <ProfileSkeleton /> : error ? (
        <div role="alert" className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#eee7e5] bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="font-serif text-2xl text-[#241713]">Something went wrong.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e5c56]">We couldn’t load your profile.</p>
          <button type="button" onClick={() => void loadProfile()} className="mt-6 rounded-xl bg-[#a9513d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Try Again</button>
        </div>
      ) : profileMissing || !profile ? (
        <div className="mx-auto mt-10 max-w-[760px] rounded-2xl border border-[#eee7e5] bg-white px-6 py-14 text-center shadow-sm sm:py-20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2edeb] text-[#a9513d]"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></div>
          <h2 className="mt-5 font-serif text-2xl text-[#241713]">Your profile is waiting to take shape.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6e5c56]">Add your details so people can get to know you.</p>
          <div className="mt-6"><EditLink>Create Profile</EditLink></div>
        </div>
      ) : (
        <>
          <section aria-label="Profile summary" className="flex flex-col gap-6 rounded-2xl border border-[#eee7e5] bg-[radial-gradient(ellipse_at_left,_#eff5ef_0%,_#ffffff_42%,_#fff7f5_100%)] p-6 shadow-[0_2px_5px_rgba(49,31,24,0.035)] sm:flex-row sm:items-center sm:gap-8 sm:p-8">
            <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-full border-[5px] border-[#f1eeec] bg-[#eee8e5] sm:mx-0 sm:h-36 sm:w-36">
              {profile.photo_url ? <img src={profile.photo_url} alt={`${profile.display_name} profile photo`} className="h-full w-full object-cover"/> : <div role="img" aria-label={`${profile.display_name} profile photo placeholder`} className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e9ded8] via-[#eee8e4] to-[#ded8d3] font-serif text-5xl text-[#9c6c5d]">{profile.display_name.charAt(0).toUpperCase()}</div>}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <h2 className="font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#17110f] sm:text-[32px]">{profile.display_name}</h2>
                <span className="rounded-full bg-[#f2efef] px-3 py-1 text-xs text-[#5f4b44]">{profile.city}</span>
              </div>
              <p className="mt-4 max-w-3xl text-[16px] leading-7 text-[#594741]">{profile.bio || "Add a short introduction so people can understand you better."}</p>
              {!profile.bio && <Link href="/profile/edit" className="mt-2 inline-block text-sm font-medium text-[#963f2e] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]">Add a bio</Link>}
            </div>
          </section>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.95fr)]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#eee7e5] bg-white p-6 shadow-[0_2px_5px_rgba(49,31,24,0.035)] sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9dd] text-[#536b57]"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5h14v14H5zM8 9h8m-8 3h8m-8 3h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span><h2 className="text-[12px] font-medium uppercase tracking-[0.09em] text-[#432d26]">Connection preferences</h2></div>
                  {preferences && <Link href="/profile/preferences" className="text-sm font-medium text-[#963f2e] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]">Edit preferences</Link>}
                </div>
                {preferences ? <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([["Connection goal", preferences.connection_goal], ["Connection style", preferences.connection_style], ["Exclusivity", preferences.exclusivity], ["Meeting frequency", preferences.meeting_frequency]] as const).map(([title, value]) => <div key={title} className="rounded-xl bg-[#f3f0f0] p-4"><dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#806d67]">{title}</dt><dd className="mt-1.5 text-sm font-medium leading-5 text-[#342723]">{labelFor(value)}</dd></div>)}
                </dl> : <div className="mt-6 rounded-xl bg-[#f7f5f5] p-5"><p className="text-sm leading-6 text-[#6e5c56]">Complete your connection preferences to share what you’re looking for.</p><Link href="/profile/preferences" className="mt-3 inline-block text-sm font-medium text-[#963f2e] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]">Set preferences</Link></div>}
              </section>
              <section className="rounded-2xl border border-[#eee7e5] bg-white p-6 shadow-[0_2px_5px_rgba(49,31,24,0.035)] sm:p-8">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe1c5] text-[#8e552c]"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h10l4 4v12H5zM15 4v5h4M8 13h8m-8 3h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></svg></span><h2 className="text-[12px] font-medium uppercase tracking-[0.09em] text-[#432d26]">Interests</h2></div>
                <p className="mt-5 text-sm leading-6 text-[#6e5c56]">Interests aren’t part of the profile information currently available.</p>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-[#eee7e5] bg-[#f5f2f2] p-6 sm:p-7">
                <h2 className="text-[12px] font-medium uppercase tracking-[0.09em] text-[#432d26]">Profile details</h2>
                <dl className="mt-5 space-y-4">
                  <div><dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#806d67]">City</dt><dd className="mt-1 text-sm font-medium text-[#342723]">{profile.city}</dd></div>
                  <div><dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#806d67]">Gender</dt><dd className="mt-1 text-sm font-medium text-[#342723]">{labelFor(profile.gender)}</dd></div>
                </dl>
                <div className="mt-6"><EditLink>Edit Profile</EditLink></div>
              </section>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
