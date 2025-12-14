import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get election results for voter (ENDED elections only)
export async function GET(request: NextRequest) {
    try {
        const voterId = request.headers.get("x-voter-id");
        const electionIdParam = request.nextUrl.searchParams.get("electionId");
        
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
            },
        });

        if (!voter) {
            return NextResponse.json(
                { error: "Voter not found" },
                { status: 404 }
            );
        }

        // If specific election ID provided
        if (electionIdParam) {
            const electionId = parseInt(electionIdParam);
            if (isNaN(electionId)) {
                return NextResponse.json(
                    { error: "Invalid election ID" },
                    { status: 400 }
                );
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
                },
            });

            if (!election) {
                return NextResponse.json(
                    { error: "Election not found" },
                    { status: 404 }
                );
            }

            // Only allow viewing results for ENDED elections
            if (election.status !== "ENDED") {
                return NextResponse.json(
                    { error: "Results are only available for ended elections" },
                    { status: 403 }
                );
            }

            // Check if voter is eligible (must be department election matching voter's department)
            if (election.category !== "DEPARTMENT") {
                return NextResponse.json(
                    { error: "Only department elections are available" },
                    { status: 403 }
                );
            }

            if (!voter.departmentId || election.departmentId !== voter.departmentId) {
                return NextResponse.json(
                    { error: "You are not eligible to view results for this election" },
                    { status: 403 }
                );
            }

            // Get vote counts per candidate
            const positionsWithVotes = await Promise.all(
                election.positions.map(async (position) => {
                    const candidateVotes = await Promise.all(
                        position.candidates.map(async (candidate) => {
                            const voteCount = await prisma.vote.count({
                                where: {
                                    candidateId: candidate.id,
                                    positionId: position.id,
                                    electionId: election.id,
                                },
                            });
                            return {
                                ...candidate,
                                voteCount,
                            };
                        })
                    );

                    candidateVotes.sort((a, b) => b.voteCount - a.voteCount);

                    const totalVotes = candidateVotes.reduce((sum, c) => sum + c.voteCount, 0);

                    return {
                        id: position.id,
                        name: position.name,
                        totalVotes,
                        candidates: candidateVotes,
                    };
                })
            );

            return NextResponse.json({
                election: {
                    id: election.id,
                    name: election.name,
                    category: election.category,
                    department: election.department,
                },
                positions: positionsWithVotes,
            });
        }

        if (!voter.departmentId) {
            return NextResponse.json(
                { error: "Voter must belong to a department" },
                { status: 400 }
            );
        }

        // Get all ENDED elections from the voter's department only
        const elections = await prisma.election.findMany({
            where: {
                status: "ENDED",
                category: "DEPARTMENT",
                departmentId: voter.departmentId,
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
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
                endAt: "desc",
            },
        });

        return NextResponse.json({ elections });
    } catch (error: any) {
        console.error("Error fetching voter results:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to fetch results" },
            { status: 500 }
        );
    }
}

