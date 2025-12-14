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
    // Sidebar is collapsed by default
    const [isCollapsed, setIsCollapsed] = useState(true);
    // Pinned state - when true, sidebar won't auto-collapse on mouse leave
    const [isPinned, setIsPinned] = useState(false);

    // Load saved state from localStorage
    useEffect(() => {
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        const savedPinned = localStorage.getItem("sidebar-pinned");
        if (savedCollapsed !== null) {
            setIsCollapsed(JSON.parse(savedCollapsed));
        }
        if (savedPinned !== null) {
            setIsPinned(JSON.parse(savedPinned));
        }
    }, []);

    // Save state to localStorage
    useEffect(() => {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        localStorage.setItem("sidebar-pinned", JSON.stringify(isPinned));
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

