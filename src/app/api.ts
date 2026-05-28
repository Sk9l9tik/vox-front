const BASE_URL = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    if (text) data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`Server error (${res.status})`);
    return data as T;
  }
  if (!res.ok) throw new Error((data.error as string) ?? `Request failed (${res.status})`);
  return data as T;
}

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
};

export type AuthResponse = { token: string; user: ApiUser };

export type ApiChat = {
  id: number;
  type: 'private' | 'group';
  name?: string;
  created_at?: string;
};

export type ApiChatEntry = {
  id: number;
  type: 'private' | 'group';
  name?: string;
  members?: number[];
  created_by?: number;
};

export type ApiMessage = {
  id: number;
  chat_id: number;
  sender_id: number;
  text: string;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
};

export const api = {
  register: (body: { username: string; email: string; password: string }) =>
    request<AuthResponse>("/users/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/users/login", { method: "POST", body: JSON.stringify(body) }),

  getUser: (id: number) =>
    request<ApiUser>(`/users/${id}`),

  updateUser: (id: number, token: string, body: { username?: string; display_name?: string; bio?: string; avatar_url?: string }) =>
    request<ApiUser>(`/users/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),

  searchUsers: (q: string) =>
    request<ApiUser[]>(`/users/search?q=${encodeURIComponent(q)}`),

  getChat: (chatId: number) =>
    request<ApiChat>(`/chats/${chatId}`),

  createPrivateChat: (user_id_1: number, user_id_2: number) =>
    request<ApiChat>('/chats/private', {
      method: 'POST',
      body: JSON.stringify({ user_id_1, user_id_2 }),
    }),

  createGroupChat: (body: { name: string; description?: string; created_by: number; members?: number[] }) =>
    request<ApiChat>('/chats/group', { method: 'POST', body: JSON.stringify(body) }),

  addGroupMembers: (chatId: number, newMembers: number[]) =>
    request<ApiChat>(`/chats/${chatId}/add-members`, {
      method: 'POST',
      body: JSON.stringify({ chat_id: chatId, new_members: newMembers }),
    }),

  getChatMembers: (chatId: number) =>
    request<{ user_ids: number[] }>(`/chats/${chatId}/members`),

  getMyChats: (user_id: number) =>
    request<{ chats: ApiChatEntry[]; total: number }>(`/chats/my?user_id=${user_id}`)
      .then(r => r.chats ?? []),

  getChatMessages: (chatId: number, limit = 50, userId?: number) =>
    request<{ messages: ApiMessage[]; others_cursor?: number | null }>(
      `/chats/${chatId}/messages?limit=${limit}${userId != null ? `&user_id=${userId}` : ''}`
    ),
};
