const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {})
      }
    });

    const contentType = response.headers.get("content-type");
    let data: any;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // Handle non-JSON responses (e.g., Cloudflare tunnel errors or 404s)
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}. The backend might be down or misconfigured.`);
      }
      return text as unknown as T;
    }

    if (!response.ok) {
      throw new Error(data?.error || `API error ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === "TypeError" || error.message.includes("Failed to fetch")) {
      throw new Error("Backend unreachable. Please check if the server is running.");
    }
    throw error;
  }
}
