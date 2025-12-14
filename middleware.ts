import { withAuth } from "next-auth/middleware";
import type { JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const path = req.nextUrl.pathname;
        const token = req.nextauth.token as JWT | null;

        // Add pathname to headers for layout to check
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-pathname", path);

        // Role-based redirect for authenticated users
        if (token) {
            // If admin tries to access student routes, redirect to admin dashboard
            if (token.role === "ADMIN" && path.startsWith("/student")) {
                return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }
            
            // If student tries to access admin routes, redirect to student dashboard
            if (token.role === "STUDENT" && path.startsWith("/admin") && path !== "/admin/login") {
                return NextResponse.redirect(new URL("/student/dashboard", req.url));
            }
        }

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;

                // Allow the login page itself to be public
                if (path === "/admin/login") return true;

                // Allow public routes
                if (!path.startsWith("/admin") && !path.startsWith("/student")) return true;

                // Admin routes require ADMIN role
                if (path.startsWith("/admin")) {
                    const t = token as JWT | null;
                    return !!t && t.role === "ADMIN";
                }

                // Student routes require STUDENT role
                if (path.startsWith("/student")) {
                    const t = token as JWT | null;
                    return !!t && t.role === "STUDENT";
                }

                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/student/:path*",
    ],
};
