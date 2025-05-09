// context/AuthContext.tsx
'use client';

import React, {createContext, useContext, useEffect, useState} from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import {doc, getDoc, setDoc, serverTimestamp} from 'firebase/firestore';
import {auth, db} from '@/lib/firebase/client';

// Define user role types
export type UserRole = 'admin' | 'teamLeader' | 'staff';

// Define extended user type with role
export interface ExtendedUser extends User {
    role?: UserRole;
    teamId?: string;
    fullName?: string;
}

interface AuthContextType {
    user: ExtendedUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string, role: UserRole, teamId?: string, fullName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => {
    },
    signOut: async () => {
    },
    signUp: async () => {
    },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [user, setUser] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch additional user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Merge Firebase Auth user with Firestore data
                        const extendedUser: ExtendedUser = {
                            ...firebaseUser,
                            role: userData.role,
                            teamId: userData.teamId,
                            fullName: userData.fullName,
                        };
                        setUser(extendedUser);
                    } else {
                        setUser(firebaseUser);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle setting the user
        } catch (error) {
            console.error("Error signing in:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    const signUp = async (
        email: string,
        password: string,
        role: UserRole = 'staff',
        teamId?: string,
        fullName?: string
    ) => {
        // This will typically be handled by an admin function
        // Client-side signup is only allowed for testing purposes
        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Add user to Firestore with role
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, {
                email,
                role,
                teamId,
                fullName,
                createdAt: serverTimestamp(),
            });

            // onAuthStateChanged will handle setting the user
        } catch (error) {
            console.error("Error signing up:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signOut,
        signUp,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};