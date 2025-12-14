// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface User {
        role: "ADMIN" | "STUDENT";
    }
    interface Session {
        user: DefaultSession["user"];
        role?: "ADMIN" | "STUDENT";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "ADMIN" | "STUDENT";
    }
}
