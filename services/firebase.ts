
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDGgWMw6GcU0wZrCjZUL_G7B_TTyBW8zV0",
    authDomain: "dialectics-idiomas.firebaseapp.com",
    projectId: "dialectics-idiomas",
    storageBucket: "dialectics-idiomas.firebasestorage.app",
    messagingSenderId: "411243708564",
    appId: "1:411243708564:web:002b888d005b1bcc26f481"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
