// prisma/seed.cjs
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
    // Admin (Electoral Commissioner)
    const passwordHash = await bcrypt.hash("Admin@12345", 12);
    const admin = await db.user.upsert({
        where: { email: "ec@unimak.edu.sl" },
        update: { role: "ADMIN", passwordHash },
        create: {
            email: "ec@unimak.edu.sl",
            firstName: "Electoral",
            lastName: "Commissioner",
            role: "ADMIN",
            passwordHash,
        },
    });

    // Departments
    const cs = await db.department.upsert({
        where: { name: "Computer Science" },
        update: {},
        create: { name: "Computer Science" },
    });

    await db.department.upsert({
        where: { name: "Mass Communication" },
        update: {},
        create: { name: "Mass Communication" },
    });

    // Sample elections (DRAFT)
    const src = await db.election.create({
        data: {
            name: "SRC General Elections 2025",
            category: "SRC",
            status: "DRAFT",
            createdById: admin.id,
        },
    });

    const csDept = await db.election.create({
        data: {
            name: "Computer Science Department Elections 2025",
            category: "DEPARTMENT",
            departmentId: cs.id,
            status: "DRAFT",
            createdById: admin.id,
        },
    });

    await db.position.createMany({
        data: [
            { name: "President", electionId: csDept.id, maxChoices: 1 },
            { name: "General Secretary", electionId: csDept.id, maxChoices: 1 },
        ],
    });

    console.log("Seeded admin, departments, elections/positions");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await db.$disconnect(); });
