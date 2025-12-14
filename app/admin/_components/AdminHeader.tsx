"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function AdminHeader() {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500" />
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
                                U
                            </span>
                            <div className="leading-tight">
                                <div className="font-semibold text-slate-900 tracking-tight">
                                    UniMak OVS Admin
                                </div>
                                <div className="text-xs text-slate-500">
                                    Electoral Commissioner Portal
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {session?.user && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="hidden sm:inline">
                                    {session.user.name || session.user.email}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Admin
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

