import { prisma } from "@/lib/prisma";

async function getStats() {
    try {
        const [activeElections, totalVoters, runningElections, totalElections, totalVotes, draftElections] = await Promise.all([
            prisma.election.count({ where: { status: "RUNNING" } }),
            prisma.user.count({ where: { role: "STUDENT" } }),
            prisma.election.count({ where: { status: "RUNNING" } }),
            prisma.election.count(),
            prisma.vote.count(),
            prisma.election.count({ where: { status: "DRAFT" } }),
        ]);

        return {
            activeElections,
            totalVoters,
            runningElections,
            totalElections,
            totalVotes,
            draftElections,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Return default values on error
        return {
            activeElections: 0,
            totalVoters: 0,
            runningElections: 0,
            totalElections: 0,
            totalVotes: 0,
            draftElections: 0,
        };
    }
}

export default async function AdminDashboardPage() {
    const stats = await getStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome to UniMak Online Voting System admin portal.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Elections</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.activeElections}</p>
                        </div>
                        <div className="text-3xl">🗳️</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        {stats.runningElections} currently running
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Registered Voters</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVoters}</p>
                        </div>
                        <div className="text-3xl">👥</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Total student accounts
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Votes</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVotes}</p>
                        </div>
                        <div className="text-3xl">✅</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Votes cast across all elections
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">All Elections</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalElections}</p>
                        </div>
                        <div className="text-3xl">📋</div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        {stats.draftElections} in draft
                    </p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        <a
                            href="/admin/manage/elections"
                            className="block px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium"
                        >
                            ➕ Create New Election
                        </a>
                        <a
                            href="/admin/manage/voters"
                            className="block px-4 py-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-medium"
                        >
                            👥 Manage Voters
                        </a>
                        <a
                            href="/admin/results"
                            className="block px-4 py-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-medium"
                        >
                            📊 View Results
                        </a>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Database</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Connected
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Email Service</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Authentication</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Secure
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
