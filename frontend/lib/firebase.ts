import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEmiHY3fF15Pwrcf_vEfysZ5G6gMDrjk4",
  authDomain: "trillium-finance.firebaseapp.com",
  projectId: "trillium-finance",
  storageBucket: "trillium-finance.firebasestorage.app",
  messagingSenderId: "113993169965",
  appId: "1:113993169965:web:09086d2f79f041342b8ca4",
  measurementId: "G-BYEK4HP0JS"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export a function to get analytics safely on the client
export const getFirebaseAnalytics = async () => {
  if (typeof window !== "undefined") {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) {
      return getAnalytics(app);
    }
  }
  return null;
};

export { app };
