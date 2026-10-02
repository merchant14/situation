"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, getCurrentUserId } from "../../../lib/api";
import { getRecentChatMessages, type ChatMessage } from "../../../lib/chat";

type Match = {
  public_id: string;
  created_at: string;
  profile: { public_id: string; display_name: string; age: number; city: string; photo_url?: string | null };
};
type ApiNotification = {
  public_id: string;
  kind: "interest" | "match";
  title: string;
  body: string;
  actor_profile_id: string | null;
  actor_display_name: string | null;
  match_id: string | null;
  is_read: boolean;
  created_at: string;
};
type Activity =
  | { id: string; type: "interest" | "match"; notification: ApiNotification; createdAt: string; unread: boolean }
  | { id: string; type: "message"; match: Match; message: ChatMessage; createdAt: string; unread: boolean };

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (now.getTime() - date.getTime() < 7 * 86400000) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function NotificationSkeleton() {
  return <div aria-hidden="true" className="flex animate-pulse items-center gap-4 rounded-2xl border border-[#eee7e5] bg-white p-5"><div className="h-14 w-14 shrink-0 rounded-full bg-[#eee9e7]"/><div className="min-w-0 flex-1"><div className="h-5 w-1/3 rounded bg-[#eee9e7]"/><div className="mt-3 h-4 w-4/5 rounded bg-[#f1edeb]"/></div><div className="h-10 w-28 rounded-xl bg-[#f1edeb]"/></div>;
}

function ActivityIcon({ type }: { type: Activity["type"] }) {
  return <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${type === "match" ? "bg-[#f9dfd8] text-[#a9513d]" : "bg-[#e6ede5] text-[#536b57]"}`}>
    {type === "match" ? <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-6.5-4.2-8.4-8.1C2.4 9.4 3.3 6.5 6 5.7c1.6-.5 3.2.1 4.2 1.4C11.2 5.8 12.8 5.2 14.4 5.7c2.7.8 3.6 3.7 2.4 6.2C18.5 15.8 12 20 12 20Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg> : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-9l-5 3V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 10h8m-8 4h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
  </span>;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("We couldn’t load your notifications.");
      setLoading(false);
      return;
    }
    try {
      const userId = await getCurrentUserId(token);
      const headers = { Authorization: `Bearer ${token}` };
      const [{ results: matches }, { results: notifications }] = await Promise.all([
        apiRequest<{ results: Match[] }>("/matches/", { headers }),
        apiRequest<{ results: ApiNotification[] }>("/notifications/", { headers }),
      ]);
      const updates = await Promise.all(matches.map(async (match): Promise<Activity[]> => {
        const messages = await getRecentChatMessages(match.public_id, token);
        const latestIncoming = messages.find((message) => userId && String(message.sender_id) !== userId);
        const messageActivity: Activity[] = latestIncoming ? [{ id: `message-${latestIncoming.id}`, type: "message", match, message: latestIncoming, createdAt: latestIncoming.created_at, unread: !latestIncoming.is_read }] : [];
        return messageActivity;
      }));
      const notificationActivities: Activity[] = notifications.map((notification) => ({
        id: `notification-${notification.public_id}`,
        type: notification.kind,
        notification,
        createdAt: notification.created_at,
        unread: !notification.is_read,
      }));
      setActivities([...notificationActivities, ...updates.flat()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setError("We couldn’t load your notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadActivities(); }, [loadActivities]);

  async function markAllAsRead() {
    const token = sessionStorage.getItem("access_token");
    const unreadNotifications = activities.filter((item): item is Extract<Activity, { type: "interest" | "match" }> => item.type !== "message" && item.unread);
    const unreadMatchIds = [...new Set(activities.filter((item): item is Extract<Activity, { type: "message" }> => item.type === "message" && item.unread).map((item) => item.match.public_id))];
    if (!token || (unreadMatchIds.length === 0 && unreadNotifications.length === 0) || marking) return;
    setMarking(true);
    setError("");
    const results = await Promise.allSettled([
      ...unreadNotifications.map((item) => apiRequest<void>(`/notifications/${item.notification.public_id}/read/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })),
      ...unreadMatchIds.map((matchId) => apiRequest<void>(`/chat/${matchId}/messages/read/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })),
    ]);
    const succeededNotificationIds = new Set(unreadNotifications.filter((_, index) => results[index].status === "fulfilled").map((item) => item.notification.public_id));
    const messageResultOffset = unreadNotifications.length;
    const succeeded = new Set(unreadMatchIds.filter((_, index) => results[messageResultOffset + index].status === "fulfilled"));
    const failed = results.some((result) => result.status === "rejected");
    setActivities((current) => current.map((item) => {
      if (item.type === "message" && succeeded.has(item.match.public_id)) return { ...item, unread: false };
      if (item.type !== "message" && succeededNotificationIds.has(item.notification.public_id)) return { ...item, unread: false, notification: { ...item.notification, is_read: true } };
      return item;
    }));
    if (failed) setError("Some messages couldn’t be marked as read. Please try again.");
    setMarking(false);
  }

  const unreadCount = activities.filter((item) => item.unread).length;

  return (
    <section>
      <header className="mb-8 flex flex-col gap-5 border-b border-[#eee7e5] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[#536b57]"><span className="h-1.5 w-1.5 rounded-full bg-[#536b57]"/>Updates</p>
          <h1 className="font-serif text-[40px] leading-none tracking-[-0.035em] text-[#15100e] sm:text-[48px]">Notifications</h1>
          <p className="mt-3 text-[16px] text-[#6e5c56] sm:text-[18px]">Updates on your connections and interactions.</p>
        </div>
        {unreadCount > 0 && <button type="button" disabled={marking} onClick={() => void markAllAsRead()} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#f0eded] px-4 text-sm font-medium text-[#352822] hover:bg-[#e9e4e3] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d] sm:self-auto"><svg className="h-4 w-4 text-[#536b57]" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 12 5 5L20 6m-9 10 2 2 7-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>{marking ? "Marking…" : "Mark all as read"}</button>}
      </header>

      {error && !loading && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadbd6] bg-white px-4 py-3 text-sm text-[#78392c]"><span>{error}</span>{activities.length === 0 && <button type="button" onClick={() => void loadActivities()} className="font-semibold underline underline-offset-2">Try Again</button>}</div>}

      {loading ? <div className="space-y-4"><NotificationSkeleton/><NotificationSkeleton/><NotificationSkeleton/></div> : activities.length === 0 ? (
        <div className="rounded-2xl border border-[#eee7e5] bg-[#f5f2f2] px-6 py-14 text-center sm:py-20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ebe7e7] text-[#536b57]"><svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8m0-12.8L5.6 18.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
          <h2 className="mt-5 font-serif text-2xl text-[#191210]">You’re all caught up.</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-[#6e5c56]">No new notifications right now.</p>
        </div>
      ) : <div className="mx-auto max-w-[1120px] space-y-4">
        {activities.map((item) => {
          const messageItem = item.type === "message";
          const title = messageItem ? "New message" : item.notification.title;
          const description = messageItem ? item.message.is_deleted ? "This message was deleted." : item.message.body : item.notification.body;
          const href = messageItem
            ? `/matches/${item.match.public_id}/chat`
            : item.type === "match" && item.notification.match_id
              ? `/matches/${item.notification.match_id}/chat`
              : item.type === "interest" && item.notification.actor_profile_id
                ? `/profiles/${item.notification.actor_profile_id}`
                : null;
          const displayName = messageItem ? item.match.profile.display_name : item.type === "interest" ? item.notification.actor_display_name : null;
          return <article key={item.id} className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-[0_2px_5px_rgba(49,31,24,0.035)] sm:flex-row sm:items-center sm:p-6 ${item.unread ? "border-[#ead8d2] bg-[#fffdfc]" : "border-[#eee7e5] bg-white"}`}>
            {messageItem && item.match.profile.photo_url ? <img src={item.match.profile.photo_url} alt={`${item.match.profile.display_name} profile`} className="h-12 w-12 shrink-0 rounded-full object-cover"/> : <ActivityIcon type={item.type}/>}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className={`text-[15px] text-[#241713] ${item.unread ? "font-semibold" : "font-medium"}`}>{title}</h2>
                {item.unread && <span className="rounded-full bg-[#f4e8e4] px-2 py-0.5 text-[11px] font-medium text-[#854331]">Unread</span>}
                <time dateTime={item.createdAt} className="text-xs text-[#806d67]">{formatTimestamp(item.createdAt)}</time>
              </div>
              <p className={`mt-1 break-words text-[14px] leading-6 ${item.unread ? "text-[#392923]" : "text-[#6e5c56]"}`}>
                {messageItem && <span className="font-medium text-[#382721]">{displayName}: </span>}{description}
              </p>
            </div>
            {href && <Link href={href} onClick={item.type === "interest" ? async (event) => {
              event.preventDefault();
              const token = sessionStorage.getItem("access_token");
              if (token && item.unread) {
                try {
                  await apiRequest<void>(`/notifications/${item.notification.public_id}/read/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                  setActivities((current) => current.map((activity) => {
                    if (activity.id !== item.id || activity.type === "message") return activity;
                    return { ...activity, unread: false, notification: { ...activity.notification, is_read: true } };
                  }));
                } catch {
                  // Profile access is still useful if marking the notification read fails.
                }
              }
              router.push(href);
            } : undefined} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#f2efef] px-4 text-sm font-medium text-[#352822] hover:bg-[#e9e4e3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]">{messageItem ? "View message" : item.type === "interest" ? "View profile" : "View match"}</Link>}
          </article>;
        })}
      </div>}
    </section>
  );
}
