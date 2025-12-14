import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// GET - Get single voter
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
        const voterId = parseInt(id);

        if (isNaN(voterId)) {
            return NextResponse.json({ error: "Invalid voter ID" }, { status: 400 });
        }

        const voter = await prisma.user.findUnique({
            where: { id: voterId },
            include: {
                department: true,
                _count: {
                    select: {
                        votes: true,
                        candidates: true,
                    },
                },
            },
        });

        if (!voter || voter.role !== "STUDENT") {
            return NextResponse.json({ error: "Voter not found" }, { status: 404 });
        }

        return NextResponse.json({ voter });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch voter" },
            { status: 500 }
        );
    }
}

// PUT - Update voter
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
        const voterId = parseInt(id);

        if (isNaN(voterId)) {
            return NextResponse.json({ error: "Invalid voter ID" }, { status: 400 });
        }

        const body = await request.json();
        const { email, firstName, lastName, studentId, departmentId } = body;

        if (!email || typeof email !== "string" || email.trim().length === 0) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        if (!firstName || typeof firstName !== "string" || firstName.trim().length === 0) {
            return NextResponse.json(
                { error: "First name is required" },
                { status: 400 }
            );
        }

        if (!lastName || typeof lastName !== "string" || lastName.trim().length === 0) {
            return NextResponse.json(
                { error: "Last name is required" },
                { status: 400 }
            );
        }

        if (!studentId || typeof studentId !== "string" || studentId.trim().length === 0) {
            return NextResponse.json(
                { error: "Student ID is required" },
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

        // Check for duplicate email (excluding current voter)
        const existingEmail = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
        if (existingEmail && existingEmail.id !== voterId) {
            return NextResponse.json(
                { error: "A user with this email already exists" },
                { status: 409 }
            );
        }

        // Check for duplicate student ID (excluding current voter)
        const existingStudentId = await prisma.user.findUnique({
            where: { studentId: studentId.trim() },
        });
        if (existingStudentId && existingStudentId.id !== voterId) {
            return NextResponse.json(
                { error: "A user with this student ID already exists" },
                { status: 409 }
            );
        }

        const voter = await prisma.user.update({
            where: { id: voterId },
            data: {
                email: email.trim().toLowerCase(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                studentId: studentId.trim(),
                ...(departmentId
                    ? {
                          department: {
                              connect: { id: parseInt(departmentId) },
                          },
                      }
                    : {
                          department: {
                              disconnect: true,
                          },
                      }),
            },
            include: {
                department: true,
            },
        });

        return NextResponse.json({ voter });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Voter not found" }, { status: 404 });
        }
        if (error.code === "P2002") {
            const field = error.meta?.target?.[0] || "field";
            return NextResponse.json(
                { error: `A voter with this ${field} already exists` },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error?.message || "Failed to update voter" },
            { status: 500 }
        );
    }
}

// DELETE - Delete voter
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
        const voterId = parseInt(id);

        if (isNaN(voterId)) {
            return NextResponse.json({ error: "Invalid voter ID" }, { status: 400 });
        }

        // Check if voter has votes or is a candidate
        const voter = await prisma.user.findUnique({
            where: { id: voterId },
            include: {
                _count: {
                    select: {
                        votes: true,
                        candidates: true,
                    },
                },
            },
        });

        if (!voter || voter.role !== "STUDENT") {
            return NextResponse.json({ error: "Voter not found" }, { status: 404 });
        }

        if (voter._count.votes > 0 || voter._count.candidates > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete voter with associated votes or candidates",
                },
                { status: 400 }
            );
        }

        await prisma.user.delete({
            where: { id: voterId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Voter not found" }, { status: 404 });
        }
        return NextResponse.json(
            { error: error?.message || "Failed to delete voter" },
            { status: 500 }
        );
    }
}

