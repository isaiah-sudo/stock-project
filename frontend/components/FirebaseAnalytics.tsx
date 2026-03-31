"use client";

import { useEffect } from "react";
import { getFirebaseAnalytics } from "@/lib/firebase";

export default function FirebaseAnalytics() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      getFirebaseAnalytics().then((analytics) => {
        if (analytics) {
          console.log("Firebase Analytics initialized");
        }
      });
    }
  }, []);

  return null;
}
