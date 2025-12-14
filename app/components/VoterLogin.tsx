"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VoterLogin() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState(""); // Email or Student ID
    const [password, setPassword] = useState("");
    const [voterKey, setVoterKey] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showVoterKey, setShowVoterKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Determine if identifier is email or student ID
        const trimmedIdentifier = identifier.trim();
        const isEmail = trimmedIdentifier.includes("@");
        
        try {
            const res = await fetch("/api/voters/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(isEmail 
                        ? { email: trimmedIdentifier.toLowerCase() }
                        : { studentId: trimmedIdentifier }
                    ),
                    password,
                    voterKey: voterKey.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.requiresOTP) {
                    // Redirect to OTP verification page
                    router.push(`/voter/verify-otp?email=${encodeURIComponent(data.email)}`);
                } else {
                    // Email already verified, redirect to dashboard
                    // Store voter info in session/localStorage
                    localStorage.setItem("voter", JSON.stringify(data.voter));
                    router.push("/voter/dashboard");
                }
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border p-6 md:p-8">
            <h1 className="text-3xl font-bold text-blue-700">
                UNIMAK Voting System
            </h1>
            <p className="text-gray-600 mt-2">
                Secure student elections — SRC & Department ballots.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email or Student ID
                    </label>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your email address or Student ID"
                        required
                        autoComplete="username"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        You can use either your email address or Student ID to login
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Voter Key
                    </label>
                    <div className="relative">
                        <input
                            type={showVoterKey ? "text" : "password"}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none"
                            placeholder="Enter your voter key"
                            value={voterKey}
                            onChange={(e) => setVoterKey(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowVoterKey(!showVoterKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            aria-label={showVoterKey ? "Hide voter key" : "Show voter key"}
                        >
                            {showVoterKey ? (
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
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    />
                                </svg>
                            ) : (
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
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-600 text-white font-medium px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200 disabled:opacity-60 transition"
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-xs text-gray-500 mt-3">
                    You'll receive a 6-digit OTP in your email. Enter it to proceed to your ballot.
                </p>
            </form>

            <div className="mt-6 text-center">
                <a
                    href="/admin/login"
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    Electoral Commissioner? Admin Login →
                </a>
            </div>
        </div>
    );
}

