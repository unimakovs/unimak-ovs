import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOTP } from "@/lib/voter-auth";

// POST - Verify OTP and mark email as verified
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json(
                { error: "Email and OTP are required" },
                { status: 400 }
            );
        }

        // Find the most recent unexpired, unconsumed OTP
        const otpRecord = await prisma.loginOTP.findFirst({
            where: {
                email: email.trim().toLowerCase(),
                purpose: "VOTER_EMAIL_VERIFICATION",
                consumed: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!otpRecord) {
            return NextResponse.json(
                { error: "Invalid or expired OTP" },
                { status: 400 }
            );
        }

        // Verify OTP
        const isValid = await verifyOTP(otp, otpRecord.codeHash);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid OTP" },
                { status: 401 }
            );
        }

        // Mark OTP as consumed
        await prisma.loginOTP.update({
            where: { id: otpRecord.id },
            data: { consumed: true },
        });

        // Find voter by email
        const voterToVerify = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });

        if (!voterToVerify) {
            return NextResponse.json(
                { error: "Voter not found" },
                { status: 404 }
            );
        }

        // Mark voter's email as verified
        const voter = await prisma.user.update({
            where: { id: voterToVerify.id },
            data: { emailVerified: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                studentId: true,
                department: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Email verified successfully",
            voter,
        });
    } catch (error: any) {
        console.error("OTP verification error:", error);
        return NextResponse.json(
            { error: error?.message || "OTP verification failed" },
            { status: 500 }
        );
    }
}

