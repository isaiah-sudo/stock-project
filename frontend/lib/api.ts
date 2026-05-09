const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:4000/api"
    : "/api");

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  function formatApiError(data: any, status: number) {
    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data === "object") {
      if (typeof data.error === "string") {
        return data.error;
      }

      if (data.error && typeof data.error === "object") {
        return data.error.message || JSON.stringify(data.error);
      }

      if (typeof data.message === "string") {
        return data.message;
      }

      return JSON.stringify(data);
    }

    return `API error ${status}`;
  }

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
      throw new Error(formatApiError(data, response.status));
    }

    return data as T;
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "";
    if (error?.name === "TypeError" || message.includes("Failed to fetch")) {
      throw new Error("Backend unreachable. Please check if the server is running.");
    }
    throw error;
  }
}
