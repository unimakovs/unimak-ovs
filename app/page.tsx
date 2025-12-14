"use client";

import PublicHeader from "@/app/components/PublicHeader";
import VoteIllustration from "@/app/components/VoteIllustration";
import PublicFooter from "@/app/components/PublicFooter";
import VoterLogin from "@/app/components/VoterLogin";

export default function HomePage() {

    return (
        <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gradient-to-b from-slate-50 to-white">
            <PublicHeader />

            <main className="p-4 md:p-8">
                <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

                    {/* LEFT: Illustration */}
                    <section className="order-1 md:order-1">
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <VoteIllustration />
                        </div>
                    </section>

                    {/* RIGHT: Voter login */}
                    <section className="order-2 md:order-2">
                        <VoterLogin />
                    </section>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
