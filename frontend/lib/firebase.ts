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

// Initialize Analytics (only on client side and if supported)
const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, analytics };
