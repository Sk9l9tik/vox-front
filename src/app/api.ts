const BASE_URL = "/api/backend";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
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

export const api = {
  register: (body: { username: string; email: string; password: string }) =>
    request<AuthResponse>("/users/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/users/login", { method: "POST", body: JSON.stringify(body) }),

  getUser: (id: number) =>
    request<ApiUser>(`/users/${id}`),

  updateUser: (id: number, token: string, body: { display_name?: string; bio?: string; avatar_url?: string }) =>
    request<ApiUser>(`/users/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),

  searchUsers: (q: string) =>
    request<ApiUser[]>(`/users/search?q=${encodeURIComponent(q)}`),
};
