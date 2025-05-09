'use client';

import {initializeApp, getApps} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {getStorage} from "firebase/storage";

// These are public keys that are safe to include in client-side code
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client SDK
function initializeFirebaseClient() {
    const apps = getApps();

    if (!apps.length) {
        const app = initializeApp(firebaseConfig);
        return {
            app,
            db: getFirestore(app),
            auth: getAuth(app),
        };
    } else {
        return {
            app: apps[0],
            db: getFirestore(apps[0]),
            auth: getAuth(apps[0]),
            storage: getStorage(apps[0]),
        };
    }
}

export const {app, db, auth, storage} = initializeFirebaseClient();
