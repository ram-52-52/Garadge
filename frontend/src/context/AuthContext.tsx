"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'customer' | 'mechanic' | 'admin';
    expertise?: string[];
    vehicleTypes?: string[];
    isVerified?: boolean;
    isOnline?: boolean;
    gender?: 'male' | 'female';
    addresses?: {
        label: string;
        address: string;
        coordinates?: { lat: number; lng: number };
    }[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        const initializeAuth = async () => {
            if (storedToken) {
                setToken(storedToken);
                if (storedUser) setUser(JSON.parse(storedUser));
                
                // Fetch fresh user data from server to sync status (isVerified, etc.)
                try {
                    const { data } = await api.get('/auth/me');
                    if (data.success) {
                        setUser(data.data);
                        localStorage.setItem('user', JSON.stringify(data.data));
                        document.cookie = `userRole=${data.data.role}; path=/; max-age=2592000; SameSite=Lax`;
                    }
                } catch (error) {
                    console.error('Failed to refresh user profile:', error);
                    // If token is invalid, clear storage
                    if ((error as any).response?.status === 401) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (credentials: any) => {
        try {
            console.log('Initiating login with role:', credentials.role);
            const { data } = await api.post('/auth/login', credentials);
            
            if (data.success) {
                // Extract clean user data (avoiding 'success' metadata in user state)
                const { token, success, ...userData } = data;
                
                console.log('Login success! User role from API:', userData.role);
                
                setToken(token);
                setUser(userData as User);
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // 🍪 Sync to cookies for Middleware access
                document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
                document.cookie = `userRole=${userData.role}; path=/; max-age=2592000; SameSite=Lax`;
                
                // Perform dynamic redirect based on validated role
                if (userData.role === 'mechanic') {
                    console.log('Redirecting to mechanic dashboard...');
                    router.push('/dashboard/mechanic');
                } else if (userData.role === 'admin') {
                    console.log('Redirecting to admin dashboard...');
                    router.push('/dashboard/admin');
                } else {
                    console.log('Redirecting to user dashboard...');
                    router.push('/dashboard/user');
                }
            }
        } catch (error: any) {
            console.error('Login implementation error:', error);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const register = async (regData: any) => {
        try {
            const { data } = await api.post('/auth/register', regData);
            if (data.success) {
                const { token, ...userData } = data;
                setToken(token);
                setUser(userData as any);
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // FIXED REDIRECT PATHS
                if (userData.role === 'mechanic') {
                    router.push('/dashboard/mechanic');
                } else {
                    router.push('/dashboard/user');
                }
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const updateProfile = async (updateData: any) => {
        try {
            const { data } = await api.put('/auth/profile', updateData);
            if (data.success) {
                setUser(data.data);
                localStorage.setItem('user', JSON.stringify(data.data));
                // Update cookie role if it changed
                document.cookie = `userRole=${data.data.role}; path=/; max-age=2592000; SameSite=Lax`;
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Update failed');
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Clear cookies
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
