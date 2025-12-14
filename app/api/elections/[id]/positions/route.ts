import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - Get positions for an election with vote counts
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

        const positions = await prisma.position.findMany({
            where: { electionId },
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
        });

        // Get vote counts per candidate for each position
        const positionsWithVoteCounts = await Promise.all(
            positions.map(async (position) => {
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

                return {
                    id: position.id,
                    name: position.name,
                    maxChoices: position.maxChoices,
                    totalVotes: position._count.votes,
                    candidatesCount: position._count.candidates,
                    candidates: candidateVotes,
                };
            })
        );

        return NextResponse.json({ positions: positionsWithVoteCounts });
    } catch (error: any) {
        console.error("Error fetching positions:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to fetch positions" },
            { status: 500 }
        );
    }
}

