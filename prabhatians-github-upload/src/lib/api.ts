const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
export const isApiConfigured = Boolean(process.env.NEXT_PUBLIC_API_URL);
const TOKEN_KEY = "prabhatians.token";
export type ApiEnvelope<T> = { success: boolean; data: T; message: string };
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); this.name = "ApiError"; } }
export function getToken(): string | null { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
export function saveToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken(); if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  let response: Response;
  try { response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, { ...options, headers, cache: "no-store" }); }
  catch { throw new ApiError(0, `API is unavailable at ${API_URL}. Start the API and MongoDB, then try again.`); }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) { if (response.status === 401) clearToken(); throw new ApiError(response.status, payload.message || "The request could not be completed."); }
  return (payload as ApiEnvelope<T>).data;
}
export const apiUrl = API_URL;
export type PublicUser = { _id: string; fullName: string; email?: string; role: string; branch?: string; year?: number; interests?: string[] };
export type Course = { _id: string; title: string; description: string; category?: { _id: string; name: string } | string; difficulty: string; thumbnail?: string; tags: string[]; duration: number; averageRating: number; ratingCount: number; enrollmentCount: number; creator: PublicUser | string; modules?: Array<{ _id: string; title: string; lessons: Array<{ _id: string; title: string; duration?: number }> }> };
export type Category = { _id: string; name: string; slug: string; icon?: string };
export type LearningProgress = { started: boolean; percentage: number; completed: boolean; completedLessons: string[] };
export const authApi = {
  login: async (email: string, password: string) => { const data = await api<{ user: PublicUser; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); saveToken(data.token); return data; },
  register: async (data: { fullName: string; email: string; password: string; confirmPassword: string; branch: string; year: number }) => { const result = await api<{ user: PublicUser; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }); saveToken(result.token); return result; },
  me: () => api<{ user: PublicUser; profile: Record<string, unknown> | null }>("/auth/me"),
  logout: () => clearToken(),
};
export const coursesApi = {
  list: (query = "") => api<{ items: Course[]; total: number }>(`/courses${query}`),
  get: (id: string) => api<{ course: Course; modules: NonNullable<Course["modules"]> }>(`/courses/${id}`),
  enroll: (id: string) => api(`/courses/${id}/enroll`, { method: "POST", body: JSON.stringify({}) }),
  mine: () => api<Array<{ course: Course; status: string }>>("/users/me/courses"),
};
export const searchApi = (query: string, type = "all") => api<Record<string, unknown>>(`/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`);
export const commentsApi = {
  list: (contentType: string, contentId: string) => api<Array<Record<string, unknown>>>(`/comments?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`),
  add: (contentType: string, contentId: string, body: string) => api<Record<string, unknown>>("/comments", { method: "POST", body: JSON.stringify({ contentType, contentId, body }) }),
};
export const ratingsApi = {
  list: (contentId: string, contentType: string) => api<{ items: Array<Record<string, unknown>>; average: number; count: number }>(`/ratings/${contentId}?contentType=${contentType}`),
  add: (contentType: string, contentId: string, value: number) => api("/ratings", { method: "POST", body: JSON.stringify({ contentType, contentId, value }) }),
  update: (id: string, value: number) => api(`/ratings/${id}`, { method: "PUT", body: JSON.stringify({ value }) }),
};
export const progressApi = {
  get: (courseId: string) => api<LearningProgress>(`/progress/${courseId}`),
  update: (courseId: string, input: { percentage?: number; completed?: boolean; lastWatchedLesson?: string; completedLessons?: string[] }) => api<LearningProgress>("/progress", { method: "POST", body: JSON.stringify({ courseId, ...input }) }),
};
export const savedApi = { list: () => api<Array<Record<string, unknown>>>("/saved"), add: (contentType: string, contentId: string) => api("/saved", { method: "POST", body: JSON.stringify({ contentType, contentId }) }), remove: (id: string) => api(`/saved/${id}`, { method: "DELETE" }) };
export const profileApi = { update: (input: Record<string, unknown>) => api("/users/me", { method: "PUT", body: JSON.stringify(input) }), notifications: () => api<Array<Record<string, unknown>>>("/notifications") };
