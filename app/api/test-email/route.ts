// app/api/test-email/route.ts
export const runtime = "nodejs"; // IMPORTANT: Nodemailer requires Node runtime

import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export async function GET() {
    try {
        // Check if email is configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return NextResponse.json({ 
                ok: false, 
                error: "Email not configured. Please set EMAIL_USER and EMAIL_PASS in your .env file.",
                details: {
                    EMAIL_USER: process.env.EMAIL_USER ? "✅ Set" : "❌ Missing",
                    EMAIL_PASS: process.env.EMAIL_PASS ? "✅ Set" : "❌ Missing",
                }
            }, { status: 500 });
        }

        await sendMail({
            to: process.env.EMAIL_USER, // send to yourself
            subject: "UNIMAK OVS – Email Test",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1e40af;">Email Test Successful ✅</h2>
                    <p>If you received this email, your email configuration is working correctly!</p>
                    <p><strong>Email Service:</strong> Gmail (via Nodemailer)</p>
                    <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p>You can now send voter credentials and OTP codes.</p>
                </div>
            `,
        });
        
        return NextResponse.json({ 
            ok: true, 
            message: "Test email sent successfully! Check your inbox.",
            sentTo: process.env.EMAIL_USER,
        });
    } catch (e: any) {
        return NextResponse.json({ 
            ok: false, 
            error: e?.message || String(e),
            details: {
                code: e?.code,
                command: e?.command,
                response: e?.response,
            },
            troubleshooting: [
                "1. Verify EMAIL_USER and EMAIL_PASS are set in .env file",
                "2. For Gmail, use an App Password (not your regular password)",
                "3. Enable 2-Step Verification in your Google Account",
                "4. Generate App Password: https://myaccount.google.com/apppasswords",
            ]
        }, { status: 500 });
    }
}

