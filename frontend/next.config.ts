import type { NextConfig } from "next";

function getBackendOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  return raw.replace(/\/api\/?$/i, "").replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendOrigin = getBackendOrigin();

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
