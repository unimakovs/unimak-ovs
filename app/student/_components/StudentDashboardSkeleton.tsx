export function StudentDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 p-8 animate-pulse">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-6">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-96 bg-gray-200 rounded"></div>
                </div>

                {/* Content Card Skeleton */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded mt-4"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

