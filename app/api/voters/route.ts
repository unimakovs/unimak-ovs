import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { generatePassword, generateVoterKey, hashVoterKey } from "@/lib/voter-auth";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs"; // Required for nodemailer

// GET - List all voters (students)
export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const voters = await prisma.user.findMany({
            where: { role: "STUDENT" },
            include: {
                department: true,
                _count: {
                    select: {
                        votes: true,
                        candidates: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ voters });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch voters" },
            { status: 500 }
        );
    }
}

// POST - Create new voter
export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        // Check for duplicate email
        const existingEmail = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
        if (existingEmail) {
            return NextResponse.json(
                { error: "A user with this email already exists" },
                { status: 409 }
            );
        }

        // Check for duplicate student ID (required)
        const existingStudentId = await prisma.user.findUnique({
            where: { studentId: studentId.trim() },
        });
        if (existingStudentId) {
            return NextResponse.json(
                { error: "A user with this student ID already exists" },
                { status: 409 }
            );
        }

        // Generate password and voter key
        const password = generatePassword();
        const voterKey = generateVoterKey();
        const passwordHash = await bcrypt.hash(password, 12);
        const voterKeyHash = await hashVoterKey(voterKey);

        const voter = await prisma.user.create({
            data: {
                email: email.trim().toLowerCase(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                studentId: studentId.trim(),
                role: "STUDENT",
                passwordHash,
                voterKeyHash,
                emailVerified: false,
                ...(departmentId
                    ? {
                          department: {
                              connect: { id: parseInt(departmentId) },
                          },
                      }
                    : {}),
            },
            include: {
                department: true,
            },
        });

        // Send credentials email
        let emailSent = false;
        let emailError: string | null = null;
        
        // Check if email is configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            emailError = "Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.";
            console.error("Email configuration error:", emailError);
        } else {
            try {
                await sendMail({
                    to: voter.email,
                    subject: "Your UniMak Voting System Credentials",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #1e40af;">Welcome to UniMak Voting System</h2>
                            <p>Dear ${voter.firstName} ${voter.lastName},</p>
                            <p>Your voter account has been created. Please use the following credentials to log in:</p>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>Email:</strong> ${voter.email}</p>
                                <p><strong>Password:</strong> ${password}</p>
                                <p><strong>Voter Key:</strong> ${voterKey}</p>
                            </div>
                            <p style="color: #dc2626; font-weight: bold;">⚠️ Please keep these credentials secure and do not share them with anyone.</p>
                            <p>On your first login, you will be required to verify your email with an OTP code.</p>
                            <p>You can log in at: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/voter/login" style="color: #1e40af;">${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/voter/login</a></p>
                            <p>Best regards,<br>UniMak Electoral Commission</p>
                        </div>
                    `,
                });
                emailSent = true;
                console.log(`✅ Credentials email sent successfully to ${voter.email}`);
            } catch (err: any) {
                emailError = err?.message || String(err) || "Unknown error occurred";
                console.error("❌ Failed to send credentials email:", {
                    error: emailError,
                    to: voter.email,
                    details: err,
                });
            }
        }

        // Always return credentials so admin can see/copy them
        return NextResponse.json(
            {
                voter,
                password,
                voterKey,
                emailSent,
                ...(emailSent ? {} : { 
                    warning: emailError || "Voter created but email could not be sent. Please provide credentials manually.",
                    emailError: emailError || "Email sending failed",
                }),
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error.code === "P2002") {
            const field = error.meta?.target?.[0] || "field";
            return NextResponse.json(
                { error: `A voter with this ${field} already exists` },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error?.message || "Failed to create voter" },
            { status: 500 }
        );
    }
}

