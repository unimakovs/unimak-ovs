"use client";
import { usePathname, useRouter } from "next/navigation";
import { VoterSidebar } from "./VoterSidebar";
import { VoterHeader } from "./VoterHeader";
import { SidebarProvider } from "./SidebarContext";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function VoterLayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const voterData = localStorage.getItem("voter");
        if (!voterData) {
            router.push("/");
            return;
        }

        try {
            JSON.parse(voterData);
            setIsAuthenticated(true);
        } catch (err) {
            router.push("/");
        } finally {
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                <VoterHeader />
                <div className="flex transition-all duration-300 ease-in-out">
                    <VoterSidebar />
                    <main className="flex-1 p-6 lg:p-8 transition-all duration-300 ease-in-out min-w-0">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

