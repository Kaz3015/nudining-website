// nudining-frontend/src/contexts/authContext/index.jsx
import { auth } from "../../firebase/firebase";
import { useEffect, useState, useContext } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React from 'react';

const authContext = React.createContext('dark');

export function useAuth() {
    return useContext(authContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        return unsubscribe;
    }, []);

    async function initializeUser(user) {
        if (user) {
            setCurrentUser({ ...user });
            setUserLoggedIn(true);
        } else {
            setCurrentUser(null);
            setUserLoggedIn(false);
        }
        setLoading(false);
    }

    const handleSignOut = async () => {
        await signOut(auth);
    };

    const value = { currentUser, userLoggedIn, loading, handleSignOut };
    return (
        <authContext.Provider value={value}>
            {!loading && children}
        </authContext.Provider>
    );
}