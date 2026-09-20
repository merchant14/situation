"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../../lib/api";

type Message = { id: string; sender_id: number; body: string; created_at: string };
type MatchProfile = { display_name: string; photo_url?: string };

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const paramsObj = React.use(params) as { matchId: string };
  const matchId = paramsObj.matchId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setError("Log in to open chat."); setLoading(false); return; }

    // mark as read
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1"}/chat/${matchId}/messages/read/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    // load messages
    apiRequest<{ results: Message[]; profile: MatchProfile }>(`/chat/${matchId}/messages/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        setMessages(data.results || []);
        // some APIs may return the other user's profile with the messages
        if ((data as any).profile) setProfile((data as any).profile);
      })
      .catch(() => setError("Unable to load messages."))
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => { // scroll to bottom when messages change
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    setError("");
    const body = input.trim();
    if (!body) return;
    if (body.length > 2000) { setError("Message cannot exceed 2000 characters."); return; }
    const token = sessionStorage.getItem("access_token");
    if (!token) { setError("Please log in."); return; }
    setSending(true);
    try {
      const resp = await apiRequest<{ data: Message }>(`/chat/${matchId}/messages/`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ body }) });
      const message = (resp as any).data as Message;
      setMessages((m) => [...m, message]);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send message.");
    } finally { setSending(false); }
  }

  return <main className="mx-auto max-w-2xl px-6 py-8">
    <div className="flex items-center gap-4">
      <Link className="text-sm text-stone-600 underline" href="/matches">Back</Link>
      <h1 className="text-2xl font-semibold">{profile ? profile.display_name : "Chat"}</h1>
      {profile?.photo_url && <div className="ml-auto h-10 w-10 overflow-hidden rounded-full"><img src={profile.photo_url} alt={profile.display_name} className="h-full w-full object-cover"/></div>}
    </div>

    <div className="mt-6 h-[60vh] overflow-auto rounded-lg border bg-white p-4" ref={listRef}>
      {loading ? <p className="text-stone-500">Loading messages…</p> : (
        messages.length === 0 ? <p className="text-stone-500">No messages yet. Say hello!</p> : (
          messages.map((m) => {
            const me = sessionStorage.getItem("user_id") && String(sessionStorage.getItem("user_id")) === String(m.sender_id);
            return <div key={m.id} className={`mb-3 flex ${me ? "justify-end" : "justify-start"}`}>
              <div className={`${me ? "bg-rose-600 text-white" : "bg-stone-100 text-stone-900"} max-w-[80%] rounded-xl px-4 py-2`}>{m.body}</div>
            </div>;
          })
        )
      )}
    </div>

    <div className="mt-4 flex gap-3">
      <textarea className="field flex-1" rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message… (max 2000)" maxLength={2000} />
      <div className="flex items-end">
        <button className="btn-primary" onClick={send} disabled={sending || input.trim().length === 0}>{sending ? "Sending…" : "Send"}</button>
      </div>
    </div>
    {error && <p className="notice-error mt-3">{error}</p>}
  </main>;
}
