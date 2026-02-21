import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCv6mMiK6WUoaMRCi9wMn31F1pfKVKrREY",
  authDomain: "control-hiz.firebaseapp.com",
  projectId: "control-hiz",
  storageBucket: "control-hiz.firebasestorage.app",
  messagingSenderId: "144845322281",
  appId: "1:144845322281:web:a92b10ffa8eb0f97440438"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);