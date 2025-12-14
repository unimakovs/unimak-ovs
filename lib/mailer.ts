// lib/mailer.ts
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (!transporter) {
        // Validate environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in environment variables");
        }

        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: { 
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                // Do not fail on invalid certificates
                rejectUnauthorized: false,
            },
        });

        // Verify connection
        transporter.verify((error) => {
            if (error) {
                console.error("❌ Email transporter verification failed:", error);
            } else {
                console.log("✅ Email transporter is ready to send messages");
            }
        });
    }
    return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
    try {
        const t = getTransporter();
        const result = await t.sendMail({ 
            from: `"UNIMAK EC" <${process.env.EMAIL_USER}>`, 
            ...opts 
        });
        console.log(`✅ Email sent successfully. Message ID: ${result.messageId}`);
        return result;
    } catch (error: any) {
        console.error("❌ Email sending error:", {
            error: error?.message || String(error),
            code: error?.code,
            command: error?.command,
            response: error?.response,
        });
        throw error;
    }
}
