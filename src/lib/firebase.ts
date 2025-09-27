// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1CiCpAzjmnTvFQhcEv_FRk0HljOQD2N0",
  authDomain: "studio-4048203700-4cec7.firebaseapp.com",
  projectId: "studio-4048203700-4cec7",
  storageBucket: "studio-4048203700-4cec7.appspot.com",
  messagingSenderId: "461026091475",
  appId: "1:461026091475:web:9ea8ef2ff29a72f3c8cf26"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
