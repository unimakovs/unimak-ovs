import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - Get election results with positions and vote counts
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const electionId = parseInt(id);

        if (isNaN(electionId)) {
            return NextResponse.json({ error: "Invalid election ID" }, { status: 400 });
        }

        const election = await prisma.election.findUnique({
            where: { id: electionId },
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
                            },
                        },
                        _count: {
                            select: {
                                votes: true,
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
                        votes: true,
                    },
                },
            },
        });

        if (!election) {
            return NextResponse.json({ error: "Election not found" }, { status: 404 });
        }

        // Get vote counts per candidate for each position
        const positionsWithVotes = await Promise.all(
            election.positions.map(async (position) => {
                const candidateVotes = await Promise.all(
                    position.candidates.map(async (candidate) => {
                        const voteCount = await prisma.vote.count({
                            where: {
                                candidateId: candidate.id,
                                positionId: position.id,
                            },
                        });
                        return {
                            ...candidate,
                            voteCount,
                        };
                    })
                );

                // Sort candidates by vote count (descending)
                candidateVotes.sort((a, b) => b.voteCount - a.voteCount);

                const totalVotes = candidateVotes.reduce((sum, c) => sum + c.voteCount, 0);

                return {
                    id: position.id,
                    name: position.name,
                    maxChoices: position.maxChoices,
                    totalVotes,
                    candidatesCount: position.candidates.length,
                    candidates: candidateVotes,
                };
            })
        );

        return NextResponse.json({
            election: {
                id: election.id,
                name: election.name,
                category: election.category,
                status: election.status,
                department: election.department,
                totalVotes: election._count.votes,
            },
            positions: positionsWithVotes,
        });
    } catch (error: any) {
        console.error("Error fetching election results:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to fetch election results" },
            { status: 500 }
        );
    }
}

