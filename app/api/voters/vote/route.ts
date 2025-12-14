import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST - Submit a vote
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { electionId, positionId, candidateId } = body;

        if (!electionId || !positionId || !candidateId) {
            return NextResponse.json(
                { error: "Election ID, Position ID, and Candidate ID are required" },
                { status: 400 }
            );
        }

        // Verify voter exists
        const voter = await prisma.user.findUnique({
            where: { id: voterIdNum },
            select: {
                id: true,
                role: true,
                departmentId: true,
            },
        });

        if (!voter || voter.role !== "STUDENT") {
            return NextResponse.json(
                { error: "Voter not found" },
                { status: 404 }
            );
        }

        // Verify election exists and is RUNNING
        const election = await prisma.election.findUnique({
            where: { id: parseInt(electionId) },
            select: {
                id: true,
                status: true,
                category: true,
                departmentId: true,
                startAt: true,
                endAt: true,
            },
        });

        if (!election) {
            return NextResponse.json(
                { error: "Election not found" },
                { status: 404 }
            );
        }

        // Check if election is RUNNING and within time window
        const now = new Date();
        if (election.status !== "RUNNING") {
            return NextResponse.json(
                { error: "Election is not currently running" },
                { status: 400 }
            );
        }

        if (election.startAt && new Date(election.startAt) > now) {
            return NextResponse.json(
                { error: "Election has not started yet" },
                { status: 400 }
            );
        }

        if (election.endAt && new Date(election.endAt) < now) {
            return NextResponse.json(
                { error: "Election has ended" },
                { status: 400 }
            );
        }

        // Check if voter is eligible for this election (must be department election matching voter's department)
        if (election.category !== "DEPARTMENT") {
            return NextResponse.json(
                { error: "Only department elections are available for voting" },
                { status: 403 }
            );
        }
        
        if (election.departmentId !== voter.departmentId) {
            return NextResponse.json(
                { error: "You are not eligible to vote in this election" },
                { status: 403 }
            );
        }

        // Verify position exists and belongs to this election
        const position = await prisma.position.findUnique({
            where: { id: parseInt(positionId) },
            select: {
                id: true,
                electionId: true,
                maxChoices: true,
            },
        });

        if (!position || position.electionId !== election.id) {
            return NextResponse.json(
                { error: "Invalid position" },
                { status: 400 }
            );
        }

        // Verify candidate exists and belongs to this position
        const candidate = await prisma.candidate.findUnique({
            where: { id: parseInt(candidateId) },
            select: {
                id: true,
                positionId: true,
            },
        });

        if (!candidate || candidate.positionId !== position.id) {
            return NextResponse.json(
                { error: "Invalid candidate" },
                { status: 400 }
            );
        }

        // Check if voter has already voted for this position in this election
        const existingVote = await prisma.vote.findUnique({
            where: {
                unique_vote_per_position: {
                    voterId: voterIdNum,
                    electionId: election.id,
                    positionId: position.id,
                },
            },
        });

        if (existingVote) {
            return NextResponse.json(
                { error: "You have already voted for this position" },
                { status: 400 }
            );
        }

        // Create the vote
        const vote = await prisma.vote.create({
            data: {
                voterId: voterIdNum,
                electionId: election.id,
                positionId: position.id,
                candidateId: candidate.id,
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
                position: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Vote submitted successfully",
            vote,
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "You have already voted for this position" },
                { status: 400 }
            );
        }
        console.error("Error submitting vote:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to submit vote" },
            { status: 500 }
        );
    }
}

