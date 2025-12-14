import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - Get single election
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
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        positions: true,
                        votes: true,
                    },
                },
            },
        });

        if (!election) {
            return NextResponse.json({ error: "Election not found" }, { status: 404 });
        }

        return NextResponse.json({ election });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch election" },
            { status: 500 }
        );
    }
}

// PUT - Update election
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
        const electionId = parseInt(id);

        if (isNaN(electionId)) {
            return NextResponse.json({ error: "Invalid election ID" }, { status: 400 });
        }

        const body = await request.json();
        const { name, category, departmentId, status, startAt, endAt } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Election name is required" },
                { status: 400 }
            );
        }

        if (!category || !["SRC", "DEPARTMENT"].includes(category)) {
            return NextResponse.json(
                { error: "Valid category (SRC or DEPARTMENT) is required" },
                { status: 400 }
            );
        }

        if (category === "DEPARTMENT" && !departmentId) {
            return NextResponse.json(
                { error: "Department is required for DEPARTMENT elections" },
                { status: 400 }
            );
        }

        if (category === "SRC" && departmentId) {
            return NextResponse.json(
                { error: "SRC elections cannot have a department" },
                { status: 400 }
            );
        }

        // Validate department if provided
        if (departmentId) {
            const department = await prisma.department.findUnique({
                where: { id: parseInt(departmentId) },
            });
            if (!department) {
                return NextResponse.json(
                    { error: "Invalid department" },
                    { status: 400 }
                );
            }
        }

        // Validate dates
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (startAt) {
            startDate = new Date(startAt);
            if (isNaN(startDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid start date" },
                    { status: 400 }
                );
            }
        }

        if (endAt) {
            endDate = new Date(endAt);
            if (isNaN(endDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid end date" },
                    { status: 400 }
                );
            }
        }

        if (startDate && endDate && endDate <= startDate) {
            return NextResponse.json(
                { error: "End date must be after start date" },
                { status: 400 }
            );
        }

        // Validate status
        if (!["DRAFT", "RUNNING", "ENDED"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        const election = await prisma.election.update({
            where: { id: electionId },
            data: {
                name: name.trim(),
                category,
                status,
                startAt: startDate,
                endAt: endDate,
                departmentId: departmentId ? parseInt(departmentId) : null,
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        positions: true,
                        votes: true,
                    },
                },
            },
        });

        return NextResponse.json({ election });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Election not found" }, { status: 404 });
        }
        console.error("Update election error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to update election" },
            { status: 500 }
        );
    }
}

// DELETE - Delete election
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
        const electionId = parseInt(id);

        if (isNaN(electionId)) {
            return NextResponse.json({ error: "Invalid election ID" }, { status: 400 });
        }

        // Check if election has positions, votes, or voter keys
        const election = await prisma.election.findUnique({
            where: { id: electionId },
            include: {
                _count: {
                    select: {
                        positions: true,
                        votes: true,
                        voterKeys: true,
                    },
                },
            },
        });

        if (!election) {
            return NextResponse.json({ error: "Election not found" }, { status: 404 });
        }

        if (election._count.positions > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete election with positions. Remove all positions first.",
                },
                { status: 400 }
            );
        }

        if (election._count.votes > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete election with votes. Remove all votes first.",
                },
                { status: 400 }
            );
        }

        await prisma.election.delete({
            where: { id: electionId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Election not found" }, { status: 404 });
        }
        console.error("Delete election error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to delete election" },
            { status: 500 }
        );
    }
}


