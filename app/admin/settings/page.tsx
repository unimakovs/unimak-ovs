import { prisma } from "@/lib/prisma";

async function getSystemStats() {
    const [totalUsers, totalElections, totalDepartments, totalVotes] = await Promise.all([
        prisma.user.count(),
        prisma.election.count(),
        prisma.department.count(),
        prisma.vote.count(),
    ]);

    return {
        totalUsers,
        totalElections,
        totalDepartments,
        totalVotes,
    };
}

export default async function AdminSettingsPage() {
    const stats = await getSystemStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Configure system-level preferences and view system information.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Users</span>
                            <span className="text-sm font-medium text-gray-900">{stats.totalUsers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Elections</span>
                            <span className="text-sm font-medium text-gray-900">{stats.totalElections}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Departments</span>
                            <span className="text-sm font-medium text-gray-900">{stats.totalDepartments}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Votes Cast</span>
                            <span className="text-sm font-medium text-gray-900">{stats.totalVotes}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Email Service</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Configured via environment variables (EMAIL_USER, EMAIL_PASS)
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Database</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Connected
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            PostgreSQL database via Prisma ORM
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Authentication</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Secure
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            NextAuth.js with JWT sessions and role-based access control
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Advanced settings and configuration options will be available in future updates.
                </p>
            </div>
        </div>
    );
}
