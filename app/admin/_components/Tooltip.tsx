"use client";
import { useState } from "react";

interface TooltipProps {
    children: React.ReactNode;
    content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative w-full">
            <div
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                {children}
            </div>
            {show && (
                <div 
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[60] pointer-events-none"
                    style={{ willChange: 'transform' }}
                >
                    <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
                        {content}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                </div>
            )}
        </div>
    );
}

