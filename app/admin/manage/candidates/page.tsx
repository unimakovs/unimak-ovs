import { prisma } from "@/lib/prisma";
import { CandidatesClient } from "./CandidatesClient";

async function getCandidates() {
    return await prisma.candidate.findMany({
        include: {
            position: {
                include: {
                    election: {
                        select: {
                            id: true,
                            name: true,
                            category: true,
                        },
                    },
                },
            },
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    studentId: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    votes: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

async function getPositions() {
    return await prisma.position.findMany({
        include: {
            election: {
                select: {
                    id: true,
                    name: true,
                    category: true,
                },
            },
        },
        orderBy: {
            election: {
                name: "asc",
            },
        },
    });
}

async function getElections() {
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
}

export default async function ManageCandidatesPage() {
    const [candidates, positions, elections] = await Promise.all([
        getCandidates(),
        getPositions(),
        getElections(),
    ]);

    return (
        <CandidatesClient
            initialCandidates={candidates}
            positions={positions}
            elections={elections}
        />
    );
}
