"use client"
import React, {useEffect, useMemo, useRef, useState} from "react";
import {User, UserRole, UserStatus, UserUpdate} from "@/models";
import {formatDate} from "@/helper";
import {CheckCircle, Edit, Eye, Loader2, MoreHorizontal, MoreVertical, Trash2, Undo, X} from "lucide-react";
import {AnimatePresence, motion} from "framer-motion";
import toast from "react-hot-toast";
import {userService} from "@/services";
import {useDialog} from "@/app/_providers/dialog";
import useApp from "@/ui/provider/AppProvider";
import {showModal} from "@/ui/shortcuts";
import alert from "@/ui/alert";
import Dropdown from "@/ui/materia_screen/components/Dropdown";

type UserTableProps = {
    users: User[];
    isAdmin?: boolean;
    onStatusChange: (userId: string, status: UserStatus) => void;
    onDeleteUser: (userId: string) => void;
};

export default function UserTable({
                                      users,
                                      onStatusChange,
                                      onDeleteUser,
                                      isAdmin = false,
                                  }: UserTableProps) {
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState<UserUpdate | null>(null);
    const [scrollY, setScrollY] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletedUser, setDeletedUser] = useState<User | null>(null);
    const [deletedUserIndex, setDeletedUserIndex] = useState<number>(-1);
    const [undoTimer, setUndoTimer] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const tableRef = useRef<HTMLDivElement>(null);
    const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [localUsers, setLocalUsers] = useState<User[]>([]);
    const [isMobileView, setIsMobileView] = useState(false);
    const [visibleUsers, setVisibleUsers] = useState<number>(10);
    const [hasMore, setHasMore] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const {user} = useApp() // Current logged-in user


    const containerRef = useRef<HTMLDivElement>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                setScrolled(containerRef.current.scrollLeft > 0);
            }
        };
        const container = containerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    // Initialize local users state from props
    useEffect(() => {
        setLocalUsers(users);
    }, [users]);

    // Use localUsers directly as they are already filtered by the parent component
    const filteredUsers = useMemo(() => {
        return localUsers;
    }, [localUsers]);

    // Update scroll position when user scrolls
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Check screen size and set mobile view
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth < 768); // 768px is a common breakpoint for mobile
        };

        // Initial check
        checkScreenSize();

        // Add event listener for window resize
        window.addEventListener('resize', checkScreenSize);

        // Cleanup
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Update visible users for mobile view
    useEffect(() => {
        setHasMore(filteredUsers.length > visibleUsers);
    }, [filteredUsers, visibleUsers]);

    const loadMoreUsers = () => {
        setVisibleUsers(prev => Math.min(prev + 10, filteredUsers.length));
    };

    // Toggle dropdown for mobile view
    const toggleDropdown = (userId: string) => {
        setActiveDropdown(activeDropdown === userId ? null : userId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    // Handle undo timer countdown
    useEffect(() => {
        // Only start/continue countdown if we have a deleted user and positive timer
        if (deletedUser && undoTimer > 0) {
            // Clear any existing timer to prevent multiple timers
            if (undoTimerRef.current) {
                clearTimeout(undoTimerRef.current);
            }

            // Set new timer to decrement counter
            undoTimerRef.current = setTimeout(() => {
                setUndoTimer(prevTimer => prevTimer - 1);
            }, 1000);

            // Cleanup function to clear timer when component unmounts or dependencies change
            return () => {
                if (undoTimerRef.current) {
                    clearTimeout(undoTimerRef.current);
                    undoTimerRef.current = null;
                }
            };
        } else if (deletedUser && undoTimer === 0) {
            // Time's up, finalize deletion
            finalizeDelete();
        }
    }, [deletedUser, undoTimer]);

    const handleStatusToggle = async (user: User) => {
        try {
            const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
            await onStatusChange(user.id, newStatus);

            // Update local state
            setLocalUsers(prevUsers =>
                prevUsers.map(u => u.id === user.id ? {...u, status: newStatus} : u)
            );

            toast.success(`User ${newStatus === UserStatus.ACTIVE ? 'activated' : 'suspended'} successfully`);
        } catch (error) {
            toast.error("Failed to update user status");
            console.error(error);
        }
    };

    const handleDeleteClick = (user: User) => {
        // const d = dialog.create({
        //     content: (
        //
        //         <div className="p-6 bg-white rounded-md dark:bg-gray-800">
        //             <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Deletion</h3>
        //             <p className="mb-6 text-gray-700 dark:text-gray-300">
        //                 Are you sure you want to delete {user.full_name}?
        //             </p>
        //             <div className="flex justify-end space-x-3">
        //                 <button
        //                     onClick={() => d.dismiss()}
        //                     className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        //                 >
        //                     Cancel
        //                 </button>
        //                 <button
        //                     onClick={() => {
        //                         d.dismiss();
        //                         );
        //                     }}
        //                     className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800"
        //                 >
        //                     Delete
        //                 </button>
        //             </div>
        //         </div>
        //     ),
        // });
        // setConfirmDelete(user.id);
        alert.confirm({
            type: alert.ERROR,
            message: `Confirm deletion of ${user.full_name}`,
            title: "User Manager",
            async task() {
                return confirmDeleteUser(user)
            }
        })
    };

    const confirmDeleteUser = async (deletedUser: User) => {
        // Actually delete from database
        //@ts-ignore
        const response = await userService.deleteUser<User>(deletedUser.id, user);
        console.log(response)
        if (response.data) {
            // Success - user was deleted
            setSuccessMessage(`User ${deletedUser.full_name} has been deleted successfully`);
            // Call parent's onDeleteUser to update parent state
            onDeleteUser(deletedUser.id);

            // Reset delete state after successful deletion
            resetDeleteState();
            return true
        } else {
            // Error - deletion failed
            const errorMessage = response.error?.message || 'Unknown error';
            toast.error(`Failed to delete user: ${errorMessage}`);

            // Add the user back to the list since deletion failed
            restoreDeletedUser();
            resetDeleteState();
            throw response.error;
        }

    };

    const finalizeDelete = async () => {
        if (deletedUser) {
            try {
                // Actually delete from database
                //@ts-ignore
                const response = await userService.deleteUser<User>(deletedUser.id, user);

                if (response.data) {
                    // Success - user was deleted
                    setSuccessMessage(`User ${deletedUser.full_name} has been deleted successfully`);
                    setShowSuccessModal(true);
                    setTimeout(() => setShowSuccessModal(false), 3000);

                    // Call parent's onDeleteUser to update parent state
                    onDeleteUser(deletedUser.id);

                    // Reset delete state after successful deletion
                    resetDeleteState();
                } else {
                    // Error - deletion failed
                    const errorMessage = response.error?.message || 'Unknown error';
                    toast.error(`Failed to delete user: ${errorMessage}`);

                    // Add the user back to the list since deletion failed
                    restoreDeletedUser();
                    resetDeleteState();
                }
            } catch (error: any) {
                console.error("Error finalizing deletion:", error);
                toast.error(`Failed to delete user: ${error?.message || 'Unknown error'}`);

                // Add the user back to the list since deletion failed
                restoreDeletedUser();
                resetDeleteState();
            }
        }
    };

    const restoreDeletedUser = () => {
        if (deletedUser && deletedUserIndex >= 0) {
            // Create a new array with the user inserted back at the original position
            setLocalUsers(prevUsers => {
                const newUsers = [...prevUsers];
                // Make sure we don't insert beyond array bounds
                const insertIndex = Math.min(deletedUserIndex, newUsers.length);
                newUsers.splice(insertIndex, 0, deletedUser);
                return newUsers;
            });

            // Show success message
            toast.success(`User ${deletedUser.full_name} has been restored`);
        }
    };

    const resetDeleteState = () => {
        // Clear any active timer
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }

        // Reset all deletion-related state
        setDeletedUser(null);
        setDeletedUserIndex(-1);
        setUndoTimer(0);
        setConfirmDelete(null);
    };

    const handleUndoDelete = () => {
        if (deletedUser) {
            // Clear the timer
            if (undoTimerRef.current) {
                clearTimeout(undoTimerRef.current);
                undoTimerRef.current = null;
            }

            // Add the user back to the list at the original position
            restoreDeletedUser();

            // Reset state
            resetDeleteState();
        }
    };

    const cancelUndo = () => {
        // Clear the timer if it exists
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }

        // Proceed with deletion immediately
        finalizeDelete();
    };

    const dialog = useDialog()
    const handleViewUser = (viewing: User) => {
        setViewUser(viewing);
        showModal({
            content: onClose =>
                <ViewDetails viewing={viewing} onClose={onClose} user={user} setShowSuccessModal={setShowSuccessModal}
                             setSuccessMessage={setSuccessMessage}/>,
            size: "lg"
        })
    };

    const handleEditUser = (user: User) => {
        setEditUser(user);
        const formData = {
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            id_number: user.id_number,
            role: user.role,
            status: user.status
        };
        setEditFormData(formData);

        showModal({
            content: onClose => (

                <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Edit User
                        </h3>
                        <button
                            onClick={() => onClose()}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl font-bold transition-colors"
                        >
                            ×
                        </button>
                    </div>
                    <form className="space-y-6" onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitEdit(e).then(() => onClose());
                    }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    ID Number
                                </label>
                                <input
                                    type="text"
                                    name="id_number"
                                    value={formData.id_number}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Role
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="TEAM_LEADER">Team Leader</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="SUSPENDED">Suspended</option>
                                    <option value="PENDING_APPROVAL">Pending Approval</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => onClose()}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin"/>
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ),
            size: "lg"
        })
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setEditFormData(prev => prev ? {...prev, [name]: value} : null);
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser || !editFormData) return;

        setIsSubmitting(true);
        try {
            const response = await userService.updateUser(editUser.id, editFormData, user!);
            if (response.data) {
                // Update local state
                setLocalUsers(prevUsers =>
                    prevUsers.map(u => u.id === editUser.id ? {...u, ...editFormData} : u)
                );

                setSuccessMessage(`User ${editUser.full_name} has been updated successfully`);
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 3000);
                closeModals();

                // Force a page reload to ensure the user list is updated
                window.location.reload();
            } else {
                toast.error("Failed to update user");
            }
        } catch (error) {
            toast.error("An error occurred while updating user");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };


    const closeModals = () => {
        setViewUser(null);
        setEditUser(null);
        setEditFormData(null);
        setShowSuccessModal(false);
    };

    return (
        <div
            className="w-full bg-white dark:bg-gray-800 rounded-lg relative"
            ref={tableRef}
        >

            {/* Desktop View - Table */}
            {!isMobileView && (
                <div className="w-full">
                    <div className="py-2 align-middle px-4">
                        <div className="shadow-sm border-b border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="overflow-x-auto" ref={containerRef}>
                                <table
                                    className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed md:table-auto">
                                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Name
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            ID Number
                                        </th>
                                        {
                                            isAdmin && (
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                                >
                                                    Role
                                                </th>
                                            )
                                        }
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Last Login
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 transition-colors duration-200"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody
                                        className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-gray-50 bg-white dark:hover:bg-gray-800 even:bg-gray-50 dark:even:bg-gray-800/50"
                                            >
                                                <td className={`sticky px-2 py-2 ${scrolled && 'absolute'} left-0 border-r border-gray-200  whitespace-nowrap  bg-inherit`}>
                                                    <div className={`inline-flex items-center`}>
                                                        <div>
                                                            <div
                                                                className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {user.full_name}
                                                            </div>
                                                            <p className={"text-xs text-gray-500"}>Identity: {user.email ?? user.phone_number ?? user.username}</p>
                                                            <div
                                                                className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span
                                        className={`px-2 py-1 rounded-full ${
                                            user.status === "ACTIVE"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : user.status === "SUSPENDED"
                                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        }`}
                                    >
                                      {user.status}
                                    </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {user.id_number}
                                                </td>
                                                {
                                                    isAdmin && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                          <span
                                                              className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {user.role}
                                                          </span>
                                                        </td>
                                                    )
                                                }
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {user.last_login_at
                                                        ? formatDate(user.last_login_at)
                                                        : "Never"}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                    <div className="flex flex-w rap items-center gap-2 md:gap-3">
                                                        <button
                                                            onClick={() => handleViewUser(user)}
                                                            className="inline-flex items-center px-2 py-1 text-sm rounded-md text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-200"
                                                        >
                                                            <Eye size={16} className="mr-1"/>
                                                            View
                                                        </button>
                                                        <Dropdown
                                                            trigger={<button
                                                                className={`inline-flex cursor-pointer items-center px-2 py-1 text-sm rounded-md text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-200`}>
                                                                <MoreVertical className="h-4 w-4 mr-1"/>
                                                            </button>}
                                                            //@ts-ignore
                                                            options={[
                                                                {
                                                                    key: 'edit',
                                                                    value: 'edit',
                                                                    label: 'Edit User',
                                                                    className: "text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center",
                                                                    icon: <Edit className={"h-4 w-4"}/>,
                                                                },
                                                                {
                                                                    key: 'del',
                                                                    value: 'del',
                                                                    label: 'Delete User',
                                                                    className: "text-sm text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center",
                                                                    icon: <Trash2 className={"h-4 w-4"}/>,
                                                                }
                                                            ] as any}
                                                            onSelect={(option: any) => {
                                                                (
                                                                    {
                                                                        def: () => {
                                                                        },
                                                                        edit: handleEditUser,
                                                                        del: handleEditUser,
                                                                    } as any
                                                                )[option.value ?? 'def']?.(user);
                                                            }}
                                                            position="bottom-right"
                                                            dropdownClassName="min-w-[260px]"
                                                            zIndex={100}
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
                </div>
            )}

            {/* Mobile View - Card Layout */}
            {isMobileView && (
                <div className="space-y-2 px-4 py-2">
                    {filteredUsers.length === 0 ? (
                        <div
                            className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">
                                No users found
                            </p>
                        </div>
                    ) : (
                        <>
                            {filteredUsers.slice(0, visibleUsers).map((user) => (
                                <div
                                    key={user.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                                >
                                    <div
                                        className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{user.full_name}</h3>
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleDropdown(user.id)}
                                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                                            >
                                                <MoreHorizontal className="h-4 w-4"/>
                                            </button>

                                            <AnimatePresence>
                                                {activeDropdown === user.id && (
                                                    <motion.div
                                                        //@ts-ignore
                                                        ref={(el) => (dropdownRefs.current[user.id] = el)}
                                                        className="absolute right-0 mt-1 z-10 w-44 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                                        initial={{opacity: 0, y: -10}}
                                                        animate={{opacity: 1, y: 0}}
                                                        exit={{opacity: 0, y: -10}}
                                                        transition={{duration: 0.2}}
                                                    >
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => {
                                                                    handleViewUser(user);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Eye
                                                                    className="h-3 w-3 mr-1 text-indigo-500 dark:text-indigo-400"/>
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleEditUser(user);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Edit className="h-3 w-3 mr-1"/>
                                                                Edit User
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    handleDeleteClick(user);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1"/>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="px-3 py-2 space-y-1">
                                        <div className="flex flex-wrap items-center text-xs">
                                            <div className="flex items-center mr-3">
                                                <span
                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                        user.status === "ACTIVE"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                            : user.status === "SUSPENDED"
                                                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </div>
                                            {
                                                user.role === UserRole.TEAM_LEADER && (
                                                    <div className="flex items-center">
                                                        <span
                                                            className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                )
                                            }
                                        </div>

                                        <div className="flex items-center text-xs">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">ID Number:</span>
                                            <span
                                                className="ml-1 text-gray-600 dark:text-gray-400">{user.id_number}</span>
                                        </div>

                                        <div className="flex items-center text-xs">
                                            <span
                                                className="text-gray-700 dark:text-gray-300 font-medium">Identity:</span>
                                            <span
                                                className="ml-1 text-gray-600 dark:text-gray-400 truncate">{user.email ?? user.phone_number ?? user.username}</span>
                                        </div>

                                        <div className="flex items-center text-xs">
                                            <span
                                                className="text-gray-700 dark:text-gray-300 font-medium">Last Login:</span>
                                            <span className="ml-1 text-gray-600 dark:text-gray-400">
                                                {user.last_login_at ? formatDate(user.last_login_at) : "Never"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-3 py-1 bg-gray-50 dark:bg-gray-700 flex justify-end">
                                        <button
                                            onClick={() => handleViewUser(user)}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
                                        >
                                            <Eye className="h-3 w-3 mr-1"/>
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="flex justify-center mt-3">
                                    <button
                                        onClick={loadMoreUsers}
                                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}


            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{opacity: 0, y: 50}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 50}}
                        className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-md shadow-lg z-50"
                    >
                        <div className="flex items-center">
                            <CheckCircle className="mr-2" size={20}/>
                            <p>{successMessage}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Undo Delete Bar */}
            <AnimatePresence>
                {deletedUser && (
                    <div
                        className="fixed top-4 max-h-max left-1/2 transform -translate-x-1/2 bg-gray-800 gap-1 text-white px-4 rounded-lg shadow-lg flex justify-between items-center z-50 min-w-max max-w-screen py-1"
                    >
                        <div className="flex pt-1 items-center">
                            <p>
                                User {deletedUser.full_name} deleted. Undo in {undoTimer}{" "}
                                seconds.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div
                                className="bg-gray-100 rounded-sm h-[2px]  absolute top-[1px] w-full transition-all duration-200 left-0">
                                <div
                                    className="bg-green-500 h-[2px] rounded-full transition-all duration-1000 ease-linear"
                                    style={{width: `${(undoTimer / 5) * 100}%`}}
                                ></div>
                            </div>
                            <button
                                onClick={handleUndoDelete}
                                className="flex items-center bg-white  text-xs text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100"
                            >
                                <Undo size={14} className="mr-1"/>
                                Undo
                            </button>
                            <button
                                onClick={cancelUndo}
                                className="flex items-center bg-transparent text-white hover:text-gray-300"
                                aria-label="Cancel"
                            >
                                <X size={18}/>
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


function ViewDetails({onClose, viewing, setSuccessMessage, setShowSuccessModal, user}: any) {
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const handleResetPassword = async (targetUser: User) => {
        setIsResettingPassword(true);
        try {
            const response = await fetch('/api/auth/staff/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: targetUser.id,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSuccessMessage(`Password for ${targetUser.full_name} has been reset to their username and is_first_login set to true`);
                setTimeout(() => setShowSuccessModal(false), 3000);
                toast.success('Password reset successfully');
            } else {
                toast.error(`Failed to reset password: ${result.message}`);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('An error occurred while resetting the password');
        } finally {
            setIsResettingPassword(false);
        }
    };
    return (
        <div className={"w-full bg-gray-50 dark:bg-gray-800 rounded-md p-6"}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    User Details
                </h3>
                <button
                    onClick={() => onClose()}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl font-bold"
                >
                    ×
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Full Name
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                        {viewing.full_name}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                    </p>
                    <p className="text-base text-gray-900 dark:text-white break-words">
                        {viewing.email}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Phone Number
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                        {viewing.phone_number}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ID Number
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                        {viewing.id_number}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                        {viewing.status}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Last Login
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                        {viewing.last_login_at
                            ? formatDate(viewing.last_login_at)
                            : "Never"}
                    </p>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                {viewing?.role === UserRole.STAFF && user?.role === UserRole.TEAM_LEADER && (
                    <button
                        onClick={() => handleResetPassword(viewing!)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
                        disabled={isResettingPassword}
                    >
                        {isResettingPassword ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                )}
                <button
                    onClick={() => onClose()}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    Close
                </button>
            </div>
        </div>
    )
}
