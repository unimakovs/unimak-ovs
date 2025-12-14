import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET - List all elections
export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const elections = await prisma.election.findMany({
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
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ elections });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch elections" },
            { status: 500 }
        );
    }
}

// POST - Create new election
export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        const validStatus = status || "DRAFT";
        if (!["DRAFT", "RUNNING", "ENDED"].includes(validStatus)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Get admin user ID from token
        const adminUser = await prisma.user.findUnique({
            where: { email: token.email as string },
        });

        if (!adminUser || adminUser.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Admin user not found" },
                { status: 404 }
            );
        }

        const election = await prisma.election.create({
            data: {
                name: name.trim(),
                category,
                status: validStatus,
                startAt: startDate,
                endAt: endDate,
                departmentId: departmentId ? parseInt(departmentId) : null,
                createdById: adminUser.id,
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

        return NextResponse.json({ election }, { status: 201 });
    } catch (error: any) {
        console.error("Create election error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to create election" },
            { status: 500 }
        );
    }
}


