"use client";
import { useState, useEffect } from "react";

interface CountdownTimerProps {
    startAt: Date | string | null;
    endAt: Date | string | null;
    status: string;
    size?: "sm" | "lg";
    textColor?: string;
}

export function CountdownTimer({ startAt, endAt, status, size = "sm", textColor }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<string>("");
    const [timeStatus, setTimeStatus] = useState<"upcoming" | "running" | "ended">("upcoming");

    useEffect(() => {
        if (!startAt || !endAt) {
            setTimeRemaining("Not scheduled");
            return;
        }

        const updateTimer = () => {
            const now = new Date();
            const start = new Date(startAt);
            const end = new Date(endAt);

            if (now < start) {
                // Election hasn't started yet
                setTimeStatus("upcoming");
                const diff = start.getTime() - now.getTime();
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                if (days > 0) {
                    setTimeRemaining(`Starts in ${days}d ${hours}h ${minutes}m`);
                } else if (hours > 0) {
                    setTimeRemaining(`Starts in ${hours}h ${minutes}m ${seconds}s`);
                } else if (minutes > 0) {
                    setTimeRemaining(`Starts in ${minutes}m ${seconds}s`);
                } else {
                    setTimeRemaining(`Starts in ${seconds}s`);
                }
            } else if (now >= start && now <= end) {
                // Election is running
                setTimeStatus("running");
                const diff = end.getTime() - now.getTime();
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                if (days > 0) {
                    setTimeRemaining(`${days}d ${hours}h ${minutes}m remaining`);
                } else if (hours > 0) {
                    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
                } else if (minutes > 0) {
                    setTimeRemaining(`${minutes}m ${seconds}s remaining`);
                } else {
                    setTimeRemaining(`${seconds}s remaining`);
                }
            } else {
                // Election has ended
                setTimeStatus("ended");
                setTimeRemaining("Ended");
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startAt, endAt]);

    const getStatusColor = () => {
        // If custom text color is provided, use it
        if (textColor) {
            return textColor;
        }
        
        switch (timeStatus) {
            case "upcoming":
                return "text-blue-600";
            case "running":
                return "text-green-600 font-semibold";
            case "ended":
                return "text-gray-500";
            default:
                return "text-gray-500";
        }
    };

    const sizeClass = size === "lg" ? "text-2xl" : "text-sm";

    return (
        <div className={`${sizeClass} ${getStatusColor()}`}>
            {timeRemaining || "Not scheduled"}
        </div>
    );
}


