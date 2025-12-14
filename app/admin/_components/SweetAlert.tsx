"use client";
import { useEffect } from "react";

interface SweetAlertProps {
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    onClose: () => void;
    duration?: number;
}

export function SweetAlert({
    show,
    type,
    title,
    message,
    onClose,
    duration = 3000,
}: SweetAlertProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    const typeStyles = {
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    const iconColors = {
        success: "text-green-600",
        error: "text-red-600",
        warning: "text-yellow-600",
        info: "text-blue-600",
    };

    const icons = {
        success: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        error: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
        warning: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
        ),
        info: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        ),
    };

    return (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5">
            <div
                className={`
                    ${typeStyles[type]} border-2 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md
                    flex items-start gap-3
                `}
            >
                <div className={iconColors[type]}>{icons[type]}</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">{title}</h3>
                    {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
                </div>
                <button
                    onClick={onClose}
                    className={`${iconColors[type]} hover:opacity-70 transition-opacity`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

