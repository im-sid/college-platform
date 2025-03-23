// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Import Authentication module
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsm741KgdYhXExZirg36FtIMiqj356-3Q",
  authDomain: "college-platform-b30e2.firebaseapp.com",
  projectId: "college-platform-b30e2",
  storageBucket: "college-platform-b30e2.firebasestorage.app",
  messagingSenderId: "585313016707",
  appId: "1:585313016707:web:cdb4ee58fc30ebc305f4b6",
  measurementId: "G-BG6PFPRXRQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Analytics (optional, you can remove this if you don’t need analytics)
const analytics = getAnalytics(app);

console.log('Firebase initialized successfully'); // For debugging