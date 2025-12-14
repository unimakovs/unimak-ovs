// app/api/test-mail/route.ts
export const runtime = "nodejs"; // IMPORTANT: Nodemailer requires Node runtime

import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export async function GET() {
    try {
        await sendMail({
            to: process.env.EMAIL_USER!, // send to yourself
            subject: "UNIMAK OVS – Mail test",
            html: "<p>If you see this, mail works ✅</p>",
        });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
    }
}
