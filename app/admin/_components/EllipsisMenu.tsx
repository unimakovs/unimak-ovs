"use client";
import { useState, useRef, useEffect } from "react";

interface MenuItem {
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
    icon?: React.ReactNode;
}

interface EllipsisMenuProps {
    items: MenuItem[];
}

export function EllipsisMenu({ items }: EllipsisMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                aria-label="More options"
            >
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
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2
                                    ${
                                        item.variant === "danger"
                                            ? "text-red-700 hover:bg-red-50"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }
                                `}
                            >
                                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

