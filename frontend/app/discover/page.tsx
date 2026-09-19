"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "../../lib/api";
import { ReportDialog } from "../components/report-dialog";

type Profile = { public_id: string; display_name: string; age: number; gender: string; city: string; bio: string; connection_goal: string; connection_style: string; exclusivity: string; meeting_frequency: string; photo_url?: string };
type DiscoveryResponse = { count: number; results: Profile[] };

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reporting, setReporting] = useState<Profile | null>(null);
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return setError("Log in to discover people.");
    apiRequest<DiscoveryResponse>("/discover/", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setProfiles(response.results))
      .catch(() => setError("Unable to load discovery right now."));
  }, []);
  async function act(profile: Profile, decision: "interested" | "pass") { const token = sessionStorage.getItem("access_token"); if (!token) return setError("Log in to take an action."); try { const response = await apiRequest<{ data: { matched: boolean } }>("/interests/", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ target_profile_id: profile.public_id, decision }) }); setProfiles((items) => items.filter((item) => item.public_id !== profile.public_id)); if (response.data.matched) setMessage(`It's a match with ${profile.display_name}!`); } catch { setError("Unable to save your choice."); } }
  async function block(profile: Profile) { const token = sessionStorage.getItem("access_token"); if (!token || !window.confirm(`Block ${profile.display_name}? You will no longer see each other.`)) return; try { await apiRequest("/blocks/", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ target_profile_id: profile.public_id }) }); setProfiles((items) => items.filter((item) => item.public_id !== profile.public_id)); setMessage(`${profile.display_name} has been blocked.`); } catch { setError("Unable to block this profile."); } }
  return <main className="app-page"><div className="flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-rose-600">Explore</p><h1 className="mt-2 text-4xl font-bold text-rose-950">Discover people</h1></div><Link className="btn-secondary hidden sm:block" href="/matches">View matches</Link></div>{message && <p className="notice-success mt-6">{message}</p>}{error && <p className="notice-error mt-6">{error} <Link className="font-semibold underline" href="/login">Log in</Link></p>}{!error && profiles.length === 0 && <div className="form-card mt-8 text-center text-stone-600">No profiles to show yet. Check back soon.</div>}<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{profiles.map((profile) => <article className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm" key={profile.public_id}><div className="flex h-28 items-end bg-gradient-to-br from-rose-200 via-orange-100 to-amber-50 p-5"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-rose-700 shadow-sm">{profile.display_name[0]}</div></div><div className="p-5"><h2 className="text-xl font-bold">{profile.display_name}, {profile.age}</h2><p className="mt-1 text-sm text-stone-500">{profile.city}</p>{profile.bio && <p className="mt-4 text-sm leading-6 text-stone-600">{profile.bio}</p>}<div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{profile.connection_goal.replaceAll("_", " ")}</span><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">{profile.connection_style}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button className="btn-secondary px-3 py-2" onClick={() => act(profile, "pass")}>Pass</button><button className="btn-primary px-3 py-2" onClick={() => act(profile, "interested")}>Interested</button></div><div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3"><span className="text-xs font-medium text-stone-400">Safety tools</span><div className="flex gap-3"><button className="text-xs font-semibold text-stone-500 underline hover:text-rose-700" onClick={() => setReporting(profile)}>Report</button><button className="text-xs font-semibold text-rose-700 underline" onClick={() => block(profile)}>Block profile</button></div></div></div></article>)}</div>{reporting && <ReportDialog profileId={reporting.public_id} name={reporting.display_name} onClose={() => setReporting(null)} />}</main>;
}
