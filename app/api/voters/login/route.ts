import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyVoterKey, generateOTP, hashOTP } from "@/lib/voter-auth";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs"; // Required for nodemailer

// POST - Voter login (email OR studentId, password, voter key)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, studentId, password, voterKey } = body;

        if ((!email && !studentId) || !password || !voterKey) {
            return NextResponse.json(
                { error: "Email or Student ID, password, and voter key are required" },
                { status: 400 }
            );
        }

        // Find voter by email or studentId
        let voter;
        if (email) {
            voter = await prisma.user.findUnique({
                where: { email: email.trim().toLowerCase() },
            });
        } else if (studentId) {
            voter = await prisma.user.findUnique({
                where: { studentId: studentId.trim() },
            });
        }

        if (!voter || voter.role !== "STUDENT") {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password
        if (!voter.passwordHash) {
            return NextResponse.json(
                { error: "Voter account not properly set up" },
                { status: 400 }
            );
        }

        const passwordValid = await bcrypt.compare(password, voter.passwordHash);
        if (!passwordValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify voter key
        if (!voter.voterKeyHash) {
            return NextResponse.json(
                { error: "Voter key not set up" },
                { status: 400 }
            );
        }

        const voterKeyValid = await verifyVoterKey(voterKey, voter.voterKeyHash);
        if (!voterKeyValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if email is verified
        if (!voter.emailVerified) {
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
                requiresOTP: true,
                email: voter.email,
                message: "OTP sent to your email. Please verify to continue.",
            });
        }

        // Email already verified, return success
        return NextResponse.json({
            success: true,
            voter: {
                id: voter.id,
                email: voter.email,
                firstName: voter.firstName,
                lastName: voter.lastName,
            },
        });
    } catch (error: any) {
        console.error("Voter login error:", error);
        return NextResponse.json(
            { error: error?.message || "Login failed" },
            { status: 500 }
        );
    }
}

