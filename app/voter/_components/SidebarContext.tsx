"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    isPinned: boolean;
    setIsPinned: (pinned: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        const savedCollapsed = localStorage.getItem("voter-sidebar-collapsed");
        const savedPinned = localStorage.getItem("voter-sidebar-pinned");
        if (savedCollapsed !== null) {
            setIsCollapsed(JSON.parse(savedCollapsed));
        }
        if (savedPinned !== null) {
            setIsPinned(JSON.parse(savedPinned));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("voter-sidebar-collapsed", JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        localStorage.setItem("voter-sidebar-pinned", JSON.stringify(isPinned));
    }, [isPinned]);

    return (
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isPinned, setIsPinned }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}

