"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRedirect() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role === 'mechanic') {
                router.push('/dashboard/mechanic');
            } else {
                router.push('/dashboard/user');
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-dark-darker flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
}
