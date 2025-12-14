"use client";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { SidebarProvider } from "./SidebarContext";
import type { ReactNode } from "react";

export function AdminLayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    
    // Don't apply admin layout to login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                <AdminHeader />
                <div className="flex transition-all duration-300 ease-in-out">
                    <AdminSidebar />
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

