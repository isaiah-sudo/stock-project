import "./globals.css";
import type { ReactNode } from "react";
import { AnalyticsReporter } from "../components/AnalyticsReporter";

export const metadata = {
  title: "Simulator Pro | Gamified Stock Trading",
  description: "Master the markets with our high-fidelity virtual trading simulator.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900">
        <AnalyticsReporter />
        {children}
      </body>
    </html>
  );
}
