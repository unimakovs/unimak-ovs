"use client";
import { useState, useEffect } from "react";

interface Voter {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    studentId: string | null;
    department: { name: string } | null;
}

export function VoterHeader() {
    const [voter, setVoter] = useState<Voter | null>(null);

    useEffect(() => {
        const voterData = localStorage.getItem("voter");
        if (voterData) {
            try {
                const parsed = JSON.parse(voterData);
                setVoter(parsed);
            } catch (err) {
                console.error("Failed to parse voter data:", err);
            }
        }
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500" />
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
                            U
                        </div>
                        <div className="leading-tight">
                            <div className="font-semibold text-slate-900 tracking-tight">
                                UniMak Voting System
                            </div>
                            <div className="text-xs text-slate-500">
                                Student Portal
                            </div>
                        </div>
                    </div>

                    {voter && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="hidden sm:inline">
                                {voter.firstName} {voter.lastName}
                            </span>
                            {voter.studentId && (
                                <span className="hidden sm:inline text-gray-500">
                                    ({voter.studentId})
                                </span>
                            )}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Voter
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

