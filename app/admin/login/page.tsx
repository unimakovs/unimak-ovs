"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { AdminDashboardSkeleton } from "../_components/AdminDashboardSkeleton";
import { StudentDashboardSkeleton } from "@/app/student/_components/StudentDashboardSkeleton";


type SignInResult = {
    error?: string | null;
    status?: number;
    ok?: boolean;
    url?: string | null;
} | undefined;

export default function AdminLoginPage() {
    const router = useRouter();
    const params = useSearchParams();
    const { data: session, status } = useSession();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [redirectRole, setRedirectRole] = useState<"ADMIN" | "STUDENT" | null>(null);
    const [err, setErr] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        if (status === "authenticated" && session) {
            if (session.role === "ADMIN") {
                window.location.href = "/admin/dashboard";
            } else if (session.role === "STUDENT") {
                window.location.href = "/student/dashboard";
            }
        }
    }, [session, status]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setErr("");

        try {
            const res = (await signIn("credentials", {
                email,
                password,
                redirect: false,
            })) as SignInResult;

            if (!res || res.error) {
                setLoading(false);
                setErr(res?.error || "Invalid credentials");
                return;
            }

            // Success - use hard redirect for immediate navigation
            // This avoids race conditions with router.push() + router.refresh()
            // The session cookie is set by NextAuth immediately after signIn
            window.location.href = "/admin/dashboard";
        } catch (error) {
            setLoading(false);
            setRedirecting(false);
            setErr("An error occurred. Please try again.");
        }
    }

    // Show loading while checking session
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    // Don't show login form if already authenticated
    if (status === "authenticated") {
        return null;
    }

    // Show skeleton while redirecting
    if (redirecting) {
        if (redirectRole === "ADMIN") {
            return (
                <div className="min-h-screen bg-gray-50">
                    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500" />
                        <div className="mx-auto max-w-7xl px-4 lg:px-6">
                            <div className="flex items-center justify-between h-16">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex">
                        <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] animate-pulse">
                            <div className="p-4 space-y-1">
                                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="h-12 bg-gray-200 rounded mb-1"></div>
                                ))}
                            </div>
                        </div>
                        <main className="flex-1 p-6 lg:p-8">
                            <div className="mx-auto max-w-7xl">
                                <AdminDashboardSkeleton />
                            </div>
                        </main>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="flex items-center justify-center p-6">
                        <div className="w-full max-w-7xl">
                            <StudentDashboardSkeleton />
                        </div>
                    </main>
                </div>
            );
        }
    }

    return (
        <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4">
                            <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
                            <p className="text-sm text-slate-600 mt-1">
                                Electoral Commissioner access only
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="mt-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-emerald-500/60"
                                    type="email"
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <div className="relative mt-1">
                                    <input
                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-black outline-none focus:ring-2 focus:ring-emerald-500/60"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {err && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                    {err}
                                </p>
                            )}

                            <button
                                disabled={loading}
                                className="w-full rounded-md bg-emerald-600 text-white py-2 font-medium hover:bg-emerald-700 disabled:opacity-60"
                                type="submit"
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </form>

                        <div className="mt-4 text-center">
                            <a
                                href="/"
                                className="text-xs text-slate-600 hover:text-slate-900 underline"
                            >
                                ← Back to Homepage
                            </a>
                        </div>

                        <div className="mt-2 text-xs text-slate-500">
                            Need help? Contact the EC IT officer.
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
