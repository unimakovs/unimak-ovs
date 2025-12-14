"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { Tooltip } from "./Tooltip";
import { useRef, useEffect } from "react";

type NavItem = 
    | { type: "divider"; label: string }
    | { href: string; label: string; icon: string };

const navItems: NavItem[] = [
    { href: "/voter/dashboard", label: "Dashboard", icon: "📊" },
    { type: "divider", label: "Elections" },
    { href: "/voter/results", label: "Results", icon: "📈" },
];

export function VoterSidebar() {
    const pathname = usePathname();
    const { isCollapsed, setIsCollapsed, isPinned, setIsPinned } = useSidebar();
    const sidebarRef = useRef<HTMLAsideElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        if (isCollapsed && !isPinned) {
            setIsCollapsed(false);
        }
    };

    const handleMouseLeave = () => {
        if (!isPinned) {
            hoverTimeoutRef.current = setTimeout(() => {
                setIsCollapsed(true);
            }, 150);
        }
    };

    const handleToggleClick = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        if (isCollapsed) {
            setIsCollapsed(false);
            setIsPinned(true);
        } else {
            setIsCollapsed(true);
            setIsPinned(false);
        }
    };

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("voter");
        window.location.href = "/";
    };

    return (
        <aside
            ref={sidebarRef}
            className={`
                bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16
                transition-all duration-300 ease-in-out overflow-hidden z-40
                ${isCollapsed ? "w-16" : "w-64"}
            `}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Hamburger Menu Button */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
                <button
                    onClick={handleToggleClick}
                    type="button"
                    className={`
                        w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-200 
                        text-gray-700 hover:text-gray-900 transition-colors font-medium
                        ${isCollapsed ? "justify-center" : ""}
                    `}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                            />
                        </svg>
                    ) : (
                        <>
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            <span className="text-sm font-medium">Close Menu</span>
                        </>
                    )}
                </button>
            </div>

            <nav className="p-4 space-y-1">
                {navItems.map((item, index) => {
                    if (item.type === "divider") {
                        if (isCollapsed) return null;
                        return (
                            <div key={`divider-${index}`} className="pt-2 mt-2 border-t border-gray-200">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {item.label}
                                </div>
                            </div>
                        );
                    }
                    
                    const isActive = pathname === item.href || 
                        (item.href !== "/voter/dashboard" && pathname.startsWith(item.href));
                    
                    const linkElement = (
                        <Link
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                                ${isCollapsed ? "justify-center" : ""}
                                ${isActive
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                }
                            `}
                        >
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            {!isCollapsed && (
                                <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                            )}
                        </Link>
                    );

                    return (
                        <div key={item.href}>
                            {isCollapsed ? (
                                <Tooltip content={item.label}>
                                    {linkElement}
                                </Tooltip>
                            ) : (
                                linkElement
                            )}
                        </div>
                    );
                })}
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                    {isCollapsed ? (
                        <Tooltip content="Logout">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                            >
                                <span className="text-lg flex-shrink-0">🚪</span>
                            </button>
                        </Tooltip>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors whitespace-nowrap"
                        >
                            <span className="text-lg flex-shrink-0">🚪</span>
                            <span>Logout</span>
                        </button>
                    )}
                </div>
            </nav>
        </aside>
    );
}

