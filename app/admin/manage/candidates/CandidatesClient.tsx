"use client";
import { useState, useEffect } from "react";
import { Modal } from "../../_components/Modal";
import { SweetAlert } from "../../_components/SweetAlert";
import { EllipsisMenu } from "../../_components/EllipsisMenu";

interface Election {
    id: number;
    name: string;
    category: string;
}

interface Position {
    id: number;
    name: string;
    electionId: number;
    election: Election;
}

interface User {
    id: number;
    firstName: string;
    lastName: string;
    studentId: string;
    email: string;
}

interface Candidate {
    id: number;
    displayName: string;
    manifesto: string | null;
    photoUrl: string | null;
    positionId: number;
    userId: number | null;
    position: Position;
    user: User | null;
    _count: {
        votes: number;
    };
}

interface CandidatesClientProps {
    initialCandidates: Candidate[];
    positions: Position[];
    elections: Election[];
}

export function CandidatesClient({ 
    initialCandidates, 
    positions, 
    elections
}: CandidatesClientProps) {
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
    const [loading, setLoading] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    
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
        displayName: "",
        positionId: "",
        manifesto: "",
        photoUrl: "",
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{
        displayName?: boolean;
        positionId?: boolean;
        selectedElectionId?: boolean;
    }>({});
    
    // Filtered positions based on selected election
    const [selectedElectionId, setSelectedElectionId] = useState<string>("");
    const filteredPositions = selectedElectionId
        ? positions.filter(p => p.electionId === parseInt(selectedElectionId))
        : [];
    
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

    const fetchCandidates = async () => {
        try {
            const res = await fetch("/api/candidates");
            const data = await res.json();
            if (res.ok) {
                setCandidates(data.candidates);
                // Reset to first page if current page is out of bounds
                const totalPages = Math.ceil(data.candidates.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(1);
                }
            }
        } catch (error) {
            console.error("Failed to fetch candidates:", error);
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(candidates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCandidates = candidates.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            // Scroll to top of table
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleView = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setShowViewModal(true);
    };

    const handleEdit = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setFormData({
            displayName: candidate.displayName,
            positionId: candidate.positionId.toString(),
            manifesto: candidate.manifesto || "",
            photoUrl: candidate.photoUrl || "",
        });
        setSelectedElectionId(candidate.position.electionId.toString());
        setPhotoFile(null);
        setPhotoPreview(candidate.photoUrl || null);
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleDelete = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setShowDeleteModal(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Invalid File",
                    message: "Please select an image file.",
                });
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setAlert({
                    show: true,
                    type: "error",
                    title: "File Too Large",
                    message: "Image size should be less than 5MB.",
                });
                return;
            }
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCandidate) return;

        // Validate required fields
        const errors: typeof formErrors = {};
        if (!formData.displayName.trim()) errors.displayName = true;
        if (!selectedElectionId) errors.selectedElectionId = true;
        if (!formData.positionId) errors.positionId = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setAlert({
                show: true,
                type: "error",
                title: "Validation Error",
                message: "Please fill in all required fields.",
            });
            return;
        }

        setLoading(true);
        setFormErrors({});
        
        try {
            // Convert photo to base64 if file is selected
            let photoUrl = formData.photoUrl.trim() || null;
            if (photoFile) {
                const reader = new FileReader();
                photoUrl = await new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(photoFile);
                });
            }

            const res = await fetch(`/api/candidates/${selectedCandidate.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: formData.displayName.trim(),
                    positionId: formData.positionId,
                    userId: null,
                    manifesto: formData.manifesto.trim() || null,
                    photoUrl: photoUrl,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setPhotoFile(null);
                setPhotoPreview(null);
                setFormData({
                    displayName: "",
                    positionId: "",
                    manifesto: "",
                    photoUrl: "",
                });
                setSelectedElectionId("");
                setFormErrors({});
                setAlert({
                    show: true,
                    type: "success",
                    title: "Candidate Updated",
                    message: "The candidate has been updated successfully.",
                });
                await fetchCandidates();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Update Failed",
                    message: data.error || "Failed to update candidate.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Update Failed",
                message: "An error occurred while updating the candidate.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCandidate) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/candidates/${selectedCandidate.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                setShowDeleteModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Candidate Deleted",
                    message: "The candidate has been deleted successfully.",
                });
                await fetchCandidates();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Delete Failed",
                    message: data.error || "Failed to delete candidate.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Delete Failed",
                message: "An error occurred while deleting the candidate.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        const errors: typeof formErrors = {};
        if (!formData.displayName.trim()) errors.displayName = true;
        if (!selectedElectionId) errors.selectedElectionId = true;
        if (!formData.positionId) errors.positionId = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setAlert({
                show: true,
                type: "error",
                title: "Validation Error",
                message: "Please fill in all required fields.",
            });
            return;
        }

        setLoading(true);
        setFormErrors({});
        
        try {
            // Convert photo to base64 if file is selected
            let photoUrl = formData.photoUrl.trim() || null;
            if (photoFile) {
                const reader = new FileReader();
                photoUrl = await new Promise<string>((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(photoFile);
                });
            }

            const res = await fetch("/api/candidates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: formData.displayName.trim(),
                    positionId: formData.positionId,
                    userId: null,
                    manifesto: formData.manifesto.trim() || null,
                    photoUrl: photoUrl,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowAddModal(false);
                setFormData({
                    displayName: "",
                    positionId: "",
                    manifesto: "",
                    photoUrl: "",
                });
                setSelectedElectionId("");
                setPhotoFile(null);
                setPhotoPreview(null);
                setFormErrors({});
                setAlert({
                    show: true,
                    type: "success",
                    title: "Candidate Created",
                    message: "The candidate has been created successfully.",
                });
                await fetchCandidates();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Create Failed",
                    message: data.error || "Failed to create candidate.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Create Failed",
                message: "An error occurred while creating the candidate.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Candidates</h1>
                        <p className="text-gray-600 mt-1">View and manage election candidates.</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({
                                displayName: "",
                                positionId: "",
                                manifesto: "",
                                photoUrl: "",
                            });
                            setSelectedElectionId("");
                            setPhotoFile(null);
                            setPhotoPreview(null);
                            setFormErrors({});
                            setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        ➕ Add Candidate
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Total Candidates:</strong> {candidates.length}
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Photo
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Candidate Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Election
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
                                {candidates.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No candidates registered yet. Add your first candidate to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    currentCandidates.map((candidate) => (
                                        <tr key={candidate.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                {candidate.photoUrl ? (
                                                    <img
                                                        src={candidate.photoUrl}
                                                        alt={candidate.displayName}
                                                        className="w-20 h-20 object-cover rounded border border-gray-300"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                <div className="text-base font-medium text-gray-900">
                                                    {candidate.displayName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base text-gray-900">
                                                {candidate.position.name}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                <div className="text-base text-gray-900">
                                                    {candidate.position.election.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {candidate.position.election.category}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base font-medium text-gray-900">
                                                {candidate._count.votes}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end">
                                                    <EllipsisMenu
                                                        items={[
                                                            {
                                                                label: "View",
                                                                onClick: () => handleView(candidate),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Edit",
                                                                onClick: () => handleEdit(candidate),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Delete",
                                                                onClick: () => handleDelete(candidate),
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
                    {candidates.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                                        <span className="font-medium">
                                            {Math.min(endIndex, candidates.length)}
                                        </span>{" "}
                                        of <span className="font-medium">{candidates.length}</span> candidates
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
                                                // Show first page, last page, current page, and pages around current
                                                if (totalPages <= 7) return true;
                                                if (page === 1 || page === totalPages) return true;
                                                if (Math.abs(page - currentPage) <= 1) return true;
                                                return false;
                                            })
                                            .map((page, index, array) => {
                                                // Add ellipsis if there's a gap
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
                title="Candidate Details"
                size="lg"
            >
                {selectedCandidate && (
                    <div className="space-y-6">
                        {/* Photo and Basic Info */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                {selectedCandidate.photoUrl ? (
                                    <img
                                        src={selectedCandidate.photoUrl}
                                        alt={selectedCandidate.displayName}
                                        className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                                        <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">{selectedCandidate.displayName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Position</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedCandidate.position.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Election</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedCandidate.position.election.name} ({selectedCandidate.position.election.category})
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Votes</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedCandidate._count.votes} vote{selectedCandidate._count.votes !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {selectedCandidate.manifesto && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Manifesto</label>
                                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {selectedCandidate.manifesto}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setFormData({
                        displayName: "",
                        positionId: "",
                        manifesto: "",
                        photoUrl: "",
                    });
                    setSelectedElectionId("");
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setFormErrors({});
                }}
                title="Edit Candidate"
                size="xl"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, displayName: e.target.value });
                                        if (formErrors.displayName) {
                                            setFormErrors({ ...formErrors, displayName: false });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                        formErrors.displayName ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Candidate's display name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Election *
                                </label>
                                <select
                                    value={selectedElectionId}
                                    onChange={(e) => {
                                        setSelectedElectionId(e.target.value);
                                        setFormData({ ...formData, positionId: "" });
                                        if (formErrors.selectedElectionId) {
                                            setFormErrors({ ...formErrors, selectedElectionId: false });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                        formErrors.selectedElectionId ? "border-red-500" : "border-gray-300"
                                    }`}
                                    required
                                >
                                    <option value="">Select an election</option>
                                    {elections.map((election) => (
                                        <option key={election.id} value={election.id}>
                                            {election.name} ({election.category})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Position *
                                </label>
                                <select
                                    value={formData.positionId}
                                    onChange={(e) => {
                                        setFormData({ ...formData, positionId: e.target.value });
                                        if (formErrors.positionId) {
                                            setFormErrors({ ...formErrors, positionId: false });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                        formErrors.positionId ? "border-red-500" : "border-gray-300"
                                    }`}
                                    required
                                    disabled={!selectedElectionId}
                                >
                                    <option value="">Select a position</option>
                                    {filteredPositions.map((position) => (
                                        <option key={position.id} value={position.id}>
                                            {position.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Manifesto (Optional)
                                </label>
                                <textarea
                                    value={formData.manifesto}
                                    onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Candidate's manifesto or platform"
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Right Column - Photo Upload */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Profile Picture
                                </label>
                                <div className="space-y-3">
                                    {photoPreview && (
                                        <div className="relative inline-block">
                                            <img
                                                src={photoPreview}
                                                alt="Candidate preview"
                                                className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhotoFile(null);
                                                    setPhotoPreview(null);
                                                    setFormData({ ...formData, photoUrl: "" });
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                title="Remove photo"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-gray-500">Accepted: JPG, PNG, GIF. Max size: 5MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setFormData({
                                    displayName: "",
                                    positionId: "",
                                    manifesto: "",
                                    photoUrl: "",
                                });
                                setSelectedElectionId("");
                                setPhotoFile(null);
                                setPhotoPreview(null);
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
                            {loading ? "Updating..." : "Update Candidate"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Candidate"
                size="sm"
            >
                {selectedCandidate && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{selectedCandidate.displayName}</strong>?
                        </p>
                        {selectedCandidate._count.votes > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    This candidate has {selectedCandidate._count.votes} vote
                                    {selectedCandidate._count.votes !== 1 ? "s" : ""}. You cannot delete
                                    it until all votes are removed.
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
                                disabled={loading || selectedCandidate._count.votes > 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Deleting..." : "Delete Candidate"}
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
                        displayName: "",
                        positionId: "",
                        manifesto: "",
                        photoUrl: "",
                    });
                    setSelectedElectionId("");
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setFormErrors({});
                }}
                title="Add New Candidate"
                size="xl"
            >
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, displayName: e.target.value });
                                        if (formErrors.displayName) {
                                            setFormErrors({ ...formErrors, displayName: false });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                        formErrors.displayName ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Candidate's display name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Election *
                                </label>
                                <select
                                    value={selectedElectionId}
                                    onChange={(e) => {
                                        setSelectedElectionId(e.target.value);
                                        setFormData({ ...formData, positionId: "" });
                                        if (formErrors.selectedElectionId) {
                                            setFormErrors({ ...formErrors, selectedElectionId: false });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                        formErrors.selectedElectionId ? "border-red-500" : "border-gray-300"
                                    }`}
                                    required
                                >
                                    <option value="">Select an election</option>
                                    {elections.map((election) => (
                                        <option key={election.id} value={election.id}>
                                            {election.name} ({election.category})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Position *
                                </label>
                                <select
                                    value={formData.positionId}
                                    onChange={(e) => {
                                        setFormData({ ...formData, positionId: e.target.value });
                                        if (formErrors.positionId) {
                                            setFormErrors({ ...formErrors, positionId: false });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                        formErrors.positionId ? "border-red-500" : "border-gray-300"
                                    }`}
                                    required
                                    disabled={!selectedElectionId}
                                >
                                    <option value="">Select a position</option>
                                    {filteredPositions.map((position) => (
                                        <option key={position.id} value={position.id}>
                                            {position.name}
                                        </option>
                                    ))}
                                </select>
                                {!selectedElectionId && (
                                    <p className="mt-1 text-xs text-gray-500">Please select an election first</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Manifesto (Optional)
                                </label>
                                <textarea
                                    value={formData.manifesto}
                                    onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Candidate's manifesto or platform"
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Right Column - Photo Upload */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Profile Picture
                                </label>
                                <div className="space-y-3">
                                    {photoPreview && (
                                        <div className="relative inline-block">
                                            <img
                                                src={photoPreview}
                                                alt="Candidate preview"
                                                className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhotoFile(null);
                                                    setPhotoPreview(null);
                                                    setFormData({ ...formData, photoUrl: "" });
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                title="Remove photo"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-gray-500">Accepted: JPG, PNG, GIF. Max size: 5MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddModal(false);
                                setFormData({
                                    displayName: "",
                                    positionId: "",
                                    manifesto: "",
                                    photoUrl: "",
                                });
                                setSelectedElectionId("");
                                setPhotoFile(null);
                                setPhotoPreview(null);
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
                            {loading ? "Creating..." : "Create Candidate"}
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

