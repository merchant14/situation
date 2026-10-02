"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../lib/api";

type Match = {
  public_id: string;
  profile: { public_id: string; display_name: string; age: number; city: string; photo_url?: string | null };
};
type MatchResponse = { results: Match[] };

function MatchCardSkeleton() {
  return <div aria-hidden="true" className="animate-pulse rounded-2xl border border-[#eee7e5] bg-white p-5 shadow-sm"><div className="h-52 rounded-xl bg-[#eee9e7]"/><div className="mt-5 h-7 w-2/3 rounded bg-[#eee9e7]"/><div className="mt-3 h-4 w-1/2 rounded bg-[#f1edeb]"/><div className="mt-6 h-12 rounded-xl bg-[#eee9e7]"/><div className="mt-3 h-10 rounded-xl bg-[#f1edeb]"/></div>;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);
  const [unmatching, setUnmatching] = useState(false);
  const [actionError, setActionError] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(false);
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }
    try {
      const response = await apiRequest<MatchResponse>("/matches/", { headers: { Authorization: `Bearer ${token}` } });
      setMatches(response.results);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMatches(); }, [loadMatches]);
  useEffect(() => {
    if (!selected) return;
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !unmatching) setSelected(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, unmatching]);

  async function confirmUnmatch() {
    if (!selected || unmatching) return;
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setActionError("Please log in again before unmatching.");
      return;
    }
    setUnmatching(true);
    setActionError("");
    try {
      await apiRequest<void>(`/matches/${selected.public_id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setMatches((current) => current.filter((match) => match.public_id !== selected.public_id));
      setSelected(null);
    } catch {
      setActionError("We couldn’t unmatch this connection. Please try again.");
    } finally {
      setUnmatching(false);
    }
  }

  return (
    <section>
      <header className="mb-8 border-b border-[#eee7e5] pb-7">
        <p className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#7b655e]"><span className="h-1.5 w-1.5 rounded-full bg-[#a9513d]"/>Mutual connections</p>
        <h1 className="font-serif text-[40px] leading-none tracking-[-0.035em] text-[#15100e] sm:text-[48px]">Matches</h1>
        <p className="mt-3 text-[16px] text-[#6e5c56] sm:text-[18px]">People you’ve mutually connected with.</p>
      </header>

      {actionError && !selected && <p role="alert" className="mb-5 rounded-xl border border-[#eadbd6] bg-white px-4 py-3 text-sm text-[#78392c]">{actionError}</p>}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><MatchCardSkeleton/><MatchCardSkeleton/><MatchCardSkeleton/></div>
      ) : error ? (
        <div role="alert" className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#eee7e5] bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="font-serif text-2xl text-[#241713]">Something went wrong.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e5c56]">We couldn’t load your matches.</p>
          <Link href="/login" className="mt-2 inline-block text-sm text-[#963f2e] underline">Log in to continue</Link>
          <div><button type="button" onClick={() => void loadMatches()} className="mt-6 rounded-xl bg-[#a9513d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Try Again</button></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-[#eee7e5] bg-[#f5f2f2] px-6 py-14 text-center sm:py-20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ebe7e7] text-[#a9513d]"><svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12c0-2.8 3.6-5 8-5s8 2.2 8 5-3.6 5-8 5-8-2.2-8-5Z" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7c-2.8 0-5 2.2-5 5s2.2 5 5 5m0-10c2.8 0 5 2.2 5 5s-2.2 5-5 5" stroke="currentColor" strokeWidth="1.7"/></svg></div>
          <h2 className="mx-auto mt-5 max-w-xl font-serif text-2xl leading-snug text-[#191210] sm:text-[28px]">No matches yet.</h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-6 text-[#6e5c56]">When someone you’re interested in is interested in you too, your connection will appear here.</p>
          <Link href="/discover" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-[#241713] shadow-sm hover:bg-[#eee9e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="m14.7 9.3-2 4.1-3.4 1.3 2-4.1 3.4-1.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>Explore Discover</Link>
        </div>
      ) : (
        <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => <article key={match.public_id} className="flex min-w-0 flex-col rounded-2xl border border-[#eee7e5] bg-white p-4 shadow-[0_2px_5px_rgba(49,31,24,0.04)] sm:p-5">
            <Link href={`/matches/${match.public_id}/chat`} aria-label={`Open conversation with ${match.profile.display_name}`} className="group relative block aspect-[1.42/1] overflow-hidden rounded-xl bg-[#eee9e7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">
              {match.profile.photo_url ? <img src={match.profile.photo_url} alt={`${match.profile.display_name} profile`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"/> : <div role="img" aria-label={`${match.profile.display_name} profile photo unavailable`} className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e9ded8] via-[#eee8e4] to-[#ded8d3] font-serif text-6xl text-[#9c6c5d]">{match.profile.display_name.charAt(0).toUpperCase()}</div>}
            </Link>
            <div className="mt-5 flex items-baseline justify-between gap-3">
              <h2 className="min-w-0 truncate font-serif text-[25px] leading-tight text-[#17110f]">{match.profile.display_name}, {match.profile.age}</h2>
              <p className="shrink-0 text-right text-[12px] text-[#6e5c56]">{match.profile.city}</p>
            </div>
            <div className="mt-auto pt-5">
              <Link href={`/matches/${match.public_id}/chat`} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a9513d] px-4 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-9l-5 3V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>Message</Link>
              <button type="button" onClick={() => { setActionError(""); setSelected(match); }} className="mt-2 min-h-10 w-full rounded-xl text-[13px] font-medium text-[#765e56] hover:bg-[#f7f4f3] hover:text-[#8c392a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Unmatch</button>
            </div>
          </article>)}
        </div>
      )}

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211713]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !unmatching) setSelected(null); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="unmatch-title" aria-describedby="unmatch-description" className="w-full max-w-md rounded-2xl border border-[#eee7e5] bg-white p-6 shadow-xl sm:p-7">
          <h2 id="unmatch-title" className="font-serif text-2xl text-[#241713]">Unmatch from {selected.profile.display_name}?</h2>
          <p id="unmatch-description" className="mt-3 text-sm leading-6 text-[#6e5c56]">You will no longer be able to message this person.</p>
          {actionError && <p role="alert" className="mt-4 rounded-lg bg-[#fbefec] px-3 py-2 text-sm text-[#8c392a]">{actionError}</p>}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button ref={cancelRef} type="button" disabled={unmatching} onClick={() => setSelected(null)} className="min-h-11 rounded-xl border border-[#ded5d2] px-4 text-sm font-medium text-[#4c3a34] hover:bg-[#f8f5f4] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Cancel</button>
            <button type="button" disabled={unmatching} onClick={() => void confirmUnmatch()} className="min-h-11 rounded-xl bg-[#a9513d] px-4 text-sm font-semibold text-white hover:bg-[#923f30] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">{unmatching ? "Unmatching…" : "Unmatch"}</button>
          </div>
        </section>
      </div>}
    </section>
  );
}
