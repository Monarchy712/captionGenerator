const API_BASE = import.meta.env.VITE_API_URL || "";

export function getAdminToken(): string | null {
  return localStorage.getItem("cs_admin_token");
}

export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem("cs_admin_token", token);
  else localStorage.removeItem("cs_admin_token");
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { admin?: boolean } = {}
): Promise<T> {
  const { admin, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }
  if (admin) {
    const token = getAdminToken();
    if (token) headers.set("x-admin-password", token);
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...rest,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(res.status, data.error || res.statusText, data.details);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, admin = false) => request<T>(path, { method: "GET", admin }),
  post: <T>(path: string, body?: unknown, admin = false) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, admin }),
  put: <T>(path: string, body?: unknown, admin = false) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, admin }),
  delete: <T>(path: string, admin = false) => request<T>(path, { method: "DELETE", admin }),
};
