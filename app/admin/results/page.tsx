import { prisma } from "@/lib/prisma";
import { ResultsClient } from "./ResultsClient";

async function getElections() {
    try {
        return await prisma.election.findMany({
            where: {
                status: { in: ["RUNNING", "ENDED"] },
            },
            select: {
                id: true,
                name: true,
                category: true,
                status: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    } catch (error) {
        console.error("Failed to fetch elections:", error);
        return [];
    }
}

export default async function AdminResultsPage() {
    try {
        const elections = await getElections();

        return <ResultsClient initialElections={elections} />;
    } catch (error) {
        console.error("Error loading results page:", error);
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Election Results</h1>
                    <p className="text-gray-600 mt-1">View tallies and results for elections.</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                        <strong>Database Connection Error:</strong> Unable to connect to the database. Please check your database connection settings.
                    </p>
                </div>
            </div>
        );
    }
}
