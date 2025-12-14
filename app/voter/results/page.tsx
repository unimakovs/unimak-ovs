"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoterLayoutWrapper } from "../_components/VoterLayoutWrapper";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface Department {
    id: number;
    name: string;
}

interface Election {
    id: number;
    name: string;
    category: string;
    department: Department | null;
    _count: {
        positions: number;
        votes: number;
    };
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
    totalVotes: number;
    candidates: Candidate[];
}

interface ElectionResults {
    election: {
        id: number;
        name: string;
        category: string;
        department: Department | null;
    };
    positions: Position[];
}

const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export default function VoterResultsPage() {
    const router = useRouter();
    const [voter, setVoter] = useState<{ id: number } | null>(null);
    const [elections, setElections] = useState<Election[]>([]);
    const [allResults, setAllResults] = useState<ElectionResults[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        const voterData = localStorage.getItem("voter");
        if (!voterData) {
            router.push("/");
            return;
        }

        try {
            const parsed = JSON.parse(voterData);
            setVoter(parsed);
            fetchElectionsAndResults(parsed.id);
        } catch (err) {
            router.push("/");
        }
    }, [router]);

    const fetchElectionsAndResults = async (voterId: number) => {
        setLoading(true);
        setLoadingResults(true);
        try {
            // Fetch all ended elections from voter's department
            const res = await fetch("/api/voters/results", {
                headers: {
                    "x-voter-id": voterId.toString(),
                },
            });
            const data = await res.json();
            
            if (res.ok && data.elections) {
                setElections(data.elections);
                
                // Fetch results for all elections
                const resultsPromises = data.elections.map((election: Election) =>
                    fetch(`/api/voters/results?electionId=${election.id}`, {
                        headers: {
                            "x-voter-id": voterId.toString(),
                        },
                    }).then((r) => r.json())
                );
                
                const resultsData = await Promise.all(resultsPromises);
                const validResults = resultsData
                    .filter((r) => r.election && r.positions)
                    .map((r) => r as ElectionResults);
                
                setAllResults(validResults);
            }
        } catch (error) {
            console.error("Failed to fetch elections and results:", error);
        } finally {
            setLoading(false);
            setLoadingResults(false);
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
        <VoterLayoutWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Election Results</h1>
                    <p className="text-gray-600 mt-1">View results for ended elections from your department.</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-sm text-gray-500">Loading elections...</p>
                    </div>
                ) : elections.length === 0 ? (
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
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No Ended Elections</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            There are no ended elections from your department to view results.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {allResults.map((results) => (
                            <div key={results.election.id} className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                                {/* Election Header */}
                                <div className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 px-8 py-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {results.election.name}
                                    </h2>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                            {results.election.category}
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                            {results.election.department?.name || "Department Election"}
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                            ENDED
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
                                                                Candidates: <span className="font-semibold text-gray-900">{position.candidates.length}</span>
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
                                                                <ResponsiveContainer width="100%" height={300}>
                                                                    <BarChart
                                                                        data={chartData}
                                                                        margin={{
                                                                            top: 20,
                                                                            right: 30,
                                                                            left: 20,
                                                                            bottom: 60,
                                                                        }}
                                                                    >
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis 
                                                                            dataKey="name" 
                                                                            angle={-45}
                                                                            textAnchor="end"
                                                                            height={100}
                                                                            tick={{ fontSize: 12 }}
                                                                        />
                                                                        <YAxis 
                                                                            label={{ value: 'Votes', angle: -90, position: 'insideLeft' }}
                                                                            tick={{ fontSize: 12 }}
                                                                        />
                                                                        <Tooltip 
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
                                                                                    <p className="text-xs text-gray-500">#{index + 1}</p>
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
                        ))}
                    </div>
                )}
            </div>
        </VoterLayoutWrapper>
    );
}
