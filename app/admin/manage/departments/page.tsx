import { prisma } from "@/lib/prisma";
import { DepartmentsClient } from "./DepartmentsClient";

async function getDepartments() {
    return await prisma.department.findMany({
        include: {
            _count: {
                select: {
                    students: true,
                    elections: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
}

export default async function ManageDepartmentsPage() {
    const departments = await getDepartments();

    return <DepartmentsClient initialDepartments={departments} />;
}
