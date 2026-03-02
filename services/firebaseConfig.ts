import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';



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
export const db = getFirestore(app);

// Initialize App Check with reCAPTCHA v3
let appCheck;
if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const siteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY;

    if (!isLocalhost && siteKey && siteKey !== 'PLACEHOLDER_RECAPTCHA_SITE_KEY') {
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(siteKey),
            isTokenAutoRefreshEnabled: true
        });
    } else if (isLocalhost) {
        console.warn("Firebase App Check is disabled on localhost for development.");
    } else {
        console.warn("Firebase App Check is NOT initialized. VITE_RECAPTCHA_SITE_KEY is missing or invalid. Firebase calls may fail in production.");
    }
}



export const googleProvider = new GoogleAuthProvider();

export default app;
