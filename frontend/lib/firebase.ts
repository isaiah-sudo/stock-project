import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

// Firebase configuration with environment variable support and hardcoded defaults for development
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCEmiHY3fF15Pwrcf_vEfysZ5G6gMDrjk4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trillium-finance.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trillium-finance",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trillium-finance.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "113993169965",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:113993169965:web:09086d2f79f041342b8ca4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BYEK4HP0JS"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Safely get Firebase Analytics instance on the client.
 * Returns null on the server or if analytics is not supported.
 */
export const getFirebaseAnalytics = async () => {
  if (typeof window !== "undefined") {
    if (await isSupported()) {
      return getAnalytics(app);
    }
  }
  return null;
};

/**
 * Log a custom event to Firebase Analytics.
 */
export const trackEvent = async (name: string, params?: object) => {
  if (typeof window !== "undefined") {
    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      logEvent(analytics, name, params);
    }
  }
};

export { app };
