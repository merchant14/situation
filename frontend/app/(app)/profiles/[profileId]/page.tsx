"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

type PublicProfile = {
  public_id: string;
  display_name: string;
  age: number;
  gender: string;
  city: string;
  bio: string;
  connection_goal: string;
  connection_style: string;
  exclusivity: string;
  meeting_frequency: string;
  photo_url?: string | null;
};
type InterestResponse = { success: boolean; data: { decision: "interested" | "pass"; matched: boolean; match_id?: string } };

const labels: Record<string, string> = {
  situationship: "Situationship", casual_dating: "Casual dating", companionship: "Companionship",
  friendship_romantic: "Friendship with romantic potential", open_to_relationship: "Open to relationship",
  emotional: "Emotional connection", romantic: "Romantic", physical: "Physical", social: "Social / companionship",
  combination: "Combination", yes: "Exclusive", no: "Open to defined exclusivity", not_sure: "Still deciding",
  weekly: "Once a week", monthly: "2–3 times a month", occasionally: "Occasionally", flexible: "Flexible",
};

function formatValue(value: string) {
  return labels[value] ?? value.replaceAll("_", " ");
}

export default function NotificationProfilePage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [matchId, setMatchId] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const token = sessionStorage.getItem("access_token");
      if (!token) {
        setError("Please log in to view this profile.");
        setLoading(false);
        return;
      }
      try {
        const result = await apiRequest<PublicProfile>(`/profile/${profileId}/`, { headers: { Authorization: `Bearer ${token}` } });
        if (active) setProfile(result);
      } catch {
        if (active) setError("This profile is no longer available.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [profileId]);

  async function expressInterest() {
    const token = sessionStorage.getItem("access_token");
    if (!token || !profile || acting) return;
    setActing(true);
    setError("");
    setNotice("");
    try {
      const response = await apiRequest<InterestResponse>("/interests/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_profile_id: profile.public_id, decision: "interested" }),
      });
      if (response.data.matched && response.data.match_id) {
        setMatchId(response.data.match_id);
        setNotice(`You and ${profile.display_name} matched!`);
      } else {
        setNotice(`Your interest was sent to ${profile.display_name}.`);
      }
    } catch {
      setError("We couldn’t save your interest. Please try again.");
    } finally {
      setActing(false);
    }
  }

  return (
    <section>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#eee7e5] pb-6">
        <div>
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#536b57]">From your notifications</p>
          <h1 className="font-serif text-[36px] leading-none tracking-[-0.035em] text-[#15100e] sm:text-[44px]">Profile</h1>
        </div>
        <Link href="/notifications" className="inline-flex min-h-11 items-center rounded-xl border border-[#ded5d2] bg-white px-4 text-sm font-medium text-[#352822] hover:bg-[#f8f5f4]">Back to notifications</Link>
      </header>

      {loading ? <div aria-label="Loading profile" className="mx-auto max-w-[770px] animate-pulse overflow-hidden rounded-[26px] border border-[#eee7e5] bg-white"><div className="aspect-[4/3] bg-[#eee9e7]"/><div className="space-y-4 p-7"><div className="h-7 w-1/2 rounded bg-[#eee9e7]"/><div className="h-20 rounded bg-[#f3f0ef]"/></div></div> : error ? (
        <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-[#eee7e5] bg-white px-6 py-12 text-center">
          <h2 className="font-serif text-2xl text-[#241713]">Profile unavailable</h2>
          <p className="mt-2 text-sm text-[#6e5c56]">{error}</p>
          <Link href="/notifications" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white">Return to notifications</Link>
        </div>
      ) : profile ? (
        <article className="mx-auto max-w-[770px] overflow-hidden rounded-[26px] border border-[#eee7e5] bg-white shadow-[0_2px_5px_rgba(49,31,24,0.06)]">
          <div className="relative aspect-[4/3] bg-[#eee9e7] sm:aspect-[1.35/1]">
            {profile.photo_url ? <img src={profile.photo_url} alt={`${profile.display_name} profile`} className="absolute inset-0 h-full w-full object-cover"/> : <div role="img" aria-label={`${profile.display_name} profile photo placeholder`} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e9ded8] via-[#eee8e4] to-[#ded8d3] font-serif text-7xl text-[#9c6c5d]">{profile.display_name.charAt(0).toUpperCase()}</div>}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/65 via-black/15 to-transparent"/>
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 px-6 pb-6 text-white sm:px-8 sm:pb-7">
              <h2 className="font-serif text-[29px] leading-tight sm:text-[34px]">{profile.display_name}, {profile.age}</h2>
              <span aria-hidden="true" className="text-white/70">·</span><p className="text-sm text-white/95">{profile.city}</p>
            </div>
          </div>
          <div className="p-6 sm:p-9">
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#a9513d]">About</h3>
              <p className="mt-2 text-[16px] leading-[1.7] text-[#40312c]">{profile.bio || "This person hasn’t added an introduction yet."}</p>
            </section>
            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 rounded-2xl border border-[#eee5e2] bg-[#f7f5f5] p-5 sm:grid-cols-2 sm:p-6">
              {([ ["Connection goal", profile.connection_goal], ["Connection style", profile.connection_style], ["Exclusivity", profile.exclusivity], ["Meeting frequency", profile.meeting_frequency] ] as const).map(([label, value]) => <div key={label}><dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#7e6d67]">{label}</dt><dd className="mt-1.5 text-sm font-medium leading-5 text-[#342723]">{formatValue(value)}</dd></div>)}
            </dl>
            {error && <p role="alert" className="mt-5 rounded-xl bg-[#fbefec] px-4 py-3 text-sm text-[#8c392a]">{error}</p>}
            {notice && <p role="status" className="mt-5 rounded-xl border border-[#dce9dd] bg-[#f3f7f3] px-4 py-3 text-sm text-[#435e47]">{notice}</p>}
            <div className="mt-6 border-t border-[#f0eae8] pt-5">
              {matchId ? <Link href={`/matches/${matchId}/chat`} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30]">Open your match</Link> : <button type="button" disabled={acting} onClick={() => void expressInterest()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a9513d] px-5 text-sm font-semibold text-white hover:bg-[#923f30] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">{acting ? "Sending…" : "Interested"}</button>}
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}
