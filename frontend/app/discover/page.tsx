"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "../../lib/api";

type Profile = { public_id: string; display_name: string; age: number; gender: string; city: string; bio: string; connection_goal: string; connection_style: string; exclusivity: string; meeting_frequency: string };
type DiscoveryResponse = { count: number; results: Profile[] };

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return setError("Log in to discover people.");
    apiRequest<DiscoveryResponse>("/discover/", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setProfiles(response.results))
      .catch(() => setError("Unable to load discovery right now."));
  }, []);
  return <main className="mx-auto max-w-2xl px-6 py-12"><h1 className="text-3xl font-semibold">Discover</h1>{error && <p className="mt-5 text-red-700">{error} <Link className="underline" href="/login">Log in</Link></p>}{!error && profiles.length === 0 && <p className="mt-5 text-stone-600">No profiles to show yet. Check back soon.</p>}<div className="mt-6 grid gap-4 sm:grid-cols-2">{profiles.map((profile) => <article className="rounded-lg border bg-white p-5" key={profile.public_id}><h2 className="text-xl font-semibold">{profile.display_name}, {profile.age}</h2><p className="text-stone-600">{profile.city}</p>{profile.bio && <p className="mt-3">{profile.bio}</p>}<dl className="mt-4 space-y-1 text-sm text-stone-700"><div><dt className="inline font-medium">Looking for: </dt><dd className="inline">{profile.connection_goal.replaceAll("_", " ")}</dd></div><div><dt className="inline font-medium">Style: </dt><dd className="inline">{profile.connection_style}</dd></div><div><dt className="inline font-medium">Exclusivity: </dt><dd className="inline">{profile.exclusivity.replaceAll("_", " ")}</dd></div><div><dt className="inline font-medium">Meet: </dt><dd className="inline">{profile.meeting_frequency}</dd></div></dl></article>)}</div></main>;
}
