const API_PREFIX = "/api";

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith(API_PREFIX)) return normalizedPath;
  return `${API_PREFIX}${normalizedPath}`;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  try {
    const response = await fetch(buildApiUrl(path), {
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
        throw new Error(`Server error: ${response.status}. The API might be down or misconfigured.`);
      }
      return text as unknown as T;
    }

    if (!response.ok) {
      throw new Error(data?.error || `API error ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === "TypeError" || error.message.includes("Failed to fetch")) {
      throw new Error("API unreachable. Please check if the app is running.");
    }
    throw error;
  }
}
