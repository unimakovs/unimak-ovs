import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// GET - Get single department
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
        const departmentId = parseInt(id);

        if (isNaN(departmentId)) {
            return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
        }

        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                _count: {
                    select: {
                        students: true,
                        elections: true,
                    },
                },
            },
        });

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }

        return NextResponse.json({ department });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch department" },
            { status: 500 }
        );
    }
}

// PUT - Update department
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
        const departmentId = parseInt(id);

        if (isNaN(departmentId)) {
            return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Department name is required" },
                { status: 400 }
            );
        }

        const department = await prisma.department.update({
            where: { id: departmentId },
            data: {
                name: name.trim(),
            },
        });

        return NextResponse.json({ department });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Department with this name already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error?.message || "Failed to update department" },
            { status: 500 }
        );
    }
}

// DELETE - Delete department
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
        const departmentId = parseInt(id);

        if (isNaN(departmentId)) {
            return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
        }

        // Check if department has students or elections
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                _count: {
                    select: {
                        students: true,
                        elections: true,
                    },
                },
            },
        });

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }

        if (department._count.students > 0 || department._count.elections > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete department with associated students or elections",
                },
                { status: 400 }
            );
        }

        await prisma.department.delete({
            where: { id: departmentId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }
        return NextResponse.json(
            { error: error?.message || "Failed to delete department" },
            { status: 500 }
        );
    }
}

