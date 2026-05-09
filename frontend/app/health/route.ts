import { NextResponse } from "next/server";

const backendInternalUrl = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:4000";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${backendInternalUrl}/api/health`, {
        signal: controller.signal,
        cache: "no-store"
      });

      if (!response.ok) {
        return NextResponse.json(
          { ok: false, service: "frontend", backend: "unhealthy" },
          { status: 503 }
        );
      }

      return NextResponse.json({ ok: true, service: "frontend", backend: "ok" });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json(
      { ok: false, service: "frontend", backend: "unreachable" },
      { status: 503 }
    );
  }
}
