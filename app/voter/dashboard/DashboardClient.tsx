"use client";
import { useState, useEffect } from "react";
import { SweetAlert } from "../../admin/_components/SweetAlert";
import { Modal } from "../../admin/_components/Modal";
import { CountdownTimer } from "../../admin/_components/CountdownTimer";

interface Department {
    id: number;
    name: string;
}

interface Candidate {
    id: number;
    displayName: string;
    photoUrl: string | null;
    manifesto: string | null;
}

interface Position {
    id: number;
    name: string;
    maxChoices: number;
    candidates: Candidate[];
    hasVoted: boolean;
    _count: {
        candidates: number;
    };
}

interface Election {
    id: number;
    name: string;
    category: string;
    status: string;
    startAt: Date | string | null;
    endAt: Date | string | null;
    department: Department | null;
    positions: Position[];
    hasVoted: boolean;
    hasAnyVotes: boolean;
    _count: {
        positions: number;
    };
}

interface Voter {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    studentId: string | null;
    department: { name: string } | null;
}

export function DashboardClient() {
    const [voter, setVoter] = useState<Voter | null>(null);
    const [elections, setElections] = useState<Election[]>([]);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState<Record<string, boolean>>({});
    const [selectedElection, setSelectedElection] = useState<Election | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [showVoteModal, setShowVoteModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [alert, setAlert] = useState<{
        show: boolean;
        type: "success" | "error" | "warning" | "info";
        title: string;
        message?: string;
    }>({
        show: false,
        type: "success",
        title: "",
    });

    useEffect(() => {
        const voterData = localStorage.getItem("voter");
        if (voterData) {
            try {
                const parsed = JSON.parse(voterData);
                setVoter(parsed);
                fetchElections(parsed.id);
            } catch (err) {
                console.error("Failed to parse voter data:", err);
            }
        }
    }, []);

    const fetchElections = async (voterId: number) => {
        setLoading(true);
        try {
            const res = await fetch("/api/voters/elections", {
                headers: {
                    "x-voter-id": voterId.toString(),
                },
            });
            const data = await res.json();
            if (res.ok) {
                setElections(data.elections);
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Error",
                    message: data.error || "Failed to load elections",
                });
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setAlert({
                show: true,
                type: "error",
                title: "Error",
                message: "Failed to load elections. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVoteClick = (election: Election, position: Position) => {
        if (position.hasVoted) {
            setAlert({
                show: true,
                type: "warning",
                title: "Already Voted",
                message: "You have already voted for this position.",
            });
            return;
        }

        if (position.candidates.length === 0) {
            setAlert({
                show: true,
                type: "warning",
                title: "No Candidates",
                message: "There are no candidates for this position.",
            });
            return;
        }

        setSelectedElection(election);
        setSelectedPosition(position);
        setSelectedCandidate(position.candidates[0]?.id || null);
        setShowVoteModal(true);
    };

    const handleVoteSubmit = async () => {
        if (!selectedElection || !selectedPosition || !selectedCandidate || !voter) {
            return;
        }

        setVoting({ ...voting, [`${selectedElection.id}-${selectedPosition.id}`]: true });

        try {
            const res = await fetch("/api/voters/vote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-voter-id": voter.id.toString(),
                },
                body: JSON.stringify({
                    electionId: selectedElection.id,
                    positionId: selectedPosition.id,
                    candidateId: selectedCandidate,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowVoteModal(false);
                setShowConfirmModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Vote Submitted",
                    message: "Your vote has been recorded successfully.",
                });
                // Refresh elections to update vote status
                await fetchElections(voter.id);
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Vote Failed",
                    message: data.error || "Failed to submit vote. Please try again.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Vote Failed",
                message: "An error occurred while submitting your vote.",
            });
        } finally {
            setVoting({ ...voting, [`${selectedElection.id}-${selectedPosition.id}`]: false });
        }
    };

    const getCategoryBadge = (category: string) => {
        return category === "SRC" 
            ? "bg-purple-100 text-purple-800"
            : "bg-orange-100 text-orange-800";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading elections...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Voter Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Welcome, {voter?.firstName} {voter?.lastName}
                    </p>
                </div>

                {elections.length === 0 ? (
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
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Elections</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            There are no elections available for voting at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {elections.map((election) => (
                            <div key={election.id} className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-2">
                                                {election.name}
                                            </h2>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white`}>
                                                    {election.category}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                                                    {election.department?.name || "Department Election"}
                                                </span>
                                                {election.startAt && election.endAt && (
                                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
                                                        <CountdownTimer
                                                            startAt={election.startAt}
                                                            endAt={election.endAt}
                                                            status={election.status}
                                                            size="sm"
                                                            textColor="text-white"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 py-6">
                                    {election.positions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No positions available for this election.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {election.positions.map((position) => (
                                                <div key={position.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {position.name}
                                                        </h3>
                                                        {position.hasVoted ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                ✓ Voted
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                Not Voted
                                                            </span>
                                                        )}
                                                    </div>

                                                    {position.candidates.length === 0 ? (
                                                        <p className="text-sm text-gray-500">No candidates for this position.</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {position.candidates.map((candidate) => (
                                                                    <div
                                                                        key={candidate.id}
                                                                        className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            {candidate.photoUrl ? (
                                                                                <img
                                                                                    src={candidate.photoUrl}
                                                                                    alt={candidate.displayName}
                                                                                    className="w-16 h-16 rounded-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                                                                    <span className="text-gray-400 text-xs">No Photo</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1">
                                                                                <p className="font-semibold text-gray-900">{candidate.displayName}</p>
                                                                                {candidate.manifesto && (
                                                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                                        {candidate.manifesto}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {!position.hasVoted && (
                                                                <div className="flex justify-end pt-2">
                                                                    <button
                                                                        onClick={() => handleVoteClick(election, position)}
                                                                        disabled={voting[`${election.id}-${position.id}`]}
                                                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    >
                                                                        {voting[`${election.id}-${position.id}`] ? "Submitting..." : "Vote"}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Vote Modal */}
            <Modal
                isOpen={showVoteModal}
                onClose={() => {
                    setShowVoteModal(false);
                    setSelectedCandidate(null);
                }}
                title={`Vote for ${selectedPosition?.name}`}
                size="lg"
            >
                {selectedPosition && selectedElection && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Select a candidate for <strong>{selectedPosition.name}</strong> in <strong>{selectedElection.name}</strong>
                        </p>
                        
                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                            {selectedPosition.candidates.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedCandidate === candidate.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    onClick={() => setSelectedCandidate(candidate.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        {candidate.photoUrl ? (
                                            <img
                                                src={candidate.photoUrl}
                                                alt={candidate.displayName}
                                                className="w-20 h-20 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">No Photo</span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 text-lg">{candidate.displayName}</p>
                                            {candidate.manifesto && (
                                                <p className="text-sm text-gray-600 mt-1">{candidate.manifesto}</p>
                                            )}
                                        </div>
                                        {selectedCandidate === candidate.id && (
                                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowVoteModal(false);
                                    setSelectedCandidate(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedCandidate) {
                                        setShowConfirmModal(true);
                                    } else {
                                        setAlert({
                                            show: true,
                                            type: "warning",
                                            title: "Select Candidate",
                                            message: "Please select a candidate before submitting your vote.",
                                        });
                                    }
                                }}
                                disabled={!selectedCandidate}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Vote Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Confirm Your Vote"
                size="sm"
            >
                {selectedPosition && selectedElection && selectedCandidate && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to vote for <strong>
                                {selectedPosition.candidates.find(c => c.id === selectedCandidate)?.displayName}
                            </strong> for the position of <strong>{selectedPosition.name}</strong>?
                        </p>
                        <p className="text-xs text-red-600 font-medium">
                            ⚠️ This action cannot be undone. You can only vote once per position.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleVoteSubmit}
                                disabled={voting[`${selectedElection.id}-${selectedPosition.id}`]}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60"
                            >
                                {voting[`${selectedElection.id}-${selectedPosition.id}`] ? "Submitting..." : "Confirm Vote"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Sweet Alert */}
            <SweetAlert
                show={alert.show}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert({ ...alert, show: false })}
            />
        </>
    );
}

