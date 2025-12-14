// lib/voter-auth.ts
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Generate a random password for voters
 */
export function generatePassword(length: number = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

/**
 * Generate a random voter key
 */
export function generateVoterKey(): string {
    // Generate a 16-character alphanumeric key
    return crypto.randomBytes(8).toString("hex").toUpperCase();
}

/**
 * Hash a voter key
 */
export async function hashVoterKey(key: string): Promise<string> {
    return bcrypt.hash(key, 12);
}

/**
 * Verify a voter key
 */
export async function verifyVoterKey(key: string, hash: string): Promise<boolean> {
    return bcrypt.compare(key, hash);
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP
 */
export async function hashOTP(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
}

/**
 * Verify an OTP
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
}

