"use client";
import { useState, useEffect } from "react";
import { Modal } from "../../_components/Modal";
import { SweetAlert } from "../../_components/SweetAlert";

interface Department {
    id: number;
    name: string;
    _count: {
        students: number;
        elections: number;
    };
}

interface DepartmentsClientProps {
    initialDepartments: Department[];
}

export function DepartmentsClient({ initialDepartments }: DepartmentsClientProps) {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [loading, setLoading] = useState(false);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    
    // Modal states
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form states
    const [editName, setEditName] = useState("");
    const [addName, setAddName] = useState("");
    
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

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            const data = await res.json();
            if (res.ok) {
                setDepartments(data.departments);
            }
        } catch (error) {
            console.error("Failed to fetch departments:", error);
        }
    };

    const handleView = (dept: Department) => {
        setSelectedDept(dept);
        setShowViewModal(true);
    };

    const handleEdit = (dept: Department) => {
        setSelectedDept(dept);
        setEditName(dept.name);
        setShowEditModal(true);
    };

    const handleDelete = (dept: Department) => {
        setSelectedDept(dept);
        setShowDeleteModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDept || !editName.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/departments/${selectedDept.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Department Updated",
                    message: "The department has been updated successfully.",
                });
                await fetchDepartments();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Update Failed",
                    message: data.error || "Failed to update department.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Update Failed",
                message: "An error occurred while updating the department.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDept) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/departments/${selectedDept.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                setShowDeleteModal(false);
                setAlert({
                    show: true,
                    type: "success",
                    title: "Department Deleted",
                    message: "The department has been deleted successfully.",
                });
                await fetchDepartments();
            } else {
                setAlert({
                    show: true,
                    type: "error",
                    title: "Delete Failed",
                    message: data.error || "Failed to delete department.",
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: "error",
                title: "Delete Failed",
                message: "An error occurred while deleting the department.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addName.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: addName.trim() }),
            });

            let data;
            try {
                data = await res.json();
            } catch (parseError) {
                console.error("Failed to parse response:", parseError);
                setAlert({
                    show: true,
                    type: "error",
                    title: "Create Failed",
                    message: `Server returned an invalid response (${res.status}). Please try again.`,
                });
                setLoading(false);
                return;
            }

            if (res.ok || res.status === 201) {
                setShowAddModal(false);
                setAddName("");
                setAlert({
                    show: true,
                    type: "success",
                    title: "Department Created",
                    message: "The department has been created successfully.",
                });
                await fetchDepartments();
            } else {
                console.error("Create department error:", data);
                setAlert({
                    show: true,
                    type: "error",
                    title: "Create Failed",
                    message: data.error || `Failed to create department. (Status: ${res.status})`,
                });
            }
        } catch (error: any) {
            console.error("Create department error:", error);
            setAlert({
                show: true,
                type: "error",
                title: "Create Failed",
                message: error?.message || "An error occurred while creating the department. Please check your connection and try again.",
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
                        <h1 className="text-3xl font-bold text-gray-900">Manage Departments</h1>
                        <p className="text-gray-600 mt-1">View and manage university departments.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        ➕ Add Department
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Total Departments:</strong> {departments.length}
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Students
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Elections
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No departments found. Add your first department to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept) => (
                                        <tr key={dept.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {dept.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {dept.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {dept._count.students} student{dept._count.students !== 1 ? "s" : ""}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {dept._count.elections} election{dept._count.elections !== 1 ? "s" : ""}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleView(dept)}
                                                        className="text-blue-600 hover:text-blue-900 font-medium"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(dept)}
                                                        className="text-green-600 hover:text-green-900 font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept)}
                                                        className="text-red-600 hover:text-red-900 font-medium"
                                                    >
                                                        Delete
                                                    </button>
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
                title="Department Details"
            >
                {selectedDept && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ID</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedDept.id}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Department Name
                            </label>
                            <p className="mt-1 text-sm text-gray-900">{selectedDept.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Students</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedDept._count.students} student
                                {selectedDept._count.students !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Elections</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedDept._count.elections} election
                                {selectedDept._count.elections !== 1 ? "s" : ""}
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
                    setEditName("");
                }}
                title="Edit Department"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department Name
                        </label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Enter department name"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setEditName("");
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
                            {loading ? "Updating..." : "Update Department"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Department"
                size="sm"
            >
                {selectedDept && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{selectedDept.name}</strong>?
                        </p>
                        {selectedDept._count.students > 0 || selectedDept._count.elections > 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    This department has {selectedDept._count.students} student
                                    {selectedDept._count.students !== 1 ? "s" : ""} and{" "}
                                    {selectedDept._count.elections} election
                                    {selectedDept._count.elections !== 1 ? "s" : ""}. You cannot delete
                                    it until all students and elections are removed.
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
                                    selectedDept._count.students > 0 ||
                                    selectedDept._count.elections > 0
                                }
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Deleting..." : "Delete Department"}
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
                    setAddName("");
                }}
                title="Add New Department"
            >
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department Name
                        </label>
                        <input
                            type="text"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Enter department name"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddModal(false);
                                setAddName("");
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
                            {loading ? "Creating..." : "Create Department"}
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

