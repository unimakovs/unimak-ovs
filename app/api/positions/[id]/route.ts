import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - Get single position
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
        const positionId = parseInt(id);

        if (isNaN(positionId)) {
            return NextResponse.json({ error: "Invalid position ID" }, { status: 400 });
        }

        const position = await prisma.position.findUnique({
            where: { id: positionId },
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
        });

        if (!position) {
            return NextResponse.json({ error: "Position not found" }, { status: 404 });
        }

        return NextResponse.json({ position });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch position" },
            { status: 500 }
        );
    }
}

// PUT - Update position
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const positionId = parseInt(id);

        if (isNaN(positionId)) {
            return NextResponse.json({ error: "Invalid position ID" }, { status: 400 });
        }

        const body = await request.json();
        const { name, electionId, maxChoices } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Position name is required" },
                { status: 400 }
            );
        }

        if (!electionId || isNaN(parseInt(electionId))) {
            return NextResponse.json(
                { error: "Valid election is required" },
                { status: 400 }
            );
        }

        const maxChoicesValue = maxChoices ? parseInt(maxChoices) : 1;
        if (isNaN(maxChoicesValue) || maxChoicesValue < 1) {
            return NextResponse.json(
                { error: "Max choices must be at least 1" },
                { status: 400 }
            );
        }

        // Validate election exists
        const election = await prisma.election.findUnique({
            where: { id: parseInt(electionId) },
        });

        if (!election) {
            return NextResponse.json(
                { error: "Election not found" },
                { status: 404 }
            );
        }

        // Check for duplicate position name within the same election (excluding current position)
        const existingPosition = await prisma.position.findFirst({
            where: {
                electionId: parseInt(electionId),
                name: name.trim(),
                id: { not: positionId },
            },
        });

        if (existingPosition) {
            return NextResponse.json(
                { error: "A position with this name already exists in this election" },
                { status: 409 }
            );
        }

        const position = await prisma.position.update({
            where: { id: positionId },
            data: {
                name: name.trim(),
                electionId: parseInt(electionId),
                maxChoices: maxChoicesValue,
            },
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
        });

        return NextResponse.json({ position });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A position with this name already exists in this election" },
                { status: 409 }
            );
        }
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Position not found" }, { status: 404 });
        }
        console.error("Update position error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to update position" },
            { status: 500 }
        );
    }
}

// DELETE - Delete position
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const positionId = parseInt(id);

        if (isNaN(positionId)) {
            return NextResponse.json({ error: "Invalid position ID" }, { status: 400 });
        }

        // Check if position has candidates or votes
        const position = await prisma.position.findUnique({
            where: { id: positionId },
            include: {
                _count: {
                    select: {
                        candidates: true,
                        votes: true,
                    },
                },
            },
        });

        if (!position) {
            return NextResponse.json({ error: "Position not found" }, { status: 404 });
        }

        if (position._count.candidates > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete position with candidates. Remove all candidates first.",
                },
                { status: 400 }
            );
        }

        if (position._count.votes > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete position with votes. Remove all votes first.",
                },
                { status: 400 }
            );
        }

        await prisma.position.delete({
            where: { id: positionId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Position not found" }, { status: 404 });
        }
        console.error("Delete position error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to delete position" },
            { status: 500 }
        );
    }
}

