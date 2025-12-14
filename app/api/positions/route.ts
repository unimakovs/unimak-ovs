import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - List all positions
export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const positions = await prisma.position.findMany({
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

        return NextResponse.json({ positions });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch positions" },
            { status: 500 }
        );
    }
}

// POST - Create new position
export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Check for duplicate position name within the same election
        const existingPosition = await prisma.position.findUnique({
            where: {
                electionId_name: {
                    electionId: parseInt(electionId),
                    name: name.trim(),
                },
            },
        });

        if (existingPosition) {
            return NextResponse.json(
                { error: "A position with this name already exists in this election" },
                { status: 409 }
            );
        }

        const position = await prisma.position.create({
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

        return NextResponse.json({ position }, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A position with this name already exists in this election" },
                { status: 409 }
            );
        }
        console.error("Create position error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to create position" },
            { status: 500 }
        );
    }
}

