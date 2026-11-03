import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ваши данные из панели Firebase (Project Settings -> General -> Your apps -> Web)
const firebaseConfig = {
  apiKey: "AIzaSyBVrrDM0tDYGn_jawgnUs0vhCQs0zQQwq0",
  authDomain: "rkai-eng.firebaseapp.com",
  projectId: "rkai-eng",
  storageBucket: "rkai-eng.firebasestorage.app",
  messagingSenderId: "657270448176",
  appId: "1:657270448176:web:66fcbf90aa4746c5eb0df5"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);