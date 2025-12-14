import { prisma } from "@/lib/prisma";
import { ElectionsClient } from "./ElectionsClient";

async function getElections() {
    try {
        return await prisma.election.findMany({
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        positions: true,
                        votes: true,
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

async function getDepartments() {
    try {
        return await prisma.department.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        return [];
    }
}

export default async function ManageElectionsPage() {
    try {
        const [elections, departments] = await Promise.all([
            getElections(),
            getDepartments(),
        ]);

        return (
            <ElectionsClient
                initialElections={elections}
                departments={departments}
            />
        );
    } catch (error) {
        console.error("Error loading elections page:", error);
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Elections</h1>
                    <p className="text-gray-600 mt-1">Create, configure, and manage elections.</p>
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
