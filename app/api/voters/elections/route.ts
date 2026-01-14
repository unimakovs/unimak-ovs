import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get available elections for voter (RUNNING elections)
export async function GET(request: NextRequest) {
    try {
        const voterId = request.headers.get("x-voter-id");
        
        if (!voterId) {
            return NextResponse.json(
                { error: "Voter ID is required" },
                { status: 401 }
            );
        }

        const voterIdNum = parseInt(voterId);
        if (isNaN(voterIdNum)) {
            return NextResponse.json(
                { error: "Invalid voter ID" },
                { status: 400 }
            );
        }

        // Get voter info
        const voter = await prisma.user.findUnique({
            where: { id: voterIdNum },
            select: {
                id: true,
                departmentId: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!voter) {
            return NextResponse.json(
                { error: "Voter not found" },
                { status: 404 }
            );
        }

        if (!voter.departmentId) {
            return NextResponse.json(
                { error: "Voter must belong to a department" },
                { status: 400 }
            );
        }

        const now = new Date();

        // Get RUNNING elections - both department elections for voter's department AND all SRC elections
        const elections = await prisma.election.findMany({
            where: {
                status: "RUNNING",
                startAt: { lte: now },
                endAt: { gte: now },
                // Include both department elections for voter's department AND all SRC elections
                OR: [
                    { category: "DEPARTMENT", departmentId: voter.departmentId },
                    { category: "SRC" } // SRC elections are available to all voters
                ]
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                positions: {
                    include: {
                        candidates: {
                            select: {
                                id: true,
                                displayName: true,
                                photoUrl: true,
                                manifesto: true,
                            },
                        },
                        _count: {
                            select: {
                                candidates: true,
                            },
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                },
                _count: {
                    select: {
                        positions: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Check which positions the voter has already voted for
        const votes = await prisma.vote.findMany({
            where: {
                voterId: voterIdNum,
                electionId: { in: elections.map((e) => e.id) },
            },
            select: {
                electionId: true,
                positionId: true,
            },
        });

        // Create a map of voted positions
        const votedPositions = new Set(
            votes.map((v) => `${v.electionId}-${v.positionId}`)
        );

        // Add voting status to elections and sort positions (President first)
        const electionsWithStatus = elections.map((election) => {
            const positionsWithVoteStatus = election.positions.map((position) => {
                const hasVoted = votedPositions.has(`${election.id}-${position.id}`);
                return {
                    ...position,
                    hasVoted,
                };
            });

            // Sort positions: President first, then others alphabetically
            const sortedPositions = [...positionsWithVoteStatus].sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                
                // President always comes first
                if (aName.includes("president") && !bName.includes("president")) return -1;
                if (!aName.includes("president") && bName.includes("president")) return 1;
                
                // Otherwise, alphabetical order
                return aName.localeCompare(bName);
            });

            const allPositionsVoted = sortedPositions.every((p) => p.hasVoted);
            const hasAnyVotes = votes.some((v) => v.electionId === election.id);

            return {
                ...election,
                positions: sortedPositions,
                hasVoted: allPositionsVoted && election.positions.length > 0,
                hasAnyVotes,
            };
        });

        return NextResponse.json({ elections: electionsWithStatus });
    } catch (error: any) {
        console.error("Error fetching voter elections:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to fetch elections" },
            { status: 500 }
        );
    }
}

