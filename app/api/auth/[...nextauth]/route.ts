import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
    session: { strategy: "jwt" },
    pages: { signIn: "/admin/login" },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(creds) {
                const email = (creds?.email ?? "").toString().trim().toLowerCase();
                const password = (creds?.password ?? "").toString();

                if (!email || !password) return null;

                const user = await prisma.user.findUnique({ 
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        passwordHash: true,
                    }
                });
                
                // Check if user exists, has password hash, and is an ADMIN
                if (!user || !user.passwordHash || user.role !== "ADMIN") {
                    return null;
                }

                // Verify password
                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                // Return admin user
                return {
                    id: String(user.id),
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role, // "ADMIN"
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // When the user logs in, persist role to the token
            if (user) {
                token.role = user.role; // typed from our augmentation
            }
            return token;
        },
        async session({ session, token }) {
            // Expose role on the session
            session.role = token.role;
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Allow redirects to login pages and the requested URL
            try {
                const u = new URL(url, baseUrl);
                if (u.pathname.includes("/login")) return u.toString();
                // If URL is already set, use it
                if (url && url !== baseUrl) return url;
            } catch {}

            // Default redirect - will be handled by login page based on role
            return `${baseUrl}/admin/dashboard`;
        },
    },
});

export { handler as GET, handler as POST };
