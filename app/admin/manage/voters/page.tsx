import { prisma } from "@/lib/prisma";
import { VotersClient } from "./VotersClient";

async function getVoters() {
    return await prisma.user.findMany({
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
}

async function getDepartments() {
    return await prisma.department.findMany({
        orderBy: {
            name: "asc",
        },
    });
}

export default async function ManageVotersPage() {
    const [voters, departments] = await Promise.all([
        getVoters(),
        getDepartments(),
    ]);

    return <VotersClient initialVoters={voters} departments={departments} />;
}
