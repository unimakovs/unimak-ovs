"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface Department {
    id: number;
    name: string;
}

interface Election {
    id: number;
    name: string;
    category: string;
    status: string;
    department: Department | null;
    totalVotes: number;
}

interface Candidate {
    id: number;
    displayName: string;
    photoUrl: string | null;
    voteCount: number;
}

interface Position {
    id: number;
    name: string;
    maxChoices: number;
    totalVotes: number;
    candidatesCount: number;
    candidates: Candidate[];
}

interface ElectionResults {
    election: Election;
    positions: Position[];
}

interface ResultsClientProps {
    initialElections: Array<{
        id: number;
        name: string;
        category: string;
        status: string;
        department: Department | null;
    }>;
}

const COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
];

export function ResultsClient({ initialElections }: ResultsClientProps) {
    const [selectedElectionId, setSelectedElectionId] = useState<number | "">("");
    const [results, setResults] = useState<ElectionResults | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedElectionId && typeof selectedElectionId === "number") {
            fetchResults(selectedElectionId);
        } else {
            setResults(null);
        }
    }, [selectedElectionId]);

    const fetchResults = async (electionId: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/elections/${electionId}/results`);
            const data = await res.json();
            if (res.ok) {
                // Sort positions: President first, then Secretary General, then others alphabetically
                const sortedPositions = [...(data.positions || [])].sort((a, b) => {
                    const aName = a.name.toLowerCase();
                    const bName = b.name.toLowerCase();
                    
                    // President always comes first
                    if (aName.includes("president") && !bName.includes("president")) return -1;
                    if (!aName.includes("president") && bName.includes("president")) return 1;
                    
                    // Secretary General comes second
                    if (aName.includes("secretary") && aName.includes("general") && 
                        !(bName.includes("president") || (bName.includes("secretary") && bName.includes("general")))) return -1;
                    if (bName.includes("secretary") && bName.includes("general") && 
                        !(aName.includes("president") || (aName.includes("secretary") && aName.includes("general")))) return 1;
                    
                    // Otherwise, alphabetical order
                    return aName.localeCompare(bName);
                });
                
                setResults({
                    ...data,
                    positions: sortedPositions,
                });
            } else {
                console.error("Failed to fetch results:", data.error);
                setResults(null);
            }
        } catch (error) {
            console.error("Error fetching results:", error);
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    const prepareChartData = (position: Position) => {
        return position.candidates.map((candidate, index) => ({
            name: candidate.displayName,
            votes: candidate.voteCount,
            percentage: position.totalVotes > 0 
                ? ((candidate.voteCount / position.totalVotes) * 100).toFixed(1)
                : "0",
            color: COLORS[index % COLORS.length],
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Election Results</h1>
                <p className="text-gray-600 mt-1">View tallies and results for elections.</p>
            </div>

            {/* Election Selector */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Election
                </label>
                <select
                    value={selectedElectionId}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSelectedElectionId(value === "" ? "" : parseInt(value));
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Select an election --</option>
                    {initialElections.map((election) => (
                        <option key={election.id} value={election.id}>
                            {election.name} ({election.category}) - {election.status}
                        </option>
                    ))}
                </select>
            </div>

            {/* Results Display */}
            {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading results...</p>
                </div>
            ) : results ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                    {/* Election Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {results.election.name}
                        </h2>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                {results.election.category}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                {results.election.status}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                {results.election.department?.name || "University-wide (SRC)"}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                Total Votes: {results.election.totalVotes}
                            </span>
                        </div>
                    </div>

                    {/* Positions Results */}
                    <div className="px-8 py-6 space-y-8">
                        {results.positions.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No positions available for this election.</p>
                            </div>
                        ) : (
                            results.positions.map((position) => {
                                const chartData = prepareChartData(position);
                                
                                return (
                                    <div key={position.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                {position.name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>
                                                    Total Votes: <span className="font-semibold text-gray-900">{position.totalVotes}</span>
                                                </span>
                                                <span>
                                                    Candidates: <span className="font-semibold text-gray-900">{position.candidatesCount}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {position.candidates.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No candidates for this position.
                                            </p>
                                        ) : (
                                            <div className="space-y-6">
                                                {/* Bar Chart */}
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <ResponsiveContainer width="100%" height={500}>
                                                        <BarChart
                                                            data={chartData}
                                                            margin={{
                                                                top: 20,
                                                                right: 30,
                                                                left: 20,
                                                                bottom: 80,
                                                            }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis 
                                                                dataKey="name" 
                                                                angle={-45}
                                                                textAnchor="end"
                                                                height={120}
                                                                tick={{ fontSize: 12, fill: '#000000' }}
                                                            />
                                                            <YAxis 
                                                                label={{ value: 'Votes', angle: -90, position: 'insideLeft' }}
                                                                tick={{ fontSize: 12 }}
                                                            />
                                                            <Tooltip 
                                                                contentStyle={{ color: '#000000' }}
                                                                itemStyle={{ color: '#000000' }}
                                                                labelStyle={{ color: '#000000' }}
                                                                formatter={(value: number, name: string, props: any) => [
                                                                    `${value} votes (${props.payload.percentage}%)`,
                                                                    "Votes"
                                                                ]}
                                                            />
                                                            <Legend />
                                                            <Bar dataKey="votes" name="Votes" radius={[8, 8, 0, 0]}>
                                                                {chartData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* Candidate List */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {position.candidates.map((candidate, index) => {
                                                        const percentage = position.totalVotes > 0
                                                            ? ((candidate.voteCount / position.totalVotes) * 100).toFixed(1)
                                                            : "0";
                                                        
                                                        return (
                                                            <div 
                                                                key={candidate.id} 
                                                                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                                                            >
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    {candidate.photoUrl ? (
                                                                        <img
                                                                            src={candidate.photoUrl}
                                                                            alt={candidate.displayName}
                                                                            className="w-12 h-12 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                                            <span className="text-gray-400 text-xs">No Photo</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1">
                                                                        <p className="font-semibold text-gray-900">{candidate.displayName}</p>
                                                                        <p className="text-xs text-gray-500">Candidate #{index + 1}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm font-medium text-gray-700">Votes:</span>
                                                                        <span className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                                                                            {candidate.voteCount}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm font-medium text-gray-700">Percentage:</span>
                                                                        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                                        <div
                                                                            className="h-2 rounded-full transition-all"
                                                                            style={{
                                                                                width: `${percentage}%`,
                                                                                backgroundColor: COLORS[index % COLORS.length],
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : selectedElectionId ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No Results Available</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Unable to load results for the selected election.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Select an Election</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Choose an election from the dropdown above to view its results.
                    </p>
                </div>
            )}
        </div>
    );
}

