import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";

// Replace these placeholders with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trillium-finance.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trillium-finance",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trillium-finance.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export async function trackEvent(name: string, params?: object) {
  if (typeof window !== "undefined" && await isSupported()) {
    logEvent(getAnalytics(app), name, params);
  }
}
