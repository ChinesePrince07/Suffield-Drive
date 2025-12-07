'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAdmin: boolean;
    login: (password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = '1234';
const STORAGE_KEY = 'cloud-drive-admin';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check if admin session exists
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'true') {
            setIsAdmin(true);
        }
    }, []);

    const login = (password: string): boolean => {
        if (password === ADMIN_PASSWORD) {
            setIsAdmin(true);
            localStorage.setItem(STORAGE_KEY, 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
