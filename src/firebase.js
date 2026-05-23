// firebase.js — Fine Bearing Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
// ... existing config
  apiKey: "AIzaSyDKcdRS5H2khDGLPxjw_IHAIo1WG4bnQkU",
  authDomain: "finebear-bf157.firebaseapp.com",
  projectId: "finebear-bf157",
  storageBucket: "finebear-bf157.appspot.com",
  messagingSenderId: "296985767202",
  appId: "1:296985767202:web:d73a50e49ef218408a497b",
  measurementId: "G-2H9Q5NBRC8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, sendPasswordResetEmail, sendEmailVerification };
