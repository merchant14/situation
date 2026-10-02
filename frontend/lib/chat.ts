import { apiRequest } from "./api";

export type ChatMessage = {
  id: string;
  sender_id: number;
  body: string;
  is_read: boolean;
  is_deleted: boolean;
  edited_at?: string | null;
  is_edited: boolean;
  created_at: string;
};

type ChatMessagePage = { count: number; results: ChatMessage[] };
const DEFAULT_PAGE_SIZE = 20;

/** Loads the newest message page for a conversation preview and recent unread state. */
export async function getRecentChatMessages(matchId: string, token: string): Promise<ChatMessage[]> {
  const path = `/chat/${matchId}/messages/`;
  const headers = { Authorization: `Bearer ${token}` };
  const firstPage = await apiRequest<ChatMessagePage>(path, { headers });
  const pageSize = firstPage.results.length || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(firstPage.count / pageSize);
  const recentPage = pageCount > 1
    ? await apiRequest<ChatMessagePage>(`${path}?page=${pageCount}`, { headers })
    : firstPage;
  return recentPage.results
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
