export function AdminDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div>
                <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-96 bg-gray-200 rounded"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                            </div>
                            <div className="h-10 w-10 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-3 w-32 bg-gray-200 rounded mt-2"></div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & System Status Skeleton */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-10 w-full bg-gray-200 rounded"></div>
                        <div className="h-10 w-full bg-gray-200 rounded"></div>
                        <div className="h-10 w-full bg-gray-200 rounded"></div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-20 bg-gray-200 rounded"></div>
                            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-28 bg-gray-200 rounded"></div>
                            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

