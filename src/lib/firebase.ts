// src/lib/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserSessionPersistence, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1CiCpAzjmnTvFQhcEv_FRk0HljOQD2N0",
  authDomain: "studio-4048203700-4cec7.firebaseapp.com",
  projectId: "studio-4048203700-4cec7",
  storageBucket: "studio-4048203700-4cec7.appspot.com",
  messagingSenderId: "461026091475",
  appId: "1:461026091475:web:9ea8ef2ff29a72f3c8cf26",
  databaseURL: "https://studio-4048203700-4cec7-default-rtdb.firebaseio.com/"
};

// Configuration for email link sign-in
const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be whitelisted in the Firebase Console.
  url: 'https://6000-firebase-studio-1758966024117.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev/finish-login',
  // This must be true.
  handleCodeInApp: true,
};

// Initialize Firebase - Main app
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
// Check if running in a browser environment before using browser-specific persistence
if (typeof window !== 'undefined') {
  auth = initializeAuth(app, {
    persistence: browserSessionPersistence
  });
} else {
  // Fallback for server-side rendering
  auth = getAuth(app);
}

const db: Database = getDatabase(app);
const storage: FirebaseStorage = getStorage(app);

// Secondary Firebase app for creating users without affecting main auth session
// This is used when admins create employee accounts
let secondaryApp: FirebaseApp | null = null;
let secondaryAuth: Auth | null = null;

export function getSecondaryAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Secondary auth can only be used in browser');
  }

  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'secondary');
    secondaryAuth = getAuth(secondaryApp);
  }

  return secondaryAuth!;
}

export { app, auth, db, storage, actionCodeSettings };

