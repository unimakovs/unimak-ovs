import { prisma } from "@/lib/prisma";
import { PositionsClient } from "./PositionsClient";

async function getPositions() {
    try {
        return await prisma.position.findMany({
            include: {
                election: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                    },
                },
                _count: {
                    select: {
                        candidates: true,
                        votes: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    } catch (error) {
        console.error("Failed to fetch positions:", error);
        // Return empty array if database connection fails
        return [];
    }
}

async function getElections() {
    try {
        return await prisma.election.findMany({
            select: {
                id: true,
                name: true,
                category: true,
            },
            orderBy: {
                name: "asc",
            },
        });
    } catch (error) {
        console.error("Failed to fetch elections:", error);
        // Return empty array if database connection fails
        return [];
    }
}

export default async function ManagePositionsPage() {
    try {
        const [positions, elections] = await Promise.all([
            getPositions(),
            getElections(),
        ]);

        return (
            <PositionsClient
                initialPositions={positions}
                elections={elections}
            />
        );
    } catch (error) {
        console.error("Error loading positions page:", error);
        // Return a fallback UI if there's an error
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Positions</h1>
                    <p className="text-gray-600 mt-1">View and manage election positions.</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                        <strong>Database Connection Error:</strong> Unable to connect to the database. Please check your database connection settings and ensure the database server is running.
                    </p>
                </div>
            </div>
        );
    }
}
