"use client";
import { useState, useEffect } from "react";
import { Modal } from "../../_components/Modal";
import { SweetAlert } from "../../_components/SweetAlert";
import { EllipsisMenu } from "../../_components/EllipsisMenu";
import { exportVotersToCSV } from "@/lib/excel-export";

interface Department {
    id: number;
    name: string;
}

interface Voter {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    studentId: string | null;
    departmentId: number | null;
    department: Department | null;
    _count: {
        votes: number;
        candidates: number;
    };
}

interface VotersClientProps {
    initialVoters: Voter[];
    departments: Department[];
}

export function VotersClient({ initialVoters, departments }: VotersClientProps) {
    const [voters, setVoters] = useState<Voter[]>(initialVoters);
    const [loading, setLoading] = useState(false);
    const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
    
    // Modal states
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState<{
        email: string;
        password: string;
        voterKey: string;
    } | null>(null);
    
    // Form states
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        studentId: "",
        departmentId: "",
    });
    const [voterCredentials, setVoterCredentials] = useState<Map<number, { password: string; voterKey: string }>>(new Map());
    
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

    const fetchVoters = async () => {
        try {
            const res = await fetch("/api/voters");
            const data = await res.json();
            if (res.ok) {
                setVoters(data.voters);
            }
        } catch (error) {
            console.error("Failed to fetch voters:", error);
        }
    };

    const handleView = (voter: Voter) => {
        setSelectedVoter(voter);
        setShowViewModal(true);
    };

    const handleEdit = (voter: Voter) => {
        setSelectedVoter(voter);
        setFormData({
            email: voter.email,
            firstName: voter.firstName,
            lastName: voter.lastName,
            studentId: voter.studentId || "",
            departmentId: voter.departmentId?.toString() || "",
        });
        setShowEditModal(true);
    };

    const handleDelete = (voter: Voter) => {
        setSelectedVoter(voter);
        setShowDeleteModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVoter) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/voters/${selectedVoter.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    studentId: formData.studentId.trim() || null,
                    departmentId: formData.departmentId || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Voter Updated",
                    message: "The voter has been updated successfully.",
                });
                await fetchVoters();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Update Failed",
                    message: data.error || "Failed to update voter.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Update Failed",
                message: "An error occurred while updating the voter.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedVoter) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/voters/${selectedVoter.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                setShowDeleteModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Voter Deleted",
                    message: "The voter has been deleted successfully.",
                });
                await fetchVoters();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Delete Failed",
                    message: data.error || "Failed to delete voter.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Delete Failed",
                message: "An error occurred while deleting the voter.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.studentId.trim()) {
            setAlert({
                show: true,
                type: "error",
                title: "Validation Error",
                message: "Student ID is required.",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/voters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    studentId: formData.studentId.trim(),
                    departmentId: formData.departmentId || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowAddModal(false);
                const createdEmail = formData.email.trim();
                
                // Store credentials for export
                if (data.voter && data.password && data.voterKey) {
                    setVoterCredentials(prev => {
                        const newMap = new Map(prev);
                        newMap.set(data.voter.id, {
                            password: data.password,
                            voterKey: data.voterKey,
                        });
                        return newMap;
                    });
                }
                
                // Show credentials modal if email failed or if credentials are returned
                if (data.warning && data.password && data.voterKey) {
                    setGeneratedCredentials({
                        email: createdEmail,
                        password: data.password,
                        voterKey: data.voterKey,
                    });
                    setShowCredentialsModal(true);
                    setAlert({
                        show: true,
                        type: "warning",
                        title: "Voter Created",
                        message: data.emailError || "Email could not be sent. Please provide credentials manually.",
                    });
                } else if (data.password && data.voterKey) {
                    // Show credentials even if email was sent (for admin reference)
                    setGeneratedCredentials({
                        email: createdEmail,
                        password: data.password,
                        voterKey: data.voterKey,
                    });
                    setShowCredentialsModal(true);
                    setAlert({
                        show: true,
                        type: "success",
                        title: "Voter Created",
                        message: "The voter has been created successfully. Credentials have been sent to their email.",
                    });
                } else {
                    setAlert({
                        show: true,
                        type: "success",
                        title: "Voter Created",
                        message: "The voter has been created successfully. Credentials have been sent to their email.",
                    });
                }
                
                setFormData({
                    email: "",
                    firstName: "",
                    lastName: "",
                    studentId: "",
                    departmentId: "",
                });
                await fetchVoters();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Create Failed",
                    message: data.error || "Failed to create voter.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Create Failed",
                message: "An error occurred while creating the voter.",
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
                        <h1 className="text-3xl font-bold text-gray-900">Manage Voters</h1>
                        <p className="text-gray-600 mt-1">View and manage registered student voters.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                try {
                                    // Map voters with credentials from memory (for newly created voters)
                                    const exportData = voters.map(voter => ({
                                        studentId: voter.studentId || "",
                                        firstName: voter.firstName,
                                        lastName: voter.lastName,
                                        department: voter.department?.name || "",
                                        email: voter.email,
                                        password: voterCredentials.get(voter.id)?.password || "N/A (Created before export)",
                                        voterKey: voterCredentials.get(voter.id)?.voterKey || "N/A (Created before export)",
                                    }));
                                    
                                    exportVotersToCSV(exportData, "voters");
                                    setAlert({
                                        show: true,
                                        type: "success",
                                        title: "Export Started",
                                        message: "Voter data is being downloaded as CSV file. Note: Credentials are only available for voters created in this session.",
                                    });
                                } catch (error) {
                                    setAlert({
                                        show: true,
                                        type: "error",
                                        title: "Export Failed",
                                        message: "Failed to export voter data.",
                                    });
                                }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download CSV
                        </button>
                        <button
                            onClick={() => {
                                setFormData({
                                    email: "",
                                    firstName: "",
                                    lastName: "",
                                    studentId: "",
                                    departmentId: "",
                                });
                                setShowAddModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            ➕ Add Voter
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Total Voters:</strong> {voters.length} registered students
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {voters.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No voters registered yet. Add your first voter to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    voters.map((voter) => (
                                        <tr key={voter.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {voter.studentId || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {voter.firstName} {voter.lastName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {voter.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {voter.department?.name || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end">
                                                    <EllipsisMenu
                                                        items={[
                                                            {
                                                                label: "View",
                                                                onClick: () => handleView(voter),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Edit",
                                                                onClick: () => handleEdit(voter),
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Download",
                                                                onClick: () => {
                                                                    const creds = voterCredentials.get(voter.id);
                                                                    const exportData = [{
                                                                        studentId: voter.studentId || "",
                                                                        firstName: voter.firstName,
                                                                        lastName: voter.lastName,
                                                                        department: voter.department?.name || "",
                                                                        email: voter.email,
                                                                        password: creds?.password || "N/A (Created before export)",
                                                                        voterKey: creds?.voterKey || "N/A (Created before export)",
                                                                    }];
                                                                    exportVotersToCSV(exportData, `voter_${voter.studentId || voter.id}`);
                                                                    setAlert({
                                                                        show: true,
                                                                        type: creds ? "success" : "warning",
                                                                        title: "Export Started",
                                                                        message: creds 
                                                                            ? "Voter data is being downloaded." 
                                                                            : "Voter data is being downloaded. Note: Credentials are only available for voters created in this session.",
                                                                    });
                                                                },
                                                                icon: (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                ),
                                                            },
                                                            {
                                                                label: "Delete",
                                                                onClick: () => handleDelete(voter),
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
                </div>
            </div>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Voter Details"
            >
                {selectedVoter && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ID</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedVoter.id}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Student ID</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedVoter.studentId || "—"}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedVoter.firstName} {selectedVoter.lastName}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedVoter.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedVoter.department?.name || "—"}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Votes</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedVoter._count.votes} vote{selectedVoter._count.votes !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Candidates</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedVoter._count.candidates} candidate
                                {selectedVoter._count.candidates !== 1 ? "s" : ""}
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
                        email: "",
                        firstName: "",
                        lastName: "",
                        studentId: "",
                        departmentId: "",
                    });
                }}
                title="Edit Voter"
                size="lg"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="student@unimak.edu.sl"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Student ID *
                        </label>
                        <input
                            type="text"
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="CS/2025/0012"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Required and must be unique</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                        </label>
                        <select
                            value={formData.departmentId}
                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="">Select a department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setFormData({
                                    email: "",
                                    firstName: "",
                                    lastName: "",
                                    studentId: "",
                                    departmentId: "",
                                });
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
                            {loading ? "Updating..." : "Update Voter"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Voter"
                size="sm"
            >
                {selectedVoter && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{selectedVoter.firstName} {selectedVoter.lastName}</strong>?
                        </p>
                        {selectedVoter._count.votes > 0 || selectedVoter._count.candidates > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    This voter has {selectedVoter._count.votes} vote
                                    {selectedVoter._count.votes !== 1 ? "s" : ""} and{" "}
                                    {selectedVoter._count.candidates} candidate
                                    {selectedVoter._count.candidates !== 1 ? "s" : ""}. You cannot delete
                                    it until all votes and candidates are removed.
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
                                disabled={
                                    loading ||
                                    selectedVoter._count.votes > 0 ||
                                    selectedVoter._count.candidates > 0
                                }
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Deleting..." : "Delete Voter"}
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
                        email: "",
                        firstName: "",
                        lastName: "",
                        studentId: "",
                        departmentId: "",
                    });
                }}
                title="Add New Voter"
                size="lg"
            >
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-800">
                            <strong>ℹ️ Note:</strong> A random password and voter key will be automatically generated and sent to the voter's email.
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="student@unimak.edu.sl"
                            required
                            autoComplete="email"
                        />
                        <p className="mt-1 text-xs text-gray-500">Must be unique</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Student ID *
                        </label>
                        <input
                            type="text"
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="CS/2025/0012"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Required and must be unique</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                        </label>
                        <select
                            value={formData.departmentId}
                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="">Select a department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddModal(false);
                                setFormData({
                                    email: "",
                                    firstName: "",
                                    lastName: "",
                                    studentId: "",
                                    departmentId: "",
                                });
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
                            {loading ? "Creating..." : "Create Voter"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Credentials Modal */}
            <Modal
                isOpen={showCredentialsModal}
                onClose={() => {
                    setShowCredentialsModal(false);
                    setGeneratedCredentials(null);
                }}
                title="Voter Credentials"
                size="md"
            >
                {generatedCredentials && (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>⚠️ Important:</strong> Please save these credentials. They cannot be retrieved later.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={generatedCredentials.email}
                                        readOnly
                                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-black bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(generatedCredentials.email);
                                                setAlert({
                                                    show: true,
                                                    type: "success",
                                                    title: "Copied!",
                                                    message: "Email copied to clipboard",
                                                });
                                            } catch (err) {
                                                setAlert({
                                                    show: true,
                                                    type: "error",
                                                    title: "Copy Failed",
                                                    message: "Failed to copy to clipboard",
                                                });
                                            }
                                        }}
                                        className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={generatedCredentials.password}
                                        readOnly
                                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-black bg-gray-50 font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(generatedCredentials.password);
                                                setAlert({
                                                    show: true,
                                                    type: "success",
                                                    title: "Copied!",
                                                    message: "Password copied to clipboard",
                                                });
                                            } catch (err) {
                                                setAlert({
                                                    show: true,
                                                    type: "error",
                                                    title: "Copy Failed",
                                                    message: "Failed to copy to clipboard",
                                                });
                                            }
                                        }}
                                        className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Voter Key
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={generatedCredentials.voterKey}
                                        readOnly
                                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-black bg-gray-50 font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(generatedCredentials.voterKey);
                                                setAlert({
                                                    show: true,
                                                    type: "success",
                                                    title: "Copied!",
                                                    message: "Voter Key copied to clipboard",
                                                });
                                            } catch (err) {
                                                setAlert({
                                                    show: true,
                                                    type: "error",
                                                    title: "Copy Failed",
                                                    message: "Failed to copy to clipboard",
                                                });
                                            }
                                        }}
                                        className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> The voter will need to use these credentials to log in at <code className="bg-blue-100 px-1 rounded">/voter/login</code>. 
                                They will be required to verify their email with an OTP on first login.
                            </p>
                        </div>
                        
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const text = `Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}\nVoter Key: ${generatedCredentials.voterKey}`;
                                        await navigator.clipboard.writeText(text);
                                        setAlert({
                                            show: true,
                                            type: "success",
                                            title: "Copied!",
                                            message: "All credentials copied to clipboard",
                                        });
                                    } catch (err) {
                                        setAlert({
                                            show: true,
                                            type: "error",
                                            title: "Copy Failed",
                                            message: "Failed to copy to clipboard",
                                        });
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Copy All
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCredentialsModal(false);
                                    setGeneratedCredentials(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                Close
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

