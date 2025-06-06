import {initializeApp, getApps, cert} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';

// Initialize Firebase Admin SDK for server operations
function initializeFirebaseAdmin() {
    const apps = getApps();

    if (!apps.length) {
        // Using environment variables for server-side credentials
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
        });
    }

    return {
        db: getFirestore(),
        auth: getAuth(),
    };
}

export const adminFirestore = initializeFirebaseAdmin().db;
export const adminAuth = initializeFirebaseAdmin().auth;
