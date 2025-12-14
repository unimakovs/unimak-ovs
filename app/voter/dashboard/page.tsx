"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { VoterLayoutWrapper } from "../_components/VoterLayoutWrapper";
import { DashboardClient } from "./DashboardClient";

export default function VoterDashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const voterData = localStorage.getItem("voter");
        if (!voterData) {
            router.push("/");
        }
    }, [router]);

    return (
        <VoterLayoutWrapper>
            <DashboardClient />
        </VoterLayoutWrapper>
    );
}
