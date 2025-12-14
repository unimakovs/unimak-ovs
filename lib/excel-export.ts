// lib/excel-export.ts
// Simple CSV/Excel export utility

export interface VoterExportData {
    studentId: string;
    firstName: string;
    lastName: string;
    department: string;
    email: string;
    password?: string;
    voterKey?: string;
}

export function exportVotersToCSV(voters: VoterExportData[], filename: string = "voters") {
    // CSV header
    const headers = ["Student ID", "First Name", "Last Name", "Department", "Email", "Password", "Voter Key"];
    
    // Convert data to CSV rows
    const rows = voters.map(voter => [
        voter.studentId || "",
        voter.firstName || "",
        voter.lastName || "",
        voter.department || "",
        voter.email || "",
        voter.password || "",
        voter.voterKey || "",
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

