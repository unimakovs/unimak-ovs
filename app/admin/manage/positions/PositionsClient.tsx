"use client";
import { useState } from "react";
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
    maxChoices: number;
    electionId: number;
    election: Election;
    _count: {
        candidates: number;
        votes: number;
    };
}

interface PositionsClientProps {
    initialPositions: Position[];
    elections: Election[];
}

export function PositionsClient({ initialPositions, elections }: PositionsClientProps) {
    const [positions, setPositions] = useState<Position[]>(initialPositions);
    const [loading, setLoading] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    
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
        electionId: "",
        maxChoices: "1",
    });
    
    const [formErrors, setFormErrors] = useState<{
        name?: boolean;
        electionId?: boolean;
        maxChoices?: boolean;
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

    const fetchPositions = async () => {
        try {
            const res = await fetch("/api/positions");
            const data = await res.json();
            if (res.ok) {
                setPositions(data.positions);
                // Reset to first page if current page is out of bounds
                const totalPages = Math.ceil(data.positions.length / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    setCurrentPage(1);
                }
            }
        } catch (error) {
            console.error("Failed to fetch positions:", error);
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(positions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPositions = positions.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleView = (position: Position) => {
        setSelectedPosition(position);
        setShowViewModal(true);
    };

    const handleEdit = (position: Position) => {
        setSelectedPosition(position);
        setFormData({
            name: position.name,
            electionId: position.electionId.toString(),
            maxChoices: position.maxChoices.toString(),
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleDelete = (position: Position) => {
        setSelectedPosition(position);
        setShowDeleteModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPosition) return;

        // Validate required fields
        const errors: typeof formErrors = {};
        if (!formData.name.trim()) errors.name = true;
        if (!formData.electionId) errors.electionId = true;
        if (!formData.maxChoices || parseInt(formData.maxChoices) < 1) errors.maxChoices = true;

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
            const res = await fetch(`/api/positions/${selectedPosition.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    electionId: formData.electionId,
                    maxChoices: parseInt(formData.maxChoices),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setFormData({
                    name: "",
                    electionId: "",
                    maxChoices: "1",
                });
                setFormErrors({});
                setAlert({
                    show: true,
                    type: "success",
                    title: "Position Updated",
                    message: "The position has been updated successfully.",
                });
                await fetchPositions();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Update Failed",
                    message: data.error || "Failed to update position.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Update Failed",
                message: "An error occurred while updating the position.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPosition) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/positions/${selectedPosition.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                setShowDeleteModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Position Deleted",
                    message: "The position has been deleted successfully.",
                });
                await fetchPositions();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Delete Failed",
                    message: data.error || "Failed to delete position.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Delete Failed",
                message: "An error occurred while deleting the position.",
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
        if (!formData.electionId) errors.electionId = true;
        if (!formData.maxChoices || parseInt(formData.maxChoices) < 1) errors.maxChoices = true;

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
            const res = await fetch("/api/positions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    electionId: formData.electionId,
                    maxChoices: parseInt(formData.maxChoices),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowAddModal(false);
                setFormData({
                    name: "",
                    electionId: "",
                    maxChoices: "1",
                });
                setFormErrors({});
                setAlert({
                    show: true,
                    type: "success",
                    title: "Position Created",
                    message: "The position has been created successfully.",
                });
                await fetchPositions();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Create Failed",
                    message: data.error || "Failed to create position.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Create Failed",
                message: "An error occurred while creating the position.",
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
                        <h1 className="text-3xl font-bold text-gray-900">Manage Positions</h1>
                        <p className="text-gray-600 mt-1">View and manage election positions.</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({
                                name: "",
                                electionId: "",
                                maxChoices: "1",
                            });
                            setFormErrors({});
                            setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        ➕ Add Position
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Total Positions:</strong> {positions.length}
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Position Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Election
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Max Choices
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        Candidates
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
                                {positions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No positions created yet. Add your first position to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    currentPositions.map((position) => (
                                        <tr key={position.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                <div className="text-base font-medium text-gray-900">
                                                    {position.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap">
                                                <div className="text-base text-gray-900">
                                                    {position.election.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {position.election.category}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base font-medium text-gray-900">
                                                {position.maxChoices}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base font-medium text-gray-900">
                                                {position._count.candidates}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-base font-medium text-gray-900">
                                                {position._count.votes}
                                            </td>
                                            <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end">
                                                    <EllipsisMenu
                                                        items={[
                                                            {
                                                                label: "View",
                                                                onClick: () => handleView(position),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Edit",
                                                                onClick: () => handleEdit(position),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Delete",
                                                                onClick: () => handleDelete(position),
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
                    {positions.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                                        <span className="font-medium">
                                            {Math.min(endIndex, positions.length)}
                                        </span>{" "}
                                        of <span className="font-medium">{positions.length}</span> positions
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
                title="Position Details"
                size="lg"
            >
                {selectedPosition && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Position Name</label>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{selectedPosition.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Election</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedPosition.election.name} ({selectedPosition.election.category})
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Choices</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedPosition.maxChoices} choice{selectedPosition.maxChoices !== 1 ? "s" : ""} per voter
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Candidates</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedPosition._count.candidates} candidate{selectedPosition._count.candidates !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Votes</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedPosition._count.votes} vote{selectedPosition._count.votes !== 1 ? "s" : ""}
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
                        electionId: "",
                        maxChoices: "1",
                    });
                    setFormErrors({});
                }}
                title="Edit Position"
                size="md"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Position Name *
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
                            placeholder="e.g., President, Secretary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Election *
                        </label>
                        <select
                            value={formData.electionId}
                            onChange={(e) => {
                                setFormData({ ...formData, electionId: e.target.value });
                                if (formErrors.electionId) {
                                    setFormErrors({ ...formErrors, electionId: false });
                                }
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                formErrors.electionId ? "border-red-500" : "border-gray-300"
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
                            Max Choices *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.maxChoices}
                            onChange={(e) => {
                                setFormData({ ...formData, maxChoices: e.target.value });
                                if (formErrors.maxChoices) {
                                    setFormErrors({ ...formErrors, maxChoices: false });
                                }
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                formErrors.maxChoices ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="1"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Number of candidates a voter can select for this position</p>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setFormData({
                                    name: "",
                                    electionId: "",
                                    maxChoices: "1",
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
                            {loading ? "Updating..." : "Update Position"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Position"
                size="sm"
            >
                {selectedPosition && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{selectedPosition.name}</strong>?
                        </p>
                        {selectedPosition._count.candidates > 0 || selectedPosition._count.votes > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    This position has {selectedPosition._count.candidates} candidate
                                    {selectedPosition._count.candidates !== 1 ? "s" : ""} and {selectedPosition._count.votes} vote
                                    {selectedPosition._count.votes !== 1 ? "s" : ""}. You cannot delete
                                    it until all candidates and votes are removed.
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
                                disabled={loading || selectedPosition._count.candidates > 0 || selectedPosition._count.votes > 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Deleting..." : "Delete Position"}
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
                        electionId: "",
                        maxChoices: "1",
                    });
                    setFormErrors({});
                }}
                title="Add New Position"
                size="md"
            >
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Position Name *
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
                            placeholder="e.g., President, Secretary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Election *
                        </label>
                        <select
                            value={formData.electionId}
                            onChange={(e) => {
                                setFormData({ ...formData, electionId: e.target.value });
                                if (formErrors.electionId) {
                                    setFormErrors({ ...formErrors, electionId: false });
                                }
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                formErrors.electionId ? "border-red-500" : "border-gray-300"
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
                            Max Choices *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.maxChoices}
                            onChange={(e) => {
                                setFormData({ ...formData, maxChoices: e.target.value });
                                if (formErrors.maxChoices) {
                                    setFormErrors({ ...formErrors, maxChoices: false });
                                }
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                formErrors.maxChoices ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="1"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Number of candidates a voter can select for this position</p>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddModal(false);
                                setFormData({
                                    name: "",
                                    electionId: "",
                                    maxChoices: "1",
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
                            {loading ? "Creating..." : "Create Position"}
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

