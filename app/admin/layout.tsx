import type { ReactNode } from "react";
import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminHeader } from "./_components/AdminHeader";
import { SessionProvider } from "./_components/SessionProvider";
import { AdminLayoutWrapper } from "./_components/AdminLayoutWrapper";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AdminLayoutWrapper>
                {children}
            </AdminLayoutWrapper>
        </SessionProvider>
    );
}

