import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 🛡️ Admin Route Protection
    if (pathname.startsWith('/dashboard/admin')) {
        const token = request.cookies.get('token')?.value;
        const userRole = request.cookies.get('userRole')?.value;

        // If no token or role is not admin, redirect to login
        if (!token || userRole !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            // url.searchParams.set('callbackUrl', request.nextUrl.pathname);
            return NextResponse.redirect(url);
        }
    }

    // Optional: Protect other dashboard routes if needed
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/dashboard/:path*', // Protect all dashboard routes
    ],
};
