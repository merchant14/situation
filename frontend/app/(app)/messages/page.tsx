"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, getCurrentUserId } from "../../../lib/api";
import { getRecentChatMessages, type ChatMessage } from "../../../lib/chat";

type Match = {
  public_id: string;
  created_at: string;
  profile: { public_id: string; display_name: string; age: number; city: string; photo_url?: string | null };
};
type Conversation = { match: Match; latest: ChatMessage | null; unread: boolean };

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ConversationSkeleton() {
  return <div aria-hidden="true" className="flex animate-pulse items-center gap-4 rounded-2xl border border-[#eee7e5] bg-white p-4"><div className="h-14 w-14 shrink-0 rounded-full bg-[#eee9e7]"/><div className="min-w-0 flex-1"><div className="h-5 w-2/5 rounded bg-[#eee9e7]"/><div className="mt-3 h-4 w-4/5 rounded bg-[#f1edeb]"/></div><div className="h-3 w-12 rounded bg-[#f1edeb]"/></div>;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(false);
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }
    try {
      const currentUserId = await getCurrentUserId(token);
      const { results: matches } = await apiRequest<{ results: Match[] }>("/matches/", { headers: { Authorization: `Bearer ${token}` } });
      const items = await Promise.all(matches.map(async (match): Promise<Conversation> => {
        const messages = await getRecentChatMessages(match.public_id, token);
        const latest = messages[0] ?? null;
        const unread = Boolean(currentUserId && messages.some((message) => String(message.sender_id) !== currentUserId && !message.is_read));
        return { match, latest, unread };
      }));
      items.sort((a, b) => {
        const aTime = a.latest ? new Date(a.latest.created_at).getTime() : new Date(a.match.created_at).getTime();
        const bTime = b.latest ? new Date(b.latest.created_at).getTime() : new Date(b.match.created_at).getTime();
        return bTime - aTime;
      });
      setConversations(items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  return (
    <section>
      <header className="mb-8 flex flex-col gap-5 border-b border-[#eee7e5] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#a9513d]"><span className="h-1.5 w-1.5 rounded-full bg-[#a9513d]"/>Conversations</p>
          <h1 className="font-serif text-[40px] leading-none tracking-[-0.035em] text-[#15100e] sm:text-[48px]">Messages</h1>
          <p className="mt-3 text-[16px] text-[#6e5c56] sm:text-[18px]">Your conversations and connections.</p>
        </div>
      </header>

      {loading ? <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3"><ConversationSkeleton/><ConversationSkeleton/><ConversationSkeleton/></div>
        <div className="hidden min-h-[460px] animate-pulse rounded-2xl border border-[#eee7e5] bg-white lg:block"/>
      </div> : error ? (
        <div role="alert" className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#eee7e5] bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="font-serif text-2xl text-[#241713]">Something went wrong.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e5c56]">We couldn’t load your conversations.</p>
          <Link href="/login" className="mt-2 inline-block text-sm text-[#963f2e] underline">Log in to continue</Link>
          <div><button type="button" onClick={() => void loadConversations()} className="mt-6 rounded-xl bg-[#a9513d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#923f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Try Again</button></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-[#eee7e5] bg-[#f5f2f2] px-6 py-14 text-center sm:py-20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ebe7e7] text-[#a9513d]"><svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-9l-5 3V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 10h8m-8 4h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></div>
          <h2 className="mt-5 font-serif text-2xl text-[#191210]">No conversations yet.</h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-6 text-[#6e5c56]">Your conversations will appear here when you start chatting with a match.</p>
          <Link href="/matches" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-medium text-[#241713] shadow-sm hover:bg-[#eee9e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">Explore Matches</Link>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section aria-label="Conversations" className="min-w-0">
            <h2 className="mb-3 px-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#78645e]">Recent conversations ({conversations.length})</h2>
            <ul className="space-y-3">
              {conversations.map(({ match, latest, unread }) => <li key={match.public_id}>
                <Link href={`/matches/${match.public_id}/chat`} aria-label={`${match.profile.display_name}${unread ? ", unread message" : ""}: ${latest?.is_deleted ? "Message deleted" : latest?.body ?? "Start a conversation"}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eee7e5] bg-white p-4 shadow-[0_2px_5px_rgba(49,31,24,0.035)] transition hover:border-[#e2d3ce] hover:bg-[#fffdfc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d] sm:gap-4 sm:p-5">
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eee8e5] font-serif text-xl text-[#9c6c5d]">
                    {match.profile.photo_url ? <img src={match.profile.photo_url} alt={`${match.profile.display_name} profile`} className="h-full w-full object-cover"/> : <span aria-label={`${match.profile.display_name} profile photo unavailable`}>{match.profile.display_name.charAt(0).toUpperCase()}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2"><span className="truncate font-serif text-[19px] text-[#241713]">{match.profile.display_name}, {match.profile.age}</span>{unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[#a9513d]"/>}</span>
                    <span className={`mt-1 block truncate text-[13px] ${unread ? "font-semibold text-[#3e2c26]" : "text-[#74615b]"}`}>{latest ? latest.is_deleted ? "This message was deleted" : latest.body : "Start a conversation"}</span>
                    {unread && <span className="sr-only">Unread message</span>}
                  </span>
                  <span className="shrink-0 self-start pt-1 text-[11px] text-[#806d67]">{latest ? formatTimestamp(latest.created_at) : formatTimestamp(match.created_at)}</span>
                </Link>
              </li>)}
            </ul>
          </section>

          <aside className="hidden min-h-[460px] flex-col items-center justify-center rounded-2xl border border-[#eee7e5] bg-white px-8 py-12 text-center lg:flex">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f2edeb] text-[#a9513d]"><svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-9l-5 3V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8 10h8m-8 4h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></div>
            <h2 className="mt-5 font-serif text-2xl text-[#241713]">Select a conversation</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#6e5c56]">Choose a match to open your conversation and continue where you left off.</p>
          </aside>
        </div>
      )}
    </section>
  );
}
