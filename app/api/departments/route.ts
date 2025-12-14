import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// GET - List all departments
export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: {
                        students: true,
                        elections: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json({ departments });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch departments" },
            { status: 500 }
        );
    }
}

// POST - Create new department
export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { name } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Department name is required" },
                { status: 400 }
            );
        }

        const department = await prisma.department.create({
            data: {
                name: name.trim(),
            },
        });

        return NextResponse.json({ department }, { status: 201 });
    } catch (error: any) {
        console.error("Create department error:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Department with this name already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error?.message || "Failed to create department" },
            { status: 500 }
        );
    }
}

