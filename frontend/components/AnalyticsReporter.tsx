"use client";

import { useEffect } from "react";
import { isSupported } from "firebase/analytics";
import { getFirebaseAnalytics } from "../lib/firebase";

export function AnalyticsReporter() {
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        const supported = await isSupported();
        if (supported) {
          const analytics = await getFirebaseAnalytics();
          if (analytics) {
            console.log("Firebase Analytics initialized");
          }
        }
      } catch (err) {
        console.error("Firebase Analytics failed to initialize:", err);
      }
    };

    initAnalytics();
  }, []);

  return null; // This component doesn't render anything
}
