import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, hashOTP } from "@/lib/voter-auth";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs"; // Required for nodemailer

// POST - Resend OTP for email verification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Find voter
        const voter = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });

        if (!voter || voter.role !== "STUDENT") {
            return NextResponse.json(
                { error: "Voter not found" },
                { status: 404 }
            );
        }

        // Check if already verified
        if (voter.emailVerified) {
            return NextResponse.json(
                { error: "Email is already verified" },
                { status: 400 }
            );
        }

        // Generate and send OTP
        const otp = generateOTP();
        const otpHash = await hashOTP(otp);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

        // Delete any existing unexpired OTPs for this email
        await prisma.loginOTP.deleteMany({
            where: {
                email: voter.email,
                purpose: "VOTER_EMAIL_VERIFICATION",
                consumed: false,
                expiresAt: { gt: new Date() },
            },
        });

        // Create new OTP
        await prisma.loginOTP.create({
            data: {
                email: voter.email,
                codeHash: otpHash,
                purpose: "VOTER_EMAIL_VERIFICATION",
                expiresAt,
            },
        });

        // Send OTP email
        try {
            await sendMail({
                to: voter.email,
                subject: "UniMak Voting System - Email Verification OTP",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1e40af;">Email Verification</h2>
                        <p>Dear ${voter.firstName} ${voter.lastName},</p>
                        <p>Please use the following OTP code to verify your email and complete your login:</p>
                        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                            <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                        </div>
                        <p style="color: #dc2626;">This code will expire in 10 minutes.</p>
                        <p>If you did not request this code, please ignore this email.</p>
                        <p>Best regards,<br>UniMak Electoral Commission</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("Failed to send OTP email:", emailError);
            return NextResponse.json(
                { error: "Failed to send OTP. Please try again later." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "OTP has been resent to your email.",
        });
    } catch (error: any) {
        console.error("Resend OTP error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to resend OTP" },
            { status: 500 }
        );
    }
}

