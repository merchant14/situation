"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Match = { public_id: string; profile: { display_name: string; age: number; city: string; photo_url?: string } };
export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { const token = sessionStorage.getItem("access_token"); if (!token) return setError("Log in to see matches."); apiRequest<{ results: Match[] }>("/matches/", { headers: { Authorization: `Bearer ${token}` } }).then((data) => setMatches(data.results)).catch(() => setError("Unable to load matches.")); }, []);
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Matches</h1>
      {error && <p className="mt-5 text-red-700">{error}</p>}
      {!error && matches.length === 0 && (
        <p className="mt-5 text-stone-600">No matches yet. <Link className="underline" href="/discover">Discover people</Link>.</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {matches.map((match) => (
          <article className="rounded border p-4" key={match.public_id}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-lg bg-stone-100">
                {match.profile.photo_url ? <img src={match.profile.photo_url} className="h-full w-full object-cover" alt={match.profile.display_name} /> : <div className="flex h-full w-full items-center justify-center font-semibold">{match.profile.display_name[0]}</div>}
              </div>
              <div>
                <h2 className="font-semibold">{match.profile.display_name}, {match.profile.age}</h2>
                <p>{match.profile.city}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link className="btn-primary" href={`/matches/${match.public_id}/chat`}>Open Chat</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
