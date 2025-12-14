"use client";
import { useState, ReactNode } from "react";

interface TooltipProps {
    content: string;
    children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
    const [show, setShow] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
                    <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                        {content}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                </div>
            )}
        </div>
    );
}

