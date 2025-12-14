import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - Get single candidate
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
        const candidateId = parseInt(id);

        if (isNaN(candidateId)) {
            return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 });
        }

        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
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

        if (!candidate) {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        return NextResponse.json({ candidate });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch candidate" },
            { status: 500 }
        );
    }
}

// PUT - Update candidate
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
        const candidateId = parseInt(id);

        if (isNaN(candidateId)) {
            return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 });
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

        const candidate = await prisma.candidate.update({
            where: { id: candidateId },
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

        return NextResponse.json({ candidate });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }
        console.error("Update candidate error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to update candidate" },
            { status: 500 }
        );
    }
}

// DELETE - Delete candidate
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
        const candidateId = parseInt(id);

        if (isNaN(candidateId)) {
            return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 });
        }

        // Check if candidate has votes
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            include: {
                _count: {
                    select: {
                        votes: true,
                    },
                },
            },
        });

        if (!candidate) {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        if (candidate._count.votes > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete candidate with votes. Remove all votes first.",
                },
                { status: 400 }
            );
        }

        await prisma.candidate.delete({
            where: { id: candidateId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }
        console.error("Delete candidate error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to delete candidate" },
            { status: 500 }
        );
    }
}

