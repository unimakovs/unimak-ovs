"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicHeader from "@/app/components/PublicHeader";
import PublicFooter from "@/app/components/PublicFooter";

export default function VerifyOTPPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (!email) {
            router.push("/voter/login");
        }
    }, [email, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError("OTP must be 6 digits");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/voters/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    otp: otp.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // Store voter info
                localStorage.setItem("voter", JSON.stringify(data.voter));
                // Redirect to dashboard
                router.push("/voter/dashboard");
            } else {
                setError(data.error || "OTP verification failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResending(true);
        setError("");

        try {
            const res = await fetch("/api/voters/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setError("");
                alert("OTP has been resent to your email.");
            } else {
                setError(data.error || "Failed to resend OTP. Please try again.");
            }
        } catch (err) {
            setError("Failed to resend OTP. Please try again.");
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return null;
    }

    return (
        <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gradient-to-b from-blue-50 to-white">
            <PublicHeader />

            <main className="flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4">
                            <h1 className="text-2xl font-semibold text-gray-900">Verify Your Email</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                We've sent a 6-digit OTP code to <strong>{email}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">OTP Code</label>
                                <input
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-black text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500/60"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setOtp(value);
                                        setError("");
                                    }}
                                    placeholder="000000"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                disabled={loading || otp.length !== 6}
                                className="w-full rounded-md bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
                                type="submit"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={resending}
                                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-60"
                                >
                                    {resending ? "Resending..." : "Didn't receive code? Resend OTP"}
                                </button>
                            </div>
                        </form>

                        <div className="mt-4 text-xs text-gray-500">
                            The OTP code expires in 10 minutes.
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}

