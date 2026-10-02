"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../../../lib/api";
import { getRecentChatMessages, type ChatMessage } from "../../../../../lib/chat";

type Message = ChatMessage;

type MatchProfile = { display_name: string; photo_url?: string | null };
type MatchResponse = { results: { public_id: string; profile: MatchProfile }[] };

function formatTime(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = React.use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const userId = typeof window !== "undefined" ? sessionStorage.getItem("user_id") : null;

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("Log in to open chat.");
      setLoading(false);
      return;
    }

    void apiRequest<void>(`/chat/${matchId}/messages/read/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);

    Promise.all([
      getRecentChatMessages(matchId, token),
      apiRequest<MatchResponse>("/matches/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
    ])
      .then(([messages, matches]) => {
        setMessages(messages.filter((message) => Boolean(message?.body)));
        setProfile(matches?.results.find((match) => match.public_id === matchId)?.profile ?? null);
      })
      .catch(() => setError("We couldn’t load this conversation. Please try again."))
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    setError("");
    const body = input.trim();
    if (!body) return;
    if (body.length > 2000) {
      setError("Message cannot exceed 2000 characters.");
      return;
    }
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("Please log in.");
      return;
    }
    setSending(true);
    try {
      const message = await apiRequest<Message>(`/chat/${matchId}/messages/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body }),
      });
      setMessages((m) => [...m, message]);
      setInput("");
    } catch {
      setError("We couldn’t send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId: string) {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    try {
      await apiRequest(`/chat/${matchId}/messages/${messageId}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((m) =>
        m.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_deleted: true, body: "[This message was deleted]" }
            : msg
        )
      );
    } catch {
      setError("We couldn’t delete that message. Please try again.");
    }
  }

  async function handleEdit(messageId: string) {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    const body = editText.trim();
    if (!body) return;
    setSending(true);
    try {
      const updated = await apiRequest<Message>(`/chat/${matchId}/messages/${messageId}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body }),
      });
      setMessages((m) => m.map((msg) => (msg.id === messageId ? updated : msg)));
      setEditingId(null);
      setEditText("");
      setMenuOpen(null);
    } catch {
      setError("We couldn’t save your edit. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <div className="flex items-center gap-4">
        <Link className="text-sm text-stone-600 underline" href="/matches">
          Back
        </Link>
        <h1 className="text-2xl font-semibold">{profile ? profile.display_name : "Chat"}</h1>
        {profile?.photo_url && (
          <div className="ml-auto h-10 w-10 overflow-hidden rounded-full">
            <img src={profile.photo_url} alt={profile.display_name} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <div className="mt-6 h-[60vh] overflow-auto rounded-lg border bg-white p-4" ref={listRef}>
        {loading ? (
          <p className="text-stone-500">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-stone-500">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => {
            const isOwn = userId && String(userId) === String(m.sender_id);
            return (
              <div key={m.id} className="mb-4 flex items-end gap-2 group">
                {isOwn && (
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Message actions"
                      className="p-1 text-lg leading-none text-stone-600 opacity-0 group-hover:opacity-100 hover:text-stone-900 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                      onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                    >
                      ⋮
                    </button>
                    {menuOpen === m.id && !m.is_deleted && (
                      <div className="absolute bottom-full right-0 z-50 mb-2 rounded border border-stone-300 bg-white shadow-lg">
                        {editingId === m.id ? (
                          <>
                            <button className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-stone-100" onClick={() => handleEdit(m.id)} disabled={sending}>
                              Save
                            </button>
                            <button className="block w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-100" onClick={() => { setEditingId(null); setEditText(""); setMenuOpen(null); }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-stone-100" onClick={() => { setEditingId(m.id); setEditText(m.body); }}>
                              Edit
                            </button>
                            <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-stone-100" onClick={() => { handleDelete(m.id); setMenuOpen(null); }}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  <div className={`${m.is_deleted ? "italic text-stone-400" : isOwn ? "bg-rose-600 text-white" : "bg-stone-100 text-stone-900"} max-w-xs rounded-xl px-4 py-2`}>
                    {editingId === m.id ? (
                      <textarea className="field w-full" value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={2000} />
                    ) : (
                      m.body
                    )}
                  </div>
                  <div className="mt-1 flex gap-2 text-xs text-stone-500">
                    <span>{formatTime(m.created_at)}</span>
                    {m.is_edited && <span>(edited)</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <textarea className="field flex-1" rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message… (max 2000)" maxLength={2000} />
        <div className="flex items-end">
          <button className="btn-primary" onClick={send} disabled={sending || input.trim().length === 0}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
      {error && <p className="notice-error mt-3">{error}</p>}
    </main>
  );
}
