import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - List all candidates
export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const candidates = await prisma.candidate.findMany({
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

        return NextResponse.json({ candidates });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch candidates" },
            { status: 500 }
        );
    }
}

// POST - Create new candidate
export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { displayName, positionId, userId, manifesto, photoUrl } = body;

        if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
            return NextResponse.json(
                { error: "Display name is required" },
                { status: 400 }
            );
        }

        if (!positionId || isNaN(parseInt(positionId))) {
            return NextResponse.json(
                { error: "Valid position is required" },
                { status: 400 }
            );
        }

        // Validate position exists
        const position = await prisma.position.findUnique({
            where: { id: parseInt(positionId) },
            include: {
                election: true,
            },
        });

        if (!position) {
            return NextResponse.json(
                { error: "Position not found" },
                { status: 404 }
            );
        }

        // Validate user if provided
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(userId) },
            });
            if (!user || user.role !== "STUDENT") {
                return NextResponse.json(
                    { error: "Invalid student user" },
                    { status: 400 }
                );
            }
        }

        const candidate = await prisma.candidate.create({
            data: {
                displayName: displayName.trim(),
                positionId: parseInt(positionId),
                userId: userId ? parseInt(userId) : null,
                manifesto: manifesto?.trim() || null,
                photoUrl: photoUrl?.trim() || null,
            },
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
        });

        return NextResponse.json({ candidate }, { status: 201 });
    } catch (error: any) {
        console.error("Create candidate error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to create candidate" },
            { status: 500 }
        );
    }
}

