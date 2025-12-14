"use client";
import { useState, useEffect } from "react";
import { Modal } from "../../_components/Modal";
import { SweetAlert } from "../../_components/SweetAlert";
import { EllipsisMenu } from "../../_components/EllipsisMenu";
import { CountdownTimer } from "../../_components/CountdownTimer";

interface Department {
    id: number;
    name: string;
}

interface CreatedBy {
    id: number;
    firstName: string;
    lastName: string;
}

interface Election {
    id: number;
    name: string;
    category: string;
    status: string;
    startAt: Date | string | null;
    endAt: Date | string | null;
    departmentId: number | null;
    department: Department | null;
    createdBy: CreatedBy;
    createdAt: Date | string;
    _count: {
        positions: number;
        votes: number;
    };
}

interface PositionWithVotes {
    id: number;
    name: string;
    maxChoices: number;
    totalVotes: number;
    candidatesCount: number;
    candidates: Array<{
        id: number;
        displayName: string;
        photoUrl: string | null;
        voteCount: number;
    }>;
}

interface ElectionsClientProps {
    initialElections: Election[];
    departments: Department[];
}

export function ElectionsClient({ initialElections, departments }: ElectionsClientProps) {
    const [elections, setElections] = useState<Election[]>(initialElections);
    const [loading, setLoading] = useState(false);
    const [selectedElection, setSelectedElection] = useState<Election | null>(null);
    const [runningElectionsPositions, setRunningElectionsPositions] = useState<Record<number, PositionWithVotes[]>>({});
    const [loadingPositions, setLoadingPositions] = useState<Record<number, boolean>>({});
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Modal states
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        name: "",
        category: "SRC",
        departmentId: "",
        status: "DRAFT",
        startAt: "",
        endAt: "",
    });
    
    const [formErrors, setFormErrors] = useState<{
        name?: boolean;
        category?: boolean;
        departmentId?: boolean;
        startAt?: boolean;
        endAt?: boolean;
    }>({});
    
    // Alert states
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

    const fetchElections = async () => {
        try {
            const res = await fetch("/api/elections");
            const data = await res.json();
            if (res.ok) {
                setElections(data.elections);
                // Fetch positions for running elections
                const runningElections = data.elections.filter((e: Election) => e.status === "RUNNING");
                runningElections.forEach((election: Election) => {
                    fetchElectionPositions(election.id);
                });
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
        }
    };

    const fetchElectionPositions = async (electionId: number) => {
        setLoadingPositions((prev) => ({ ...prev, [electionId]: true }));
        try {
            const res = await fetch(`/api/elections/${electionId}/positions`);
            const data = await res.json();
            if (res.ok) {
                setRunningElectionsPositions((prev) => ({
                    ...prev,
                    [electionId]: data.positions,
                }));
            }
        } catch (error) {
            console.error(`Failed to fetch positions for election ${electionId}:`, error);
        } finally {
            setLoadingPositions((prev) => ({ ...prev, [electionId]: false }));
        }
    };

    useEffect(() => {
        // Fetch positions for initial running elections
        const runningElections = initialElections.filter((e) => e.status === "RUNNING");
        runningElections.forEach((election) => {
            fetchElectionPositions(election.id);
        });
    }, []);

    // Monitor running elections and auto-update status when time expires
    useEffect(() => {
        const checkAndUpdateStatus = async () => {
            const now = new Date();
            const electionsToUpdate: Election[] = [];

            // Get current elections state
            const currentElections = await fetch("/api/elections").then(res => res.json()).then(data => data.elections || []).catch(() => []);

            currentElections.forEach((election: Election) => {
                if (election.status === "RUNNING" && election.endAt) {
                    const endDate = new Date(election.endAt);
                    if (now > endDate) {
                        electionsToUpdate.push(election);
                    }
                }
            });

            // Update status for expired elections
            for (const election of electionsToUpdate) {
                try {
                    const res = await fetch(`/api/elections/${election.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: election.name,
                            category: election.category,
                            departmentId: election.departmentId,
                            status: "ENDED",
                            startAt: election.startAt,
                            endAt: election.endAt,
                        }),
                    });

                    if (res.ok) {
                        // Refresh elections list
                        await fetchElections();
                    }
                } catch (error) {
                    console.error(`Failed to update election ${election.id} status:`, error);
                }
            }
        };

        // Check every 10 seconds
        const interval = setInterval(checkAndUpdateStatus, 10000);
        checkAndUpdateStatus(); // Initial check

        return () => clearInterval(interval);
    }, []); // Empty dependency array - runs once on mount

    // Pagination calculations
    const totalPages = Math.ceil(elections.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentElections = elections.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleView = (election: Election) => {
        setSelectedElection(election);
        setShowViewModal(true);
    };

    const handleEdit = (election: Election) => {
        setSelectedElection(election);
        setFormData({
            name: election.name,
            category: election.category,
            departmentId: election.departmentId?.toString() || "",
            status: election.status,
            startAt: election.startAt ? new Date(election.startAt).toISOString().slice(0, 16) : "",
            endAt: election.endAt ? new Date(election.endAt).toISOString().slice(0, 16) : "",
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleDelete = (election: Election) => {
        setSelectedElection(election);
        setShowDeleteModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedElection) return;

        // Validate required fields
        const errors: typeof formErrors = {};
        if (!formData.name.trim()) errors.name = true;
        if (!formData.category) errors.category = true;
        if (formData.category === "DEPARTMENT" && !formData.departmentId) errors.departmentId = true;
        if (formData.startAt && formData.endAt) {
            const start = new Date(formData.startAt);
            const end = new Date(formData.endAt);
            if (end <= start) errors.endAt = true;
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setAlert({
                show: true,
                type: "error",
                title: "Validation Error",
                message: "Please fill in all required fields correctly.",
            });
            return;
        }

        setLoading(true);
        setFormErrors({});
        
        try {
            const res = await fetch(`/api/elections/${selectedElection.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    category: formData.category,
                    departmentId: formData.category === "DEPARTMENT" ? formData.departmentId : null,
                    status: formData.status,
                    startAt: formData.startAt || null,
                    endAt: formData.endAt || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setFormData({
                    name: "",
                    category: "SRC",
                    departmentId: "",
                    status: "DRAFT",
                    startAt: "",
                    endAt: "",
                });
                setFormErrors({});
                setAlert({
                    show: true,
                    type: "success",
                    title: "Election Updated",
                    message: "The election has been updated successfully.",
                });
                await fetchElections();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Update Failed",
                    message: data.error || "Failed to update election.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Update Failed",
                message: "An error occurred while updating the election.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedElection) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/elections/${selectedElection.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                setShowDeleteModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Election Deleted",
                    message: "The election has been deleted successfully.",
                });
                await fetchElections();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Delete Failed",
                    message: data.error || "Failed to delete election.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Delete Failed",
                message: "An error occurred while deleting the election.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        const errors: typeof formErrors = {};
        if (!formData.name.trim()) errors.name = true;
        if (!formData.category) errors.category = true;
        if (formData.category === "DEPARTMENT" && !formData.departmentId) errors.departmentId = true;
        if (formData.startAt && formData.endAt) {
            const start = new Date(formData.startAt);
            const end = new Date(formData.endAt);
            if (end <= start) errors.endAt = true;
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setAlert({
                show: true,
                type: "error",
                title: "Validation Error",
                message: "Please fill in all required fields correctly.",
            });
            return;
        }

        setLoading(true);
        setFormErrors({});
        
        try {
            const res = await fetch("/api/elections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    category: formData.category,
                    departmentId: formData.category === "DEPARTMENT" ? formData.departmentId : null,
                    status: formData.status,
                    startAt: formData.startAt || null,
                    endAt: formData.endAt || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowAddModal(false);
                setFormData({
                    name: "",
                    category: "SRC",
                    departmentId: "",
                    status: "DRAFT",
                    startAt: "",
                    endAt: "",
                });
                setFormErrors({});
                setAlert({
                    show: true,
                    type: "success",
                    title: "Election Created",
                    message: "The election has been created successfully.",
                });
                await fetchElections();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Create Failed",
                    message: data.error || "Failed to create election.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Create Failed",
                message: "An error occurred while creating the election.",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            DRAFT: "bg-gray-100 text-gray-800",
            RUNNING: "bg-green-100 text-green-800",
            ENDED: "bg-blue-100 text-blue-800",
        };
        return styles[status as keyof typeof styles] || styles.DRAFT;
    };

    const getCategoryBadge = (category: string) => {
        return category === "SRC" 
            ? "bg-purple-100 text-purple-800"
            : "bg-orange-100 text-orange-800";
    };

    const runningElections = elections.filter((e) => e.status === "RUNNING");

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Elections</h1>
                        <p className="text-gray-600 mt-1">Create, configure, and manage elections.</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({
                                name: "",
                                category: "SRC",
                                departmentId: "",
                                status: "DRAFT",
                                startAt: "",
                                endAt: "",
                            });
                            setFormErrors({});
                            setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        ➕ Add Election
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <strong className="text-blue-900">Total Elections:</strong>{" "}
                            <span className="text-blue-700">{elections.length}</span>
                        </div>
                        <div>
                            <strong className="text-blue-900">Draft:</strong>{" "}
                            <span className="text-blue-700">
                                {elections.filter((e) => e.status === "DRAFT").length}
                            </span>
                        </div>
                        <div>
                            <strong className="text-blue-900">Running:</strong>{" "}
                            <span className="text-blue-700">
                                {elections.filter((e) => e.status === "RUNNING").length}
                            </span>
                        </div>
                        <div>
                            <strong className="text-blue-900">Ended:</strong>{" "}
                            <span className="text-blue-700">
                                {elections.filter((e) => e.status === "ENDED").length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Running Elections Cards */}
                {runningElections.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900">Running Elections</h2>
                        <div className="grid grid-cols-1 gap-6">
                            {runningElections.map((election) => {
                                const positions = runningElectionsPositions[election.id] || [];
                                const isLoading = loadingPositions[election.id];
                                
                                // Check if election has ended
                                const now = new Date();
                                const endDate = election.endAt ? new Date(election.endAt) : null;
                                const hasEnded = endDate && now > endDate;
                                const isEnded = election.status === "ENDED" || hasEnded;

                                return (
                                    <div key={election.id} className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                                        <div className={`px-8 py-6 ${isEnded ? 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h2 className="text-2xl font-bold text-white mb-2">
                                                        {election.name}
                                                    </h2>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                                election.category === "SRC"
                                                                    ? "bg-purple-200 text-purple-900"
                                                                    : "bg-orange-200 text-orange-900"
                                                            }`}
                                                        >
                                                            {election.category}
                                                        </span>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium font-semibold ${
                                                            isEnded 
                                                                ? "bg-white text-gray-800" 
                                                                : "bg-white text-indigo-800"
                                                        }`}>
                                                            {isEnded ? "ENDED" : "RUNNING"}
                                                        </span>
                                                        {election.startAt && election.endAt && (
                                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
                                                                <CountdownTimer
                                                                    startAt={election.startAt}
                                                                    endAt={election.endAt}
                                                                    status={isEnded ? "ENDED" : election.status}
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
                                            {isEnded ? (
                                                <div className="text-center py-12">
                                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Election has ended</h3>
                                                    <p className="text-gray-600">
                                                        This election has concluded. Results are now final.
                                                    </p>
                                                </div>
                                            ) : isLoading ? (
                                                <div className="text-center py-8">
                                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    <p className="mt-2 text-sm text-gray-500">Loading positions...</p>
                                                </div>
                                            ) : positions.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-500">No positions available for this election.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {positions.map((position) => (
                                                        <div key={position.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h3 className="text-lg font-semibold text-gray-900">
                                                                    {position.name}
                                                                </h3>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-sm text-gray-600">
                                                                        Total Votes: <span className="font-semibold text-gray-900">{position.totalVotes}</span>
                                                                    </span>
                                                                    <span className="text-sm text-gray-600">
                                                                        Candidates: <span className="font-semibold text-gray-900">{position.candidatesCount}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            {position.candidates.length === 0 ? (
                                                                <p className="text-sm text-gray-500">No candidates for this position.</p>
                                                            ) : (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                                                    {position.candidates.map((candidate) => (
                                                                        <div key={candidate.id} className="bg-white rounded-lg p-4 border border-gray-200">
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
                                                                                    <p className="font-medium text-gray-900">{candidate.displayName}</p>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        Votes: <span className="font-semibold text-green-600">{candidate.voteCount}</span>
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Elections Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">All Elections</h2>
                    </div>
                    <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Election Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Schedule
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Positions
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Votes
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {elections.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                            No elections created yet. Add your first election to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    currentElections.map((election) => (
                                        <tr key={election.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                <div className="text-base font-medium text-gray-900">
                                                    {election.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Created: {new Date(election.createdAt || Date.now()).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(
                                                        election.category
                                                    )}`}
                                                >
                                                    {election.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base text-gray-900">
                                                {election.department?.name || "University-wide (SRC)"}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                {(() => {
                                                    // Check if election has ended based on time
                                                    const now = new Date();
                                                    const endDate = election.endAt ? new Date(election.endAt) : null;
                                                    const hasEnded = endDate && now > endDate;
                                                    const displayStatus = (election.status === "RUNNING" && hasEnded) ? "ENDED" : election.status;
                                                    
                                                    return (
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                                                displayStatus
                                                            )}`}
                                                        >
                                                            {displayStatus}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                {election.startAt && election.endAt ? (
                                                    <div className="space-y-1">
                                                        <div className="text-xs text-gray-500">
                                                            Start: {new Date(election.startAt).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            End: {new Date(election.endAt).toLocaleString()}
                                                        </div>
                                                        <CountdownTimer
                                                            startAt={election.startAt}
                                                            endAt={election.endAt}
                                                            status={election.status}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Not scheduled</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base font-medium text-gray-900">
                                                {election._count.positions}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base font-medium text-gray-900">
                                                {election._count.votes}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end">
                                                    <EllipsisMenu
                                                        items={[
                                                            {
                                                                label: "View",
                                                                onClick: () => handleView(election),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Edit",
                                                                onClick: () => handleEdit(election),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Delete",
                                                                onClick: () => handleDelete(election),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                ),
                                                                variant: "danger",
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {elections.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                                        <span className="font-medium">
                                            {Math.min(endIndex, elections.length)}
                                        </span>{" "}
                                        of <span className="font-medium">{elections.length}</span> elections
                                    </span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="ml-4 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={5}>5 per page</option>
                                        <option value={10}>10 per page</option>
                                        <option value={20}>20 per page</option>
                                        <option value={50}>50 per page</option>
                                    </select>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((page) => {
                                                if (totalPages <= 7) return true;
                                                if (page === 1 || page === totalPages) return true;
                                                if (Math.abs(page - currentPage) <= 1) return true;
                                                return false;
                                            })
                                            .map((page, index, array) => {
                                                const prevPage = array[index - 1];
                                                const showEllipsis = prevPage && page - prevPage > 1;
                                                
                                                return (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {showEllipsis && (
                                                            <span className="px-2 text-gray-500">...</span>
                                                        )}
                                                        <button
                                                            onClick={() => handlePageChange(page)}
                                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                                currentPage === page
                                                                    ? "bg-blue-600 text-white"
                                                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Election Details"
                size="lg"
            >
                {selectedElection && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Election Name</label>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{selectedElection.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(selectedElection.category)}`}>
                                        {selectedElection.category}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedElection.status)}`}>
                                        {selectedElection.status}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedElection.department?.name || "University-wide (SRC)"}
                            </p>
                        </div>
                        {selectedElection.startAt && selectedElection.endAt && (
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedElection.startAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedElection.endAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Time Remaining</label>
                                    <div className="mt-1">
                                        <CountdownTimer
                                            startAt={selectedElection.startAt}
                                            endAt={selectedElection.endAt}
                                            status={selectedElection.status}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Positions</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {selectedElection._count.positions} position{selectedElection._count.positions !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Votes</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {selectedElection._count.votes} vote{selectedElection._count.votes !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Created By</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedElection.createdBy.firstName} {selectedElection.createdBy.lastName}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setFormData({
                        name: "",
                        category: "SRC",
                        departmentId: "",
                        status: "DRAFT",
                        startAt: "",
                        endAt: "",
                    });
                    setFormErrors({});
                }}
                title="Edit Election"
                size="xl"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Election Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (formErrors.name) {
                                    setFormErrors({ ...formErrors, name: false });
                                }
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                formErrors.name ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="e.g., SRC General Elections 2025"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => {
                                    setFormData({ 
                                        ...formData, 
                                        category: e.target.value,
                                        departmentId: e.target.value === "SRC" ? "" : formData.departmentId,
                                    });
                                    if (formErrors.category) {
                                        setFormErrors({ ...formErrors, category: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.category ? "border-red-500" : "border-gray-300"
                                }`}
                                required
                            >
                                <option value="SRC">SRC (University-wide)</option>
                                <option value="DEPARTMENT">Department</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status *
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                required
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="RUNNING">RUNNING</option>
                                <option value="ENDED">ENDED</option>
                            </select>
                        </div>
                    </div>
                    {formData.category === "DEPARTMENT" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department *
                            </label>
                            <select
                                value={formData.departmentId}
                                onChange={(e) => {
                                    setFormData({ ...formData, departmentId: e.target.value });
                                    if (formErrors.departmentId) {
                                        setFormErrors({ ...formErrors, departmentId: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.departmentId ? "border-red-500" : "border-gray-300"
                                }`}
                                required={formData.category === "DEPARTMENT"}
                            >
                                <option value="">Select a department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.startAt}
                                onChange={(e) => {
                                    setFormData({ ...formData, startAt: e.target.value });
                                    if (formErrors.startAt) {
                                        setFormErrors({ ...formErrors, startAt: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.startAt ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.endAt}
                                onChange={(e) => {
                                    setFormData({ ...formData, endAt: e.target.value });
                                    if (formErrors.endAt) {
                                        setFormErrors({ ...formErrors, endAt: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.endAt ? "border-red-500" : "border-gray-300"
                                }`}
                                min={formData.startAt || undefined}
                            />
                            {formErrors.endAt && (
                                <p className="mt-1 text-xs text-red-500">End date must be after start date</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setFormData({
                                    name: "",
                                    category: "SRC",
                                    departmentId: "",
                                    status: "DRAFT",
                                    startAt: "",
                                    endAt: "",
                                });
                                setFormErrors({});
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? "Updating..." : "Update Election"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Election"
                size="sm"
            >
                {selectedElection && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{selectedElection.name}</strong>?
                        </p>
                        {selectedElection._count.positions > 0 || selectedElection._count.votes > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    This election has {selectedElection._count.positions} position
                                    {selectedElection._count.positions !== 1 ? "s" : ""} and {selectedElection._count.votes} vote
                                    {selectedElection._count.votes !== 1 ? "s" : ""}. You cannot delete
                                    it until all positions and votes are removed.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                This action cannot be undone.
                            </p>
                        )}
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={loading || selectedElection._count.positions > 0 || selectedElection._count.votes > 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Deleting..." : "Delete Election"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setFormData({
                        name: "",
                        category: "SRC",
                        departmentId: "",
                        status: "DRAFT",
                        startAt: "",
                        endAt: "",
                    });
                    setFormErrors({});
                }}
                title="Add New Election"
                size="xl"
            >
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Election Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (formErrors.name) {
                                    setFormErrors({ ...formErrors, name: false });
                                }
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                formErrors.name ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="e.g., SRC General Elections 2025"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => {
                                    setFormData({ 
                                        ...formData, 
                                        category: e.target.value,
                                        departmentId: e.target.value === "SRC" ? "" : formData.departmentId,
                                    });
                                    if (formErrors.category) {
                                        setFormErrors({ ...formErrors, category: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.category ? "border-red-500" : "border-gray-300"
                                }`}
                                required
                            >
                                <option value="SRC">SRC (University-wide)</option>
                                <option value="DEPARTMENT">Department</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status *
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                required
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="RUNNING">RUNNING</option>
                                <option value="ENDED">ENDED</option>
                            </select>
                        </div>
                    </div>
                    {formData.category === "DEPARTMENT" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department *
                            </label>
                            <select
                                value={formData.departmentId}
                                onChange={(e) => {
                                    setFormData({ ...formData, departmentId: e.target.value });
                                    if (formErrors.departmentId) {
                                        setFormErrors({ ...formErrors, departmentId: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.departmentId ? "border-red-500" : "border-gray-300"
                                }`}
                                required={formData.category === "DEPARTMENT"}
                            >
                                <option value="">Select a department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.startAt}
                                onChange={(e) => {
                                    setFormData({ ...formData, startAt: e.target.value });
                                    if (formErrors.startAt) {
                                        setFormErrors({ ...formErrors, startAt: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.startAt ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.endAt}
                                onChange={(e) => {
                                    setFormData({ ...formData, endAt: e.target.value });
                                    if (formErrors.endAt) {
                                        setFormErrors({ ...formErrors, endAt: false });
                                    }
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                    formErrors.endAt ? "border-red-500" : "border-gray-300"
                                }`}
                                min={formData.startAt || undefined}
                            />
                            {formErrors.endAt && (
                                <p className="mt-1 text-xs text-red-500">End date must be after start date</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddModal(false);
                                setFormData({
                                    name: "",
                                    category: "SRC",
                                    departmentId: "",
                                    status: "DRAFT",
                                    startAt: "",
                                    endAt: "",
                                });
                                setFormErrors({});
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? "Creating..." : "Create Election"}
                        </button>
                    </div>
                </form>
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
