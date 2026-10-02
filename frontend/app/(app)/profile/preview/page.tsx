"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../../../lib/api";
import { preferenceOptions, preferenceSections, type Preferences } from "../../../../lib/preferences";

type ProfileInterest = { id: number; name: string; slug: string };
type Profile = {
  display_name: string;
  gender: string;
  city: string;
  bio: string;
  photo_url: string | null;
  interests: ProfileInterest[];
};

function preferenceLabel(field: keyof Preferences, value: string) {
  return preferenceOptions[field].find(([key]) => key === value)?.[1] ?? value;
}

export default function ProfilePreviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    setError("");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [profileData, preferenceData] = await Promise.all([
        apiRequest<Profile>("/profile/me/", { headers }),
        apiRequest<Preferences>("/preferences/me/", { headers }).catch((reason: unknown) => {
          if (reason instanceof ApiError && reason.status === 404) return null;
          throw reason;
        }),
      ]);
      setProfile(profileData);
      setPreferences(preferenceData);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) { router.replace("/login"); return; }
      setError(reason instanceof ApiError && reason.status === 404
        ? "Create your profile before previewing it."
        : "We couldn’t load your profile preview. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const card = "rounded-2xl border border-[#eee7e5] bg-white p-5 shadow-[0_2px_8px_rgba(49,31,24,0.035)] sm:p-7";
  const editLink = "text-sm font-medium text-[#963f2e] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a9513d]";

  return <section className="mx-auto w-full max-w-[900px] min-w-0">
    <header className="mb-7">
      <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#536b57]">Your space</p>
      <h1 className="font-serif text-[38px] leading-tight tracking-[-0.035em] text-[#15100e] sm:text-[46px]">Profile Preview</h1>
      <p className="mt-3 text-[16px] leading-7 text-[#6e5c56]">See how your profile information appears to others.</p>
    </header>

    {loading ? <div role="status" aria-label="Loading profile preview" aria-busy="true" className="space-y-5">
      <div className="h-56 animate-pulse rounded-2xl border border-[#eee7e5] bg-white" />
      <div className="h-40 animate-pulse rounded-2xl border border-[#eee7e5] bg-white" />
    </div> : error ? <div role="alert" className={card}>
      <p className="text-sm leading-6 text-[#6e5c56]">{error}</p>
      <div className="mt-5 flex flex-wrap gap-4"><button type="button" onClick={() => void load()} className="min-h-11 rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Try again</button><Link href="/profile/edit" className={editLink}>Edit Profile</Link></div>
    </div> : profile && <div className="space-y-5">
      <section aria-label="Profile information" className={`${card} flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-7`}>
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[#eee7e5] bg-[#f2edeb] sm:h-32 sm:w-32">
          {profile.photo_url ? <img src={profile.photo_url} alt={`${profile.display_name} profile photo`} className="h-full w-full object-cover" /> : <div role="img" aria-label="No profile photo" className="flex h-full w-full items-center justify-center font-serif text-4xl text-[#9c6c5d]">{profile.display_name?.charAt(0)?.toUpperCase() || "?"}</div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3"><h2 className="break-words font-serif text-3xl text-[#241713]">{profile.display_name}</h2>{profile.city && <span className="rounded-full bg-[#f3f0f0] px-3 py-1 text-sm text-[#5f4b44]">{profile.city}</span>}</div>
          {profile.gender && <p className="mt-2 text-sm text-[#6e5c56]">{profile.gender.replaceAll("_", " ")}</p>}
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#594741]">{profile.bio || "No bio added yet."}</p>
        </div>
      </section>

      <section className={card} aria-labelledby="preview-preferences">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="preview-preferences" className="font-serif text-xl text-[#241713]">Connection Preferences</h2><Link href="/profile/preferences" className={editLink}>Edit Preferences</Link></div>
        {preferences ? <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">{preferenceSections.map(({ key, title }) => <div key={key} className="min-w-0 rounded-xl bg-[#f7f5f5] p-4"><dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#806d67]">{title}</dt><dd className="mt-1.5 break-words text-sm font-medium leading-5 text-[#342723]">{preferenceLabel(key, preferences[key])}</dd></div>)}</dl> : <p className="mt-4 text-sm leading-6 text-[#6e5c56]">Add your connection preferences to your profile.</p>}
      </section>

      <section className={card} aria-labelledby="preview-interests">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="preview-interests" className="font-serif text-xl text-[#241713]">Interests</h2><Link href="/profile/interests" className={editLink}>Edit Interests</Link></div>
        {profile.interests?.length ? <ul className="mt-5 flex flex-wrap gap-2" aria-label="Profile interests">{profile.interests.map((interest) => <li key={interest.id} className="max-w-full break-words rounded-full bg-[#f3f0f0] px-3.5 py-2 text-sm font-medium text-[#594741]">{interest.name}</li>)}</ul> : <p className="mt-4 text-sm leading-6 text-[#6e5c56]">Add interests to your profile.</p>}
      </section>

      <nav aria-label="Edit profile sections" className="flex flex-wrap gap-x-5 gap-y-3 px-1 pb-4">
        <Link href="/profile/edit" className={editLink}>Edit Profile</Link>
        <Link href="/profile/preferences" className={editLink}>Edit Preferences</Link>
        <Link href="/profile/interests" className={editLink}>Edit Interests</Link>
      </nav>
    </div>}
  </section>;
}
