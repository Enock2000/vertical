
// src/lib/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserSessionPersistence, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzQTXfph0F_0Kz0TcqwBRABuPkUxSLpHE",
  authDomain: "studio-1128359683-584e7.firebaseapp.com",
  databaseURL: "https://studio-1128359683-584e7-default-rtdb.firebaseio.com",
  projectId: "studio-1128359683-584e7",
  storageBucket: "studio-1128359683-584e7.appspot.com",
  messagingSenderId: "259318221895",
  appId: "1:259318221895:web:266ba401a76ed86e10f562"
};

// Configuration for email link sign-in
const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be whitelisted in the Firebase Console.
  url: 'https://6000-firebase-studio-1758966024117.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev/finish-login',
  // This must be true.
  handleCodeInApp: true,
};

// Initialize Firebase
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

export { app, auth, db, storage, actionCodeSettings };
