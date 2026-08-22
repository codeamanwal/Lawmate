import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDqwVWQTAWW8LWTUoIkURh2ftEeoCxvwDE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lawmate-cf2f3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lawmate-cf2f3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lawmate-cf2f3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "339012663774",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:339012663774:web:a60f10ac9f85354bdcc54f"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure language for SMS OTP
auth.languageCode = 'en';

// Enable local testing mode on localhost so HTTP 400 invalid-app-credential is eliminated
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  auth.settings.appVerificationDisabledForTesting = true;
}

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
