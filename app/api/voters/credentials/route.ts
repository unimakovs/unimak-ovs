import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get credentials for voters (admin only)
// Note: This returns credentials stored when voters were created
export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const voterIds = request.nextUrl.searchParams.get("voterIds");
        
        if (!voterIds) {
            return NextResponse.json(
                { error: "Voter IDs are required" },
                { status: 400 }
            );
        }

        const ids = voterIds.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        
        if (ids.length === 0) {
            return NextResponse.json(
                { error: "Invalid voter IDs" },
                { status: 400 }
            );
        }

        // Get voters
        const voters = await prisma.user.findMany({
            where: {
                id: { in: ids },
                role: "STUDENT",
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                studentId: true,
            },
        });

        // For now, return empty credentials since we can't retrieve hashed passwords
        // In a production system, you would store credentials in a secure vault or encrypted storage
        // For this implementation, credentials are only available when voters are created
        const credentials = voters.map(voter => ({
            voterId: voter.id,
            email: voter.email,
            password: "", // Cannot retrieve - only available at creation time
            voterKey: "", // Cannot retrieve - only available at creation time
        }));

        return NextResponse.json({ credentials });
    } catch (error: any) {
        console.error("Error fetching voter credentials:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to fetch credentials" },
            { status: 500 }
        );
    }
}

