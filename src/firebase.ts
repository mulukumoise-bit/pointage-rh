import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANSNqS0zcEpqgqYB1dKDHC42N4dTHnDg",
  authDomain: "pointage-rh-c255c.firebaseapp.com",
  projectId: "pointage-rh-c255c",
  storageBucket: "pointage-rh-c255c.firebasestorage.app",
  messagingSenderId: "680317234430",
  appId: "1:680317234430:web:bc7d9666bb4eb77314c9ef",
  measurementId: "G-V75T9VR405"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
