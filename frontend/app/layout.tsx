import "./globals.css";
import type { ReactNode } from "react";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
