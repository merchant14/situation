"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Match = { public_id: string; profile: { display_name: string; age: number; city: string } };
export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { const token = sessionStorage.getItem("access_token"); if (!token) return setError("Log in to see matches."); apiRequest<{ results: Match[] }>("/matches/", { headers: { Authorization: `Bearer ${token}` } }).then((data) => setMatches(data.results)).catch(() => setError("Unable to load matches.")); }, []);
  return <main className="mx-auto max-w-2xl px-6 py-12"><h1 className="text-3xl font-semibold">Matches</h1>{error && <p className="mt-5 text-red-700">{error}</p>}{!error && matches.length === 0 && <p className="mt-5 text-stone-600">No matches yet. <Link className="underline" href="/discover">Discover people</Link>.</p>}<div className="mt-6 grid gap-3 sm:grid-cols-2">{matches.map((match) => <article className="rounded border p-4" key={match.public_id}><h2 className="font-semibold">{match.profile.display_name}, {match.profile.age}</h2><p>{match.profile.city}</p></article>)}</div></main>;
}
